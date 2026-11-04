import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface ParsedTransaction {
  seqNo: number;
  dateStr: string;
  name: string;
  type: 'MASUK' | 'KELUAR';
  category: 'PENJUALAN' | 'BAHAN_BAKU' | 'PACKAGING' | 'OPERASIONAL' | 'PINDAH_SALDO' | 'MODAL' | 'LAINNYA';
  amount: number;
  balance: number;
  notes: string | null;
  cashier: string | null;
}

function parseCurrency(str: string): number {
  if (!str) return 0;
  let clean = str.replace(/Rp/g, '').replace(/\s/g, '').trim();
  let isNegative = clean.startsWith('-');
  if (isNegative) clean = clean.substring(1);
  clean = clean.split(',')[0];
  clean = clean.replace(/\./g, '');
  const num = parseInt(clean, 10) || 0;
  return isNegative ? -num : num;
}

function normalizeDate(rawDate: string, lastDate: string): string {
  if (!rawDate || !rawDate.trim()) return lastDate || '01/04/2026';
  let d = rawDate.trim();
  // Fix typos like 24/20/2026 -> 24/10/2026
  if (d === '24/20/2026') return '24/10/2026';
  const parts = d.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${day}/${month}/${year}`;
  }
  return d;
}

function parseDateToUTC(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function determineCategory(name: string, notes: string | null): ParsedTransaction['category'] {
  const n = (name + ' ' + (notes || '')).toLowerCase();
  
  if (n.includes('pindah saldo') || n.includes('pindah ke cash') || n.includes('tuker cash')) {
    return 'PINDAH_SALDO';
  }
  if (n.includes('refund modal') || n.includes('modal')) {
    return 'MODAL';
  }
  if (
    n.includes('parkir') ||
    n.includes('ongkir') ||
    n.includes('lalamove') ||
    n.includes('makan') ||
    n.includes('air') ||
    n.includes('nota') ||
    n.includes('pulsa') ||
    n.includes('youtube') ||
    n.includes('baterai') ||
    n.includes('paruh waktu') ||
    n.includes('stempel') ||
    n.includes('registrasi') ||
    n.includes('registra') ||
    n.includes('tenant pmi') ||
    n.includes('tip') ||
    n.includes('hand mixer') ||
    n.includes('bar mate') ||
    n.includes('cooler box') ||
    n.includes('sunlight')
  ) {
    return 'OPERASIONAL';
  }
  if (
    n.includes('botol') ||
    n.includes('cup') ||
    n.includes('tutup') ||
    n.includes('kresek') ||
    n.includes('sedotan') ||
    n.includes('stiker') ||
    n.includes('solasi') ||
    n.includes('standing pouch')
  ) {
    return 'PACKAGING';
  }
  if (
    n.includes('kopi') ||
    n.includes('cremmer') ||
    n.includes('krimer') ||
    n.includes('susu') ||
    n.includes('diamond') ||
    n.includes('syrup') ||
    n.includes('sirup') ||
    n.includes('gula') ||
    n.includes('es batu') ||
    n.includes('rich milk') ||
    n.includes('powder') ||
    n.includes('lets brew') ||
    n.includes('letsbrew') ||
    n.includes('javanica') ||
    n.includes('eclipse') ||
    n.includes('fromus') ||
    n.includes('framous') ||
    n.includes('aurora') ||
    n.includes('juice') ||
    n.includes('minerale') ||
    n.includes('biji') ||
    n.includes('superindo')
  ) {
    return 'BAHAN_BAKU';
  }
  if (
    n.includes('latte') ||
    n.includes('matcha') ||
    n.includes('choco') ||
    n.includes('pendapatan') ||
    n.includes('bundling') ||
    n.includes('bazaar') ||
    n.includes('orca') ||
    n.includes('mokaku') ||
    n.includes('iconext') ||
    n.includes('conext') ||
    n.includes('prabaswara') ||
    n.includes('polman')
  ) {
    return 'PENJUALAN';
  }

  return 'OPERASIONAL';
}

function parseSheet(filePath: string, defaultNameFallback?: string): ParsedTransaction[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = content.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  const results: ParsedTransaction[] = [];
  let lastDate = '01/04/2026';

  for (let i = 2; i < rows.length; i++) {
    const row = rows[i];
    const cells = (row.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []).map((c) =>
      c.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
    );

    if (cells.length < 6) continue;

    const noStr = cells[0];
    const seqNo = parseInt(noStr, 10);
    if (isNaN(seqNo)) continue;

    const rawDate = cells[1];
    if (rawDate) {
      lastDate = normalizeDate(rawDate, lastDate);
    }

    let name = cells[2];
    const masuk = parseCurrency(cells[3]);
    const keluar = parseCurrency(cells[4]);
    const total = parseCurrency(cells[5]);
    const rawKet = cells[6] || '';

    // If both masuk and keluar are 0, this is an empty template or subtotal separator row
    if (masuk === 0 && keluar === 0) continue;

    if (!name && masuk > 0 && defaultNameFallback) {
      name = defaultNameFallback;
    }
    if (!name) continue;

    const type = masuk > 0 ? 'MASUK' : 'KELUAR';
    const amount = masuk > 0 ? masuk : keluar;

    let cashier: string | null = null;
    let notes: string | null = rawKet || null;

    if (rawKet) {
      const knownCashiers = ['Febri', 'Raihan', 'Revan'];
      const matched = knownCashiers.find((c) => rawKet.toLowerCase().includes(c.toLowerCase()));
      if (matched) {
        cashier = matched;
      }
    }

    const category = determineCategory(name, rawKet);

    results.push({
      seqNo,
      dateStr: lastDate,
      name,
      type,
      category,
      amount,
      balance: total,
      notes,
      cashier,
    });
  }

  return results;
}

const RAB_BASE_ITEMS = [
  // --- BULAN MEI 2026 (Total Rp 391.000) ---
  { month: 'MEI 2026', year: 2026, seqNo: 1, name: 'Cup Injection', qty: 200, unit: 'Pcs', unitPrice: 1290, totalPrice: 258000, fundedBy: 'DCC' },
  { month: 'MEI 2026', year: 2026, seqNo: 2, name: 'Tutup Cup Injection', qty: 8, unit: 'Pack', unitPrice: 11500, totalPrice: 92000, fundedBy: 'DCC' },
  { month: 'MEI 2026', year: 2026, seqNo: 3, name: 'Plastik Kresek PE Bening', qty: 1, unit: 'Pack', unitPrice: 18000, totalPrice: 18000, fundedBy: 'DCC' },
  { month: 'MEI 2026', year: 2026, seqNo: 4, name: 'Sedotan', qty: 1, unit: 'Pack', unitPrice: 18000, totalPrice: 18000, fundedBy: 'DCC' },
  { month: 'MEI 2026', year: 2026, seqNo: 5, name: 'Solasi Shoope Food', qty: 1, unit: 'Roll', unitPrice: 5000, totalPrice: 5000, fundedBy: 'DCC' },

  // --- BULAN JUNI 2026 (Total Rp 315.000) ---
  { month: 'JUNI 2026', year: 2026, seqNo: 1, name: 'Kopi Eclipse', qty: 250, unit: 'G', unitPrice: 50000, totalPrice: 50000, fundedBy: 'DCC' },
  { month: 'JUNI 2026', year: 2026, seqNo: 2, name: 'Kopi Fromus', qty: 200, unit: 'G', unitPrice: 56000, totalPrice: 106000, fundedBy: 'DCC' },
  { month: 'JUNI 2026', year: 2026, seqNo: 3, name: 'Cremmer', qty: 2, unit: 'Kg', unitPrice: 48000, totalPrice: 96000, fundedBy: 'DCC' },
  { month: 'JUNI 2026', year: 2026, seqNo: 4, name: 'Susu Diamond', qty: 3, unit: 'L', unitPrice: 21000, totalPrice: 63000, fundedBy: 'DCC' },

  // --- BULAN JULI 2026 (Total Rp 683.000) ---
  { month: 'JULI 2026', year: 2026, seqNo: 1, name: 'Refund Modal (Raihan)', qty: 1, unit: 'Pcs', unitPrice: 36000, totalPrice: 36000, fundedBy: 'Raihan' },
  { month: 'JULI 2026', year: 2026, seqNo: 2, name: 'Refund Modal (Revan)', qty: 1, unit: 'Pcs', unitPrice: 79500, totalPrice: 79500, fundedBy: 'Revan' },
  { month: 'JULI 2026', year: 2026, seqNo: 3, name: 'Manual Grinder', qty: 1, unit: 'Pcs', unitPrice: 400000, totalPrice: 400000, fundedBy: 'DCC' },
  { month: 'JULI 2026', year: 2026, seqNo: 4, name: 'Kopi Eclipse', qty: 1, unit: 'Pcs', unitPrice: 50000, totalPrice: 50000, fundedBy: 'DCC' },
  { month: 'JULI 2026', year: 2026, seqNo: 5, name: 'Cremmer', qty: 1, unit: 'Pcs', unitPrice: 48000, totalPrice: 48000, fundedBy: 'DCC' },
  { month: 'JULI 2026', year: 2026, seqNo: 6, name: 'Susu Diamond', qty: 2, unit: 'Pcs', unitPrice: 21000, totalPrice: 42000, fundedBy: 'DCC' },
  { month: 'JULI 2026', year: 2026, seqNo: 7, name: 'Kale 250 ML', qty: 10, unit: 'Pcs', unitPrice: 1200, totalPrice: 12000, fundedBy: 'DCC' },
  { month: 'JULI 2026', year: 2026, seqNo: 8, name: 'Kale 1L', qty: 5, unit: 'Pcs', unitPrice: 3100, totalPrice: 15500, fundedBy: 'DCC' },

  // --- BULAN AGUSTUS 2026 (Total Rp 2.184.607) ---
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 1, name: 'Registrasi', qty: 1, unit: 'Pcs', unitPrice: 75000, totalPrice: 75000, fundedBy: 'DCC' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 2, name: 'Set Matcha', qty: 1, unit: 'Pcs', unitPrice: 130000, totalPrice: 130000, fundedBy: 'Raihan' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 3, name: 'Rak Cup Holder', qty: 1, unit: 'Pcs', unitPrice: 158570, totalPrice: 158570, fundedBy: 'DCC' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 4, name: 'Cup Injection', qty: 200, unit: 'Pcs', unitPrice: 1036, totalPrice: 207200, fundedBy: 'DCC' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 5, name: 'Tutup Cup Injection', qty: 8, unit: 'Pack', unitPrice: 11000, totalPrice: 88000, notes: 'Per Pack 25 Pcs', fundedBy: 'DCC' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 6, name: 'Plastik Kresek PE Bening', qty: 1, unit: 'Pack', unitPrice: 12677, totalPrice: 12677, fundedBy: 'DCC' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 7, name: 'Sedotan', qty: 1, unit: 'Pack', unitPrice: 14496, totalPrice: 14496, fundedBy: 'DCC' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 8, name: 'Kopi Eclipse', qty: 2, unit: 'Kg', unitPrice: 159000, totalPrice: 318000, fundedBy: 'Febri' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 9, name: 'Cremmer', qty: 4, unit: 'Kg', unitPrice: 48000, totalPrice: 192000, fundedBy: 'Revan' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 10, name: 'Susu Diamond', qty: 8, unit: 'L', unitPrice: 19500, totalPrice: 156000, fundedBy: 'Revan' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 11, name: 'Susu Rich Milk', qty: 5, unit: 'L', unitPrice: 22500, totalPrice: 112500, fundedBy: 'Revan' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 12, name: 'Matcha Powder', qty: 1, unit: 'Pcs', unitPrice: 105000, totalPrice: 105000, notes: '5k uang rehan', fundedBy: 'DCC' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 13, name: 'Syrup Trieste Hazelnut', qty: 1, unit: 'Pcs', unitPrice: 80000, totalPrice: 80000, fundedBy: 'Febri' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 14, name: 'Pump Botol Syrup', qty: 2, unit: 'Pcs', unitPrice: 17000, totalPrice: 34000, fundedBy: 'Febri' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 15, name: 'Stand Akrilik', qty: 1, unit: 'Pcs', unitPrice: 33526, totalPrice: 33526, notes: 'QRIS A6 dan Menu A4', fundedBy: 'DCC' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 16, name: 'Syrup Denali Cokelat', qty: 1, unit: 'Pcs', unitPrice: 96000, totalPrice: 96000, fundedBy: 'Revan' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 17, name: 'Taplak Banner', qty: 1, unit: 'Pcs', unitPrice: 78000, totalPrice: 78000, notes: '120x60x70', fundedBy: 'Febri' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 18, name: 'Gelas Takar', qty: 1, unit: 'Pcs', unitPrice: 19331, totalPrice: 19331, notes: '100 ml kerucut (3 pcs)', fundedBy: 'DCC' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 19, name: 'Bar Mate', qty: 1, unit: 'Pcs', unitPrice: 49233, totalPrice: 49233, notes: '45x20 cm', fundedBy: 'DCC' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 20, name: 'Scoop Ice', qty: 1, unit: 'Pcs', unitPrice: 9074, totalPrice: 9074, fundedBy: 'DCC' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 21, name: 'Gula Aren', qty: 1, unit: 'Kg', unitPrice: 22000, totalPrice: 22000, fundedBy: 'DCC' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 22, name: 'Es Batu Kristal', qty: 1, unit: 'Pcs', unitPrice: 10000, totalPrice: 10000, fundedBy: 'Raihan' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 23, name: 'Es Batu Kristal', qty: 1, unit: 'Pcs', unitPrice: 10000, totalPrice: 10000, fundedBy: 'Revan' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 24, name: 'Paper Filter Mokapot 2 Cup', qty: 1, unit: 'Pcs', unitPrice: 12000, totalPrice: 12000, fundedBy: 'Revan' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 25, name: 'Kain Lap Microfiber 30x30', qty: 2, unit: 'Pcs', unitPrice: 8000, totalPrice: 16000, fundedBy: 'Revan' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 26, name: 'GulaKu Premium 1 Kg', qty: 1, unit: 'Kg', unitPrice: 17500, totalPrice: 17500, fundedBy: 'Revan' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 27, name: 'Iphone XR', qty: 1, unit: 'Pcs', unitPrice: 75000, totalPrice: 75000, fundedBy: 'Raihan' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 28, name: 'Gas Portable', qty: 1, unit: 'Pcs', unitPrice: 8000, totalPrice: 8000, fundedBy: 'Raihan' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 29, name: 'Stiker Matcha & Hazelnut', qty: 1, unit: 'Pcs', unitPrice: 26000, totalPrice: 26000, fundedBy: 'Revan' },
  { month: 'AGUSTUS 2026', year: 2026, seqNo: 31, name: 'Susu Diamond', qty: 1, unit: 'L', unitPrice: 19500, totalPrice: 19500, fundedBy: 'Febri' },

  // --- BULAN SEPTEMBER 2026 (Total Rp 728.000) ---
  { month: 'SEPTEMBER 2026', year: 2026, seqNo: 1, name: 'Cup Injection 12 Oz', qty: 1, unit: 'Pcs', unitPrice: 315000, totalPrice: 315000, fundedBy: 'DCC' },
  { month: 'SEPTEMBER 2026', year: 2026, seqNo: 2, name: 'UHT DM 1 Karton', qty: 1, unit: 'Karton', unitPrice: 221000, totalPrice: 221000, fundedBy: 'DCC' },
  { month: 'SEPTEMBER 2026', year: 2026, seqNo: 3, name: 'Krimer Santos', qty: 4, unit: 'Kg', unitPrice: 48000, totalPrice: 192000, fundedBy: 'DCC' },
];

async function main() {
  console.log('🚀 Memulai proses Import Data Jurnal Harian...');

  const cashFile = 'C:/Users/febri/.gemini/antigravity/brain/51716849-b9c9-49cf-9839-cf24249b1fcc/scratch/jurnal_harian/CATATAN KEUANGAN CASH.html';
  const qrisFile = 'C:/Users/febri/.gemini/antigravity/brain/51716849-b9c9-49cf-9839-cf24249b1fcc/scratch/jurnal_harian/CATATAN KEUANGAN QRIS.html';

  if (!fs.existsSync(cashFile) || !fs.existsSync(qrisFile)) {
    throw new Error('File HTML Jurnal Harian tidak ditemukan di folder scratch!');
  }

  const cashTransactions = parseSheet(cashFile);
  const qrisTransactions = parseSheet(qrisFile, 'Pendapatan QRIS');

  console.log(`📊 Parsed Cash: ${cashTransactions.length} records (Seq s/d #${cashTransactions[cashTransactions.length - 1].seqNo})`);
  console.log(`📊 Parsed QRIS: ${qrisTransactions.length} records (Seq s/d #${qrisTransactions[qrisTransactions.length - 1].seqNo})`);

  // --- 1. IMPORT CASH RECORDS ---
  console.log('🧹 Membersihkan tabel CashRecord lama untuk sinkronisasi bersih...');
  await prisma.cashRecord.deleteMany({});

  console.log('💾 Mengimpor transaksi Kas Tunai (CASH)...');
  for (const item of cashTransactions) {
    await prisma.cashRecord.create({
      data: {
        seqNo: item.seqNo,
        account: 'CASH',
        date: parseDateToUTC(item.dateStr),
        name: item.name,
        type: item.type,
        category: item.category,
        amount: item.amount,
        balance: item.balance,
        notes: item.notes,
        cashier: item.cashier,
      },
    });
  }

  console.log('💾 Mengimpor transaksi QRIS...');
  for (const item of qrisTransactions) {
    await prisma.cashRecord.create({
      data: {
        seqNo: item.seqNo,
        account: 'QRIS',
        date: parseDateToUTC(item.dateStr),
        name: item.name,
        type: item.type,
        category: item.category,
        amount: item.amount,
        balance: item.balance,
        notes: item.notes,
        cashier: item.cashier,
      },
    });
  }

  // --- 2. IMPORT RAB ITEMS ---
  console.log('🧹 Membersihkan tabel RabItem...');
  await prisma.rabItem.deleteMany({});

  console.log('💾 Mengimpor data Rencana Anggaran Biaya (RAB) Mei - September 2026...');
  for (const item of RAB_BASE_ITEMS) {
    await prisma.rabItem.create({
      data: {
        month: item.month,
        year: item.year,
        seqNo: item.seqNo,
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: (item as any).notes || null,
        fundedBy: item.fundedBy || 'DCC',
        status: 'PLANNED',
      },
    });
  }

  // --- 3. REKONSILIASI & VERIFIKASI SALDO ---
  const totalCashCount = await prisma.cashRecord.count({ where: { account: 'CASH' } });
  const totalQrisCount = await prisma.cashRecord.count({ where: { account: 'QRIS' } });
  const totalRabCount = await prisma.rabItem.count();

  const lastCash = await prisma.cashRecord.findFirst({
    where: { account: 'CASH' },
    orderBy: { seqNo: 'desc' },
  });
  const lastQris = await prisma.cashRecord.findFirst({
    where: { account: 'QRIS' },
    orderBy: { seqNo: 'desc' },
  });

  const totalLiquidity = (lastCash?.balance || 0) + (lastQris?.balance || 0);

  console.log('\n================ REKONSILIASI DATABASE ================');
  console.log(`✅ Total Kas Tunai : ${totalCashCount} transaksi | Saldo Akhir: Rp ${lastCash?.balance.toLocaleString('id-ID')}`);
  console.log(`✅ Total QRIS      : ${totalQrisCount} transaksi | Saldo Akhir: Rp ${lastQris?.balance.toLocaleString('id-ID')}`);
  console.log(`💰 Likuiditas Total: Rp ${totalLiquidity.toLocaleString('id-ID')} (Target: Rp 541.791)`);
  console.log(`📋 Total RAB Items : ${totalRabCount} items (Termasuk September 2026)`);
  console.log('========================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error saat import jurnal harian:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
