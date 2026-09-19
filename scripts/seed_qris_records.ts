import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RawQrisRecord {
  seqNo: number;
  dateStr: string; // "DD/MM/YYYY"
  name: string;
  type: 'MASUK' | 'KELUAR';
  category: 'PENJUALAN' | 'BAHAN_BAKU' | 'PACKAGING' | 'OPERASIONAL' | 'PINDAH_SALDO' | 'MODAL' | 'LAINNYA';
  amount: number;
  balance: number;
  notes?: string;
  cashier?: string;
}

// 113 records directly transcribed from the user's Excel sheet "CATATAN KEUANGAN QRIS"
// Saldo Awal: Rp 499.255,00
const QRIS_RECORDS: RawQrisRecord[] = [
  // --- APRIL 2026 ---
  { seqNo: 1, dateStr: '01/04/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 514255, cashier: 'Revan' },
  { seqNo: 2, dateStr: '01/04/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 529255, cashier: 'Revan' },
  { seqNo: 3, dateStr: '01/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 544255, cashier: 'Raihan' },
  { seqNo: 4, dateStr: '01/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 599255, cashier: 'Raihan' },
  { seqNo: 5, dateStr: '01/04/2026', name: 'Pindah Saldo', type: 'MASUK', category: 'PINDAH_SALDO', amount: 78000, balance: 677255, notes: 'Dari Kas Tunai' },
  { seqNo: 6, dateStr: '01/04/2026', name: 'Kopi Framous', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 159000, balance: 518255 },
  { seqNo: 7, dateStr: '01/04/2026', name: 'Cremmer', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 48000, balance: 470255 },
  { seqNo: 8, dateStr: '01/04/2026', name: 'Stiker Matcha + Hazelnut', type: 'KELUAR', category: 'PACKAGING', amount: 30000, balance: 440255 },
  { seqNo: 9, dateStr: '04/04/2026', name: 'Hand Mixer', type: 'KELUAR', category: 'OPERASIONAL', amount: 82000, balance: 358255 },
  { seqNo: 10, dateStr: '04/04/2026', name: 'Syrup Denali Coklat', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 99000, balance: 259255 },
  { seqNo: 11, dateStr: '04/04/2026', name: 'Cremmer', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 48000, balance: 211255 },
  { seqNo: 12, dateStr: '04/04/2026', name: 'Kale 1 L', type: 'KELUAR', category: 'PACKAGING', amount: 22050, balance: 189205 },
  { seqNo: 13, dateStr: '04/04/2026', name: 'Kale 250 ML', type: 'KELUAR', category: 'PACKAGING', amount: 62500, balance: 126705 },
  { seqNo: 14, dateStr: '04/04/2026', name: 'Kale 1 L', type: 'KELUAR', category: 'PACKAGING', amount: 8000, balance: 118705 },
  { seqNo: 15, dateStr: '05/04/2026', name: 'Syrup Trieste', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 67500, balance: 51205 },
  { seqNo: 16, dateStr: '05/04/2026', name: 'Susu Diamond', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 38000, balance: 13205 },
  { seqNo: 17, dateStr: '07/04/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 28205, cashier: 'Revan' },
  { seqNo: 18, dateStr: '07/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 83205, cashier: 'Revan' },
  { seqNo: 19, dateStr: '14/04/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 98205, cashier: 'Revan' },
  { seqNo: 20, dateStr: '14/04/2026', name: 'Beli Gula Aren', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 27000, balance: 71205, cashier: 'Raihan' },
  { seqNo: 21, dateStr: '14/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 126205, cashier: 'Raihan' },
  { seqNo: 22, dateStr: '15/04/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 141205, cashier: 'Revan' },
  { seqNo: 23, dateStr: '15/04/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 156205, cashier: 'Raihan' },
  { seqNo: 24, dateStr: '18/04/2026', name: 'Beli Kopi dan Cremmer', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 128000, balance: 28205, cashier: 'Febri' },
  { seqNo: 25, dateStr: '19/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 60000, balance: 88205, cashier: 'Raihan' },
  { seqNo: 26, dateStr: '19/04/2026', name: 'Balancing Saldo', type: 'MASUK', category: 'OPERASIONAL', amount: 15200, balance: 103405, notes: 'Penyesuaian Saldo QRIS' },
  { seqNo: 27, dateStr: '22/04/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 158405, cashier: 'Revan' },
  { seqNo: 28, dateStr: '22/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 173405, cashier: 'Raihan' },
  { seqNo: 29, dateStr: '23/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 10000, balance: 183405, cashier: 'Revan' },
  { seqNo: 30, dateStr: '23/04/2026', name: 'Balancing Saldo', type: 'MASUK', category: 'OPERASIONAL', amount: 40000, balance: 223405, notes: 'Penyesuaian Saldo QRIS' },
  { seqNo: 31, dateStr: '25/04/2026', name: 'Javanica Coffee', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 89000, balance: 134405, cashier: 'Raihan' },
  { seqNo: 32, dateStr: '25/04/2026', name: 'Santos Creamer Premium', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 96000, balance: 38405, cashier: 'Raihan' },
  { seqNo: 33, dateStr: '25/04/2026', name: 'Long Bar Spoon 30cm', type: 'KELUAR', category: 'OPERASIONAL', amount: 17000, balance: 21405, cashier: 'Raihan' },
  { seqNo: 34, dateStr: '25/04/2026', name: 'Paper Filter Mokapot', type: 'KELUAR', category: 'OPERASIONAL', amount: 12000, balance: 9405, cashier: 'Raihan' },
  { seqNo: 35, dateStr: '25/04/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 16000, balance: 25405 },

  // --- MEI 2026 ---
  { seqNo: 37, dateStr: '04/05/2026', name: 'Signature Dua Carita & Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 80405, notes: 'Bundling' },
  { seqNo: 38, dateStr: '09/05/2026', name: 'Signature Dua Carita', type: 'MASUK', category: 'PENJUALAN', amount: 30000, balance: 110405 },
  { seqNo: 39, dateStr: '09/05/2026', name: 'Pindah Saldo', type: 'KELUAR', category: 'PINDAH_SALDO', amount: 30000, balance: 80405, notes: 'Pindah ke Kas Tunai' },
  { seqNo: 40, dateStr: '09/05/2026', name: 'Stiker Signature Dua Carita', type: 'KELUAR', category: 'PACKAGING', amount: 15500, balance: 64905 },
  { seqNo: 41, dateStr: '18/05/2026', name: 'Signature Dua Carita', type: 'MASUK', category: 'PENJUALAN', amount: 13000, balance: 77905, cashier: 'Revan' },
  { seqNo: 42, dateStr: '18/05/2026', name: 'Pemasukan QRIS Lainnya', type: 'MASUK', category: 'PENJUALAN', amount: 49298, balance: 127203 },
  { seqNo: 43, dateStr: '26/05/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 142203, cashier: 'Revan' },
  { seqNo: 44, dateStr: '26/05/2026', name: 'Pindah Saldo', type: 'KELUAR', category: 'PINDAH_SALDO', amount: 142203, balance: 0, notes: 'Pindah ke Kas Tunai' },

  // --- JUNI 2026 ---
  { seqNo: 46, dateStr: '08/06/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 55000 },
  { seqNo: 47, dateStr: '08/06/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 110000 },

  // --- JULI 2026 ---
  { seqNo: 49, dateStr: '05/07/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 60000, balance: 170000, cashier: 'Raihan' },
  { seqNo: 50, dateStr: '05/07/2026', name: 'Dua Carita Signature', type: 'MASUK', category: 'PENJUALAN', amount: 23000, balance: 193000, cashier: 'Raihan' },
  { seqNo: 51, dateStr: '12/07/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 165000, balance: 358000 },
  { seqNo: 52, dateStr: '12/07/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 413000 },
  { seqNo: 53, dateStr: '12/07/2026', name: 'Dua Carita Signature', type: 'MASUK', category: 'PENJUALAN', amount: 47000, balance: 460000 },
  { seqNo: 54, dateStr: '13/07/2026', name: 'Tip Raihan', type: 'MASUK', category: 'LAINNYA', amount: 133000, balance: 593000 },
  { seqNo: 55, dateStr: '13/07/2026', name: 'Tip Raihan Tarik Tunai', type: 'KELUAR', category: 'LAINNYA', amount: 133000, balance: 460000 },
  { seqNo: 56, dateStr: '14/07/2026', name: 'Kopi Susu Tetangga', type: 'KELUAR', category: 'OPERASIONAL', amount: 50000, balance: 410000, notes: 'Kopi Fest' },
  { seqNo: 57, dateStr: '15/07/2026', name: 'Parkir', type: 'KELUAR', category: 'OPERASIONAL', amount: 6000, balance: 404000, notes: 'Kopi Fest' },
  { seqNo: 58, dateStr: '16/07/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 419000 },
  { seqNo: 59, dateStr: '14/07/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 434000 },
  { seqNo: 60, dateStr: '14/07/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 1000, balance: 435000 },
  { seqNo: 61, dateStr: '14/07/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 450000 },
  { seqNo: 62, dateStr: '14/07/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 30000, balance: 480000 },
  { seqNo: 63, dateStr: '17/07/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 495000 },
  { seqNo: 64, dateStr: '19/07/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 30000, balance: 525000 },
  { seqNo: 65, dateStr: '19/07/2026', name: 'Ongkir', type: 'MASUK', category: 'OPERASIONAL', amount: 5000, balance: 530000 },
  { seqNo: 66, dateStr: '19/07/2026', name: 'Balancing Saldo', type: 'MASUK', category: 'OPERASIONAL', amount: 183908, balance: 713908, notes: 'Penyesuaian Saldo QRIS' },
  { seqNo: 67, dateStr: '20/07/2026', name: 'Pendapatan QRIS', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 728908 },
  { seqNo: 68, dateStr: '21/07/2026', name: 'Pendapatan QRIS', type: 'MASUK', category: 'PENJUALAN', amount: 39500, balance: 768408 },
  { seqNo: 69, dateStr: '24/07/2026', name: 'Registrasi Bazaar MOKAKU 2026', type: 'MASUK', category: 'PENJUALAN', amount: 75000, balance: 843408, notes: 'Bazaar MOKAKU 2026' },
  { seqNo: 70, dateStr: '24/07/2026', name: 'Registrasi Bazaar ICONEXT 2026', type: 'MASUK', category: 'PENJUALAN', amount: 66000, balance: 909408, notes: 'Bazaar ICONEXT 2026' },

  // --- AGUSTUS 2026 ---
  { seqNo: 72, dateStr: '10/08/2026', name: 'Pendapatan QRIS', type: 'MASUK', category: 'PENJUALAN', amount: 67436, balance: 976844 },
  { seqNo: 73, dateStr: '10/08/2026', name: 'Checkout Shoope', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 592301, balance: 384543, notes: 'Shopee' },
  { seqNo: 74, dateStr: '11/08/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 439543 },
  { seqNo: 75, dateStr: '20/08/2026', name: 'Pendapatan Bazaar MOKAKU 2026', type: 'MASUK', category: 'PENJUALAN', amount: 634000, balance: 1073543 },
  { seqNo: 76, dateStr: '21/08/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 60000, balance: 1133543 },
  { seqNo: 77, dateStr: '22/08/2026', name: 'Registra Bazaar ORCAFEST 2026', type: 'KELUAR', category: 'OPERASIONAL', amount: 16000, balance: 1117543 },
  { seqNo: 78, dateStr: '22/08/2026', name: 'Lets Brew', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 232000, balance: 885543, notes: 'Restock Bahan Baku' },
  { seqNo: 79, dateStr: '22/08/2026', name: 'Lets Brew', type: 'KELUAR', category: 'PINDAH_SALDO', amount: 60000, balance: 825543, notes: 'Pindah ke Cash' },
  { seqNo: 80, dateStr: '22/08/2026', name: 'PT Tokopedia (Pindah ke Cash)', type: 'KELUAR', category: 'PINDAH_SALDO', amount: 20000, balance: 805543, notes: 'PT Tokopedia (Pindah ke Cash)' },
  { seqNo: 81, dateStr: '23/08/2026', name: 'Kupat Tahu', type: 'KELUAR', category: 'OPERASIONAL', amount: 36000, balance: 769543, notes: 'Makan Staf' },
  { seqNo: 82, dateStr: '23/08/2026', name: 'Pendapatan Bazaar ORCAFEST 2026', type: 'MASUK', category: 'PENJUALAN', amount: 86000, balance: 855543 },
  { seqNo: 83, dateStr: '23/08/2026', name: 'Balancing Saldo', type: 'KELUAR', category: 'OPERASIONAL', amount: 366107, balance: 489436, notes: 'Penyesuaian Saldo QRIS' },
  { seqNo: 84, dateStr: '24/08/2026', name: 'Refund Modal Febri', type: 'KELUAR', category: 'MODAL', amount: 350000, balance: 139436 },
  { seqNo: 85, dateStr: '26/08/2026', name: 'YT Music', type: 'KELUAR', category: 'OPERASIONAL', amount: 30525, balance: 108911, cashier: 'Febri' },
  { seqNo: 86, dateStr: '30/08/2026', name: 'Pulsa', type: 'KELUAR', category: 'OPERASIONAL', amount: 50055, balance: 58856 },
  { seqNo: 87, dateStr: '30/08/2026', name: 'Pendapatan Tenant Bazaar', type: 'MASUK', category: 'PENJUALAN', amount: 275000, balance: 333856, notes: 'POLMAN' },
  { seqNo: 88, dateStr: '31/08/2026', name: 'Baterai', type: 'KELUAR', category: 'OPERASIONAL', amount: 16500, balance: 317356 },
  { seqNo: 89, dateStr: '31/08/2026', name: 'Santos Creammer', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 8000, balance: 309356, notes: 'Ecer 1/4' },
  { seqNo: 90, dateStr: '31/08/2026', name: 'Susu Diamond UHT', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 19000, balance: 290356 },
  { seqNo: 91, dateStr: '31/08/2026', name: 'Pindah Saldo', type: 'MASUK', category: 'PINDAH_SALDO', amount: 150000, balance: 440356, notes: 'Dari Kas Tunai' },
  { seqNo: 92, dateStr: '31/08/2026', name: 'Botol Kale 250 ML', type: 'KELUAR', category: 'PACKAGING', amount: 107500, balance: 332856, notes: '1 Bal/100 Pcs' },
  { seqNo: 93, dateStr: '31/08/2026', name: 'Stiker Dua Carita Signature', type: 'KELUAR', category: 'PACKAGING', amount: 13000, balance: 319856, notes: '1.000 ML' },

  // --- SEPTEMBER 2026 ---
  { seqNo: 95, dateStr: '01/09/2026', name: 'Pendapatan', type: 'MASUK', category: 'PENJUALAN', amount: 88000, balance: 407856, notes: 'Ibu' },
  { seqNo: 96, dateStr: '01/09/2026', name: 'Pendapatan', type: 'MASUK', category: 'PENJUALAN', amount: 153500, balance: 561356, notes: 'Febri' },
  { seqNo: 97, dateStr: '01/09/2026', name: 'Pendapatan', type: 'MASUK', category: 'PENJUALAN', amount: 345000, balance: 906356, notes: 'Tante Dini PMI' },
  { seqNo: 98, dateStr: '03/09/2026', name: 'UHT Diamond 1 Karton', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 221000, balance: 685356 },
  { seqNo: 99, dateStr: '03/09/2026', name: 'Superindo', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 146940, balance: 538416, notes: 'Superindo' },
  { seqNo: 100, dateStr: '03/09/2026', name: 'Lets Brew', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 224000, balance: 314416 },
  { seqNo: 101, dateStr: '04/09/2026', name: 'Es Batu', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 3000, balance: 311416 },
  { seqNo: 102, dateStr: '04/09/2026', name: 'Pendapatan', type: 'MASUK', category: 'PENJUALAN', amount: 60000, balance: 371416, notes: 'Babeh Raihan' },
  { seqNo: 103, dateStr: '07/09/2026', name: '57 Coffe Aurora Full Arabika', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 83000, balance: 288416, notes: '200 G' },
  { seqNo: 104, dateStr: '09/09/2026', name: 'Pendapatan', type: 'MASUK', category: 'PENJUALAN', amount: 81500, balance: 369916, notes: 'Royan' },
  { seqNo: 105, dateStr: '10/09/2026', name: 'Lets Brew', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 303000, balance: 66916 },
  { seqNo: 106, dateStr: '13/09/2026', name: 'Stempel Flash', type: 'KELUAR', category: 'OPERASIONAL', amount: 55000, balance: 11916 },
  { seqNo: 107, dateStr: '14/09/2026', name: 'Pindah Saldo', type: 'MASUK', category: 'PINDAH_SALDO', amount: 1300000, balance: 1311916, notes: 'Dari Kas Tunai' },
  { seqNo: 108, dateStr: '14/09/2026', name: 'Rich Milk 1 Karton', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 258000, balance: 1053916 },
  { seqNo: 109, dateStr: '14/09/2026', name: 'Pendapatan', type: 'MASUK', category: 'PENJUALAN', amount: 370000, balance: 1423916, notes: 'Uwa Raihan+Tip Raihan' },
  { seqNo: 110, dateStr: '14/09/2026', name: 'Tip Raihan', type: 'KELUAR', category: 'LAINNYA', amount: 150000, balance: 1273916 },
  { seqNo: 111, dateStr: '15/09/2026', name: 'Pendapatan', type: 'MASUK', category: 'PENJUALAN', amount: 45000, balance: 1318916, notes: 'Babeh Raihan' },
  { seqNo: 112, dateStr: '15/09/2026', name: 'Cup Injection 12 Oz', type: 'KELUAR', category: 'PACKAGING', amount: 313700, balance: 1005216 },
  { seqNo: 113, dateStr: '15/09/2026', name: 'Pendapatan', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 1020216, notes: 'Ibu Raihan' },
];

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

async function main() {
  console.log('Seeding QRIS Records (Buku Kas QRIS)...');

  // Clear existing QRIS records only
  await prisma.cashRecord.deleteMany({
    where: { account: 'QRIS' }
  });

  for (const record of QRIS_RECORDS) {
    await prisma.cashRecord.create({
      data: {
        seqNo: record.seqNo,
        account: 'QRIS',
        date: parseDate(record.dateStr),
        name: record.name,
        type: record.type,
        category: record.category,
        amount: record.amount,
        balance: record.balance,
        notes: record.notes,
        cashier: record.cashier,
      }
    });
  }

  const count = await prisma.cashRecord.count({ where: { account: 'QRIS' } });
  const latest = await prisma.cashRecord.findFirst({
    where: { account: 'QRIS' },
    orderBy: { seqNo: 'desc' }
  });

  console.log(`✅ Successfully seeded ${count} QRIS records!`);
  console.log(`📱 Latest QRIS Balance (Seq #${latest?.seqNo}): Rp ${latest?.balance.toLocaleString('id-ID')}`);
}

main()
  .catch((e) => {
    console.error('Error seeding QRIS records:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
