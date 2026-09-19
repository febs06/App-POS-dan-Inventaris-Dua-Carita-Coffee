import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RawRabItem {
  month: string; // "MEI 2026", "JUNI 2026", "JULI 2026", "AGUSTUS 2026"
  year: number;
  seqNo: number;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  fundedBy?: string; // "DCC", "Febri", "Raihan", "Revan"
}

const RAB_ITEMS: RawRabItem[] = [
  // --- BULAN MEI 2026 (Total Rp 391.000) ---
  { month: 'MEI 2026', year: 2026, seqNo: 1, name: 'Cup Injection', qty: 200, unit: 'Pcs', unitPrice: 1290, totalPrice: 258000, fundedBy: 'DCC' },
  { month: 'MEI 2026', year: 2026, seqNo: 2, name: 'Tutup Cup Injection', qty: 8, unit: 'Pack', unitPrice: 11500, totalPrice: 92000, fundedBy: 'DCC' },
  { month: 'MEI 2026', year: 2026, seqNo: 3, name: 'Plastik Kresek PE Bening', qty: 1, unit: 'Pack', unitPrice: 18000, totalPrice: 18000, fundedBy: 'DCC' },
  { month: 'MEI 2026', year: 2026, seqNo: 4, name: 'Sedotan', qty: 1, unit: 'Pack', unitPrice: 18000, totalPrice: 18000, fundedBy: 'DCC' },
  { month: 'MEI 2026', year: 2026, seqNo: 5, name: 'Solasi Shoope Food', qty: 1, unit: 'Roll', unitPrice: 5000, totalPrice: 5000, fundedBy: 'DCC' },

  // --- BULAN JUNI 2026 (Total Rp 315.000) ---
  // Ditandai dari tabel kedua yang tidak ada nama bulannya, sesuai konfirmasi user
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
];

async function main() {
  console.log('Seeding RAB (Rencana Anggaran Biaya)...');

  // Clear existing RAB items
  await prisma.rabItem.deleteMany();

  for (const item of RAB_ITEMS) {
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
        notes: item.notes || null,
        fundedBy: item.fundedBy || 'DCC',
        status: 'PLANNED',
      },
    });
  }

  const count = await prisma.rabItem.count();
  console.log(`✅ Successfully seeded ${count} RAB items!`);

  // Calculate totals per month
  const months = ['MEI 2026', 'JUNI 2026', 'JULI 2026', 'AGUSTUS 2026'];
  for (const m of months) {
    const items = await prisma.rabItem.findMany({ where: { month: m } });
    const total = items.reduce((acc, i) => acc + i.totalPrice, 0);
    console.log(`📊 ${m}: ${items.length} items | Total: Rp ${total.toLocaleString('id-ID')}`);
  }

  // Calculate August funding breakdown
  const augItems = await prisma.rabItem.findMany({ where: { month: 'AGUSTUS 2026' } });
  const funders = ['DCC', 'Febri', 'Raihan', 'Revan'];
  for (const f of funders) {
    const total = augItems.filter(i => i.fundedBy === f).reduce((acc, i) => acc + i.totalPrice, 0);
    console.log(`   - Uang ${f}: Rp ${total.toLocaleString('id-ID')}`);
  }
}

main()
  .catch((e) => {
    console.error('Error seeding RAB items:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
