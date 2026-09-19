import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RawCashRecord {
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

// 131 records directly transcribed from the user's Excel sheet "CATATAN KEUANGAN CASH"
const CASH_RECORDS: RawCashRecord[] = [
  // --- APRIL 2026 ---
  { seqNo: 1, dateStr: '01/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 60000, balance: 60000, cashier: 'Revan' },
  { seqNo: 2, dateStr: '01/04/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 30000, balance: 90000, cashier: 'Revan' },
  { seqNo: 3, dateStr: '02/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 105000, cashier: 'Revan' },
  { seqNo: 4, dateStr: '02/04/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 120000, cashier: 'Revan' },
  { seqNo: 5, dateStr: '02/04/2026', name: 'Susu Diamond', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 42000, balance: 78000 },
  { seqNo: 6, dateStr: '02/04/2026', name: 'Pindah Saldo QRIS', type: 'KELUAR', category: 'PINDAH_SALDO', amount: 78000, balance: 0 },
  { seqNo: 7, dateStr: '06/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 15000, cashier: 'Revan' },
  { seqNo: 8, dateStr: '07/04/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 60000, balance: 75000, cashier: 'Revan' },
  { seqNo: 9, dateStr: '07/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 90000, cashier: 'Revan' },
  { seqNo: 10, dateStr: '11/04/2026', name: 'Restock Bubuk Matcha', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 100000, balance: -10000 },
  { seqNo: 11, dateStr: '12/04/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 5000, cashier: 'Revan' },
  { seqNo: 12, dateStr: '13/04/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 20000, cashier: 'Revan' },
  { seqNo: 13, dateStr: '14/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 45000, balance: 65000, cashier: 'Revan' },
  { seqNo: 14, dateStr: '14/04/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 80000, cashier: 'Revan' },
  { seqNo: 15, dateStr: '15/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 95000, cashier: 'Revan' },
  { seqNo: 16, dateStr: '15/04/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 110000, cashier: 'Revan' },
  { seqNo: 17, dateStr: '16/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 125000, cashier: 'Revan' },
  { seqNo: 18, dateStr: '19/04/2026', name: 'Additional Es', type: 'KELUAR', category: 'OPERASIONAL', amount: 3000, balance: 122000, cashier: 'Raihan' },
  { seqNo: 19, dateStr: '19/04/2026', name: 'Kembalian Transaksi', type: 'KELUAR', category: 'OPERASIONAL', amount: 2000, balance: 120000, cashier: 'Raihan' },
  { seqNo: 20, dateStr: '22/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 135000, cashier: 'Raihan' },
  { seqNo: 21, dateStr: '22/04/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 10000, balance: 145000, cashier: 'Revan' },
  { seqNo: 22, dateStr: '25/04/2026', name: 'Parkir', type: 'KELUAR', category: 'OPERASIONAL', amount: 4500, balance: 140500, cashier: 'Raihan' },
  { seqNo: 23, dateStr: '25/04/2026', name: 'Diamond UHT', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 19000, balance: 121500, cashier: 'Raihan' },
  { seqNo: 24, dateStr: '25/04/2026', name: 'Diamond Rich Milk', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 22000, balance: 99500, cashier: 'Raihan' },
  { seqNo: 25, dateStr: '25/04/2026', name: 'Diamond UHT', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 38000, balance: 61500, cashier: 'Raihan' },

  // --- MEI 2026 ---
  { seqNo: 27, dateStr: '04/05/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 30000, balance: 91500, cashier: 'Raihan' },
  { seqNo: 28, dateStr: '04/05/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 106500, cashier: 'Raihan' },
  { seqNo: 29, dateStr: '09/05/2026', name: 'Pindah Saldo', type: 'MASUK', category: 'PINDAH_SALDO', amount: 20000, balance: 126500 },
  { seqNo: 30, dateStr: '09/05/2026', name: 'Ongkir', type: 'KELUAR', category: 'OPERASIONAL', amount: 20000, balance: 106500 },
  { seqNo: 31, dateStr: '11/05/2026', name: 'Caffe Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 121500, cashier: 'Raihan' },
  { seqNo: 32, dateStr: '16/05/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 30000, balance: 151500, cashier: 'Revan' },
  { seqNo: 33, dateStr: '25/05/2026', name: 'Dua Carita Signature', type: 'MASUK', category: 'PENJUALAN', amount: 13000, balance: 164500, cashier: 'Revan' },
  { seqNo: 34, dateStr: '25/05/2026', name: 'Pindah Saldo', type: 'MASUK', category: 'PINDAH_SALDO', amount: 142203, balance: 306703 },
  { seqNo: 35, dateStr: '26/05/2026', name: 'Belanja Bahan Baku', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 224000, balance: 82703, cashier: 'Raihan' },
  { seqNo: 36, dateStr: '26/05/2026', name: 'Dua Carita Signature', type: 'MASUK', category: 'PENJUALAN', amount: 60000, balance: 142703, cashier: 'Raihan' },
  { seqNo: 37, dateStr: '26/05/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 22000, balance: 164703, cashier: 'Raihan' },
  { seqNo: 38, dateStr: '27/05/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 110000, balance: 274703, cashier: 'Raihan' },
  { seqNo: 39, dateStr: '27/05/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 329703, cashier: 'Raihan' },
  { seqNo: 40, dateStr: '27/05/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 384703, cashier: 'Raihan' },
  { seqNo: 41, dateStr: '30/05/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 439703, cashier: 'Raihan' },
  { seqNo: 42, dateStr: '30/05/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 494703, cashier: 'Raihan' },
  { seqNo: 43, dateStr: '30/05/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 55000, balance: 549703, cashier: 'Raihan' },
  { seqNo: 44, dateStr: '30/05/2026', name: 'Tip', type: 'MASUK', category: 'LAINNYA', amount: 35000, balance: 584703, cashier: 'Raihan' },
  { seqNo: 45, dateStr: '30/05/2026', name: 'Kale 1 Liter (3 Pcs)', type: 'KELUAR', category: 'PACKAGING', amount: 12000, balance: 572703, cashier: 'Raihan' },
  { seqNo: 46, dateStr: '30/05/2026', name: 'Kale 1 Liter (1 Pcs)', type: 'KELUAR', category: 'PACKAGING', amount: 4500, balance: 568203, cashier: 'Raihan' },

  // --- JUNI 2026 ---
  { seqNo: 48, dateStr: '02/06/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 583203, cashier: 'Raihan' },
  { seqNo: 49, dateStr: '03/06/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 598203, cashier: 'Revan' },
  { seqNo: 50, dateStr: '08/06/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 110000, balance: 708203, cashier: 'Raihan' },
  { seqNo: 51, dateStr: '09/06/2026', name: 'Botol Kale 1L (Keras)', type: 'KELUAR', category: 'PACKAGING', amount: 20000, balance: 688203 },
  { seqNo: 52, dateStr: '09/06/2026', name: 'Krimer Santos', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 11000, balance: 677203 },
  { seqNo: 53, dateStr: '09/06/2026', name: 'Botol Kale 1L (Biasa)', type: 'KELUAR', category: 'PACKAGING', amount: 24100, balance: 653103 },
  { seqNo: 54, dateStr: '09/06/2026', name: 'Krimer Santos', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 11000, balance: 642103 },
  { seqNo: 55, dateStr: '09/06/2026', name: 'Susu Diamond', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 21000, balance: 621103 },

  // --- JULI 2026 ---
  { seqNo: 57, dateStr: '01/07/2026', name: 'Balancing', type: 'KELUAR', category: 'OPERASIONAL', amount: 151603, balance: 469500, notes: 'Penyesuaian Saldo Kas' },
  { seqNo: 58, dateStr: '02/07/2026', name: 'Beans Eclipse 250 Gr', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 39000, balance: 430500 },
  { seqNo: 59, dateStr: '02/07/2026', name: 'Stiker Aren 250 ML', type: 'KELUAR', category: 'PACKAGING', amount: 13000, balance: 417500 },
  { seqNo: 60, dateStr: '02/07/2026', name: 'Gula Aren', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 28500, balance: 389000 },
  { seqNo: 61, dateStr: '02/07/2026', name: 'Krimer Santos 1/4', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 11000, balance: 378000 },
  { seqNo: 62, dateStr: '02/07/2026', name: 'Susu Diamond', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 21000, balance: 357000 },
  { seqNo: 63, dateStr: '03/07/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 372000 },
  { seqNo: 64, dateStr: '03/07/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 387000 },
  { seqNo: 65, dateStr: '04/07/2026', name: 'Susu Diamond', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 22000, balance: 365000 },
  { seqNo: 66, dateStr: '04/07/2026', name: 'Krimer Santos 1 Kg', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 40000, balance: 325000 },
  { seqNo: 67, dateStr: '06/07/2026', name: 'Stiker Choco Blend 250 ML', type: 'KELUAR', category: 'PACKAGING', amount: 13000, balance: 312000 },
  { seqNo: 68, dateStr: '06/07/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 30000, balance: 342000 },
  { seqNo: 69, dateStr: '06/07/2026', name: 'Hazelnut Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 357000 },
  { seqNo: 70, dateStr: '07/07/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 372000 },
  { seqNo: 71, dateStr: '07/07/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 387000 },
  { seqNo: 72, dateStr: '07/07/2026', name: 'Dua Carita Signature', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 402000 },
  { seqNo: 73, dateStr: '07/07/2026', name: 'Kale 250 ML', type: 'KELUAR', category: 'PACKAGING', amount: 7500, balance: 394500 },
  { seqNo: 74, dateStr: '11/07/2026', name: 'Santos Creamer', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 96000, balance: 298500 },
  { seqNo: 75, dateStr: '11/07/2026', name: 'Beans Eclipse 500 Gr', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 84000, balance: 214500 },
  { seqNo: 76, dateStr: '11/07/2026', name: 'Susu Diamond', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 39000, balance: 175500 },
  { seqNo: 77, dateStr: '12/07/2026', name: 'Stiker 1 L', type: 'KELUAR', category: 'PACKAGING', amount: 14500, balance: 161000 },
  { seqNo: 78, dateStr: '13/07/2026', name: 'Stiker Matcha Latte 250 Ml', type: 'KELUAR', category: 'PACKAGING', amount: 13000, balance: 148000 },
  { seqNo: 79, dateStr: '13/07/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 163000 },
  { seqNo: 80, dateStr: '13/07/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 178000 },
  { seqNo: 81, dateStr: '13/07/2026', name: 'Tip Raihan', type: 'MASUK', category: 'LAINNYA', amount: 133000, balance: 311000 },
  { seqNo: 82, dateStr: '13/07/2026', name: 'Tip Raihan', type: 'KELUAR', category: 'LAINNYA', amount: 133000, balance: 178000, notes: 'Penyerahan Tip ke Raihan' },
  { seqNo: 83, dateStr: '14/07/2026', name: 'Matcha Latte', type: 'MASUK', category: 'PENJUALAN', amount: 14000, balance: 192000 },
  { seqNo: 84, dateStr: '15/07/2026', name: 'Dua Carita Signature', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 207000 },
  { seqNo: 85, dateStr: '15/07/2026', name: 'Kale 250 ML & 1L', type: 'KELUAR', category: 'PACKAGING', amount: 81000, balance: 126000 },
  { seqNo: 86, dateStr: '16/07/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 141000 },
  { seqNo: 87, dateStr: '16/07/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 156000 },
  { seqNo: 88, dateStr: '17/07/2026', name: 'Susu Diamond', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 22500, balance: 133500 },
  { seqNo: 89, dateStr: '17/07/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 148500 },
  { seqNo: 90, dateStr: '17/07/2026', name: 'Aren Latte', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 163500 },
  { seqNo: 91, dateStr: '18/07/2026', name: 'Cashback Revan', type: 'KELUAR', category: 'LAINNYA', amount: 79500, balance: 84000 },
  { seqNo: 92, dateStr: '18/07/2026', name: 'Parkir', type: 'KELUAR', category: 'OPERASIONAL', amount: 6000, balance: 78000, notes: 'Kopi Fest' },

  // --- AGUSTUS 2026 ---
  { seqNo: 94, dateStr: '18/08/2026', name: 'Poster', type: 'KELUAR', category: 'OPERASIONAL', amount: 8000, balance: 70000 },
  { seqNo: 95, dateStr: '18/08/2026', name: 'Parkir Percetakan + Borma', type: 'KELUAR', category: 'OPERASIONAL', amount: 6000, balance: 64000 },
  { seqNo: 96, dateStr: '19/08/2026', name: 'Gula Aren', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 22000, balance: 42000 },
  { seqNo: 97, dateStr: '19/08/2026', name: 'Parkir Percetakan + Borma', type: 'KELUAR', category: 'OPERASIONAL', amount: 1500, balance: 40500 },
  { seqNo: 98, dateStr: '08/08/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 45000, balance: 85500 },
  { seqNo: 99, dateStr: '14/08/2026', name: 'Choco Blend', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 100500 },
  { seqNo: 100, dateStr: '20/08/2026', name: 'Pendapatan Bazaar MOKAKU 2026', type: 'MASUK', category: 'PENJUALAN', amount: 718000, balance: 818500 },
  { seqNo: 101, dateStr: '21/08/2026', name: 'Pendapatan', type: 'MASUK', category: 'PENJUALAN', amount: 73000, balance: 891500, notes: 'Signature 1, Aren 2, Hazelnut 1, Mocca 1' },
  { seqNo: 102, dateStr: '23/08/2026', name: 'Pendapatan Bazaar ORCA FEST 2026', type: 'MASUK', category: 'PENJUALAN', amount: 73000, balance: 964500 },
  { seqNo: 103, dateStr: '24/08/2026', name: 'Letsbrew', type: 'MASUK', category: 'PINDAH_SALDO', amount: 60000, balance: 1024500, notes: 'Pindah dari QRIS' },
  { seqNo: 104, dateStr: '24/08/2026', name: 'PT Tokopedia (Pindah ke Cash)', type: 'MASUK', category: 'PINDAH_SALDO', amount: 20000, balance: 1044500, notes: 'PT Tokopedia (Pindah ke Cash)' },
  { seqNo: 105, dateStr: '24/08/2026', name: 'Balancing Saldo', type: 'KELUAR', category: 'OPERASIONAL', amount: 108500, balance: 936000, notes: 'Penyesuaian Saldo Kas' },
  { seqNo: 106, dateStr: '24/08/2026', name: 'Refund Modal Revan', type: 'KELUAR', category: 'MODAL', amount: 450000, balance: 486000 },
  { seqNo: 107, dateStr: '24/08/2026', name: 'Refund Modal Raihan', type: 'KELUAR', category: 'MODAL', amount: 150000, balance: 336000 },
  { seqNo: 108, dateStr: '24/08/2026', name: 'Biaya Makan Karyawan', type: 'KELUAR', category: 'OPERASIONAL', amount: 55000, balance: 281000 },
  { seqNo: 109, dateStr: '30/08/2026', name: 'Parkir GBLA', type: 'KELUAR', category: 'OPERASIONAL', amount: 4000, balance: 277000 },
  { seqNo: 110, dateStr: '30/08/2026', name: 'Pulsa', type: 'MASUK', category: 'LAINNYA', amount: 50000, balance: 327000 },
  { seqNo: 111, dateStr: '30/08/2026', name: 'Susu Diamond UHT', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 42000, balance: 285000 },
  { seqNo: 112, dateStr: '30/08/2026', name: 'Dua Carita Signature', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 300000 },
  { seqNo: 113, dateStr: '31/08/2026', name: 'Ongkir SPX', type: 'KELUAR', category: 'OPERASIONAL', amount: 4000, balance: 296000 },
  { seqNo: 114, dateStr: '31/08/2026', name: 'Es Batu', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 5000, balance: 291000 },
  { seqNo: 115, dateStr: '31/08/2026', name: 'Pindah Saldo', type: 'KELUAR', category: 'PINDAH_SALDO', amount: 150000, balance: 141000 },

  // --- SEPTEMBER 2026 ---
  { seqNo: 117, dateStr: '07/09/2026', name: 'Pendapatan', type: 'MASUK', category: 'PENJUALAN', amount: 15000, balance: 156000, notes: 'Teh Elie' },
  { seqNo: 118, dateStr: '08/09/2026', name: 'Es Batu', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 5000, balance: 151000 },
  { seqNo: 119, dateStr: '10/09/2026', name: 'Gula Aren', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 31000, balance: 120000 },
  { seqNo: 120, dateStr: '10/09/2026', name: 'Parkir Gedebage', type: 'KELUAR', category: 'OPERASIONAL', amount: 1500, balance: 118500 },
  { seqNo: 121, dateStr: '10/09/2026', name: 'Parkir Cibadak', type: 'KELUAR', category: 'OPERASIONAL', amount: 2000, balance: 116500 },
  { seqNo: 122, dateStr: '10/09/2026', name: 'Sunlight', type: 'KELUAR', category: 'OPERASIONAL', amount: 2000, balance: 114500 },
  { seqNo: 123, dateStr: '10/09/2026', name: 'Cooler Box Sterofoam', type: 'KELUAR', category: 'OPERASIONAL', amount: 45000, balance: 69500 },
  { seqNo: 124, dateStr: '11/09/2026', name: 'Es Batu', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 10000, balance: 59500 },
  { seqNo: 125, dateStr: '11/09/2026', name: 'Pendapatan', type: 'MASUK', category: 'PENJUALAN', amount: 1500000, balance: 1559500, notes: 'SD BPI' },
  { seqNo: 126, dateStr: '11/09/2026', name: 'Diamond Juice Cranbery', type: 'KELUAR', category: 'BAHAN_BAKU', amount: 7000, balance: 1552500 },
  { seqNo: 127, dateStr: '11/09/2026', name: 'Stiker 250 ML', type: 'KELUAR', category: 'PACKAGING', amount: 60500, balance: 1492000, notes: 'Caffe Latte, Aren Latte' },
  { seqNo: 128, dateStr: '11/09/2026', name: '1 Bal Botol Kale 250 ML', type: 'KELUAR', category: 'PACKAGING', amount: 107500, balance: 1384500 },
  { seqNo: 129, dateStr: '11/09/2026', name: 'Ongkir Royan', type: 'KELUAR', category: 'OPERASIONAL', amount: 26500, balance: 1358000 },
  { seqNo: 130, dateStr: '13/09/2026', name: 'Nota', type: 'KELUAR', category: 'OPERASIONAL', amount: 3000, balance: 1355000 },
  { seqNo: 131, dateStr: '14/09/2026', name: 'Pindah Saldo', type: 'KELUAR', category: 'PINDAH_SALDO', amount: 1300000, balance: 55000 }
];

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

async function main() {
  console.log('Seeding Cash Records (Buku Kas)...');

  // Clear existing cash records to ensure clean import
  await prisma.cashRecord.deleteMany();

  for (const record of CASH_RECORDS) {
    await prisma.cashRecord.create({
      data: {
        seqNo: record.seqNo,
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

  const count = await prisma.cashRecord.count();
  const latest = await prisma.cashRecord.findFirst({
    orderBy: { seqNo: 'desc' }
  });

  console.log(`✅ Successfully seeded ${count} cash records!`);
  console.log(`💰 Latest Cash Balance (Seq #${latest?.seqNo}): Rp ${latest?.balance.toLocaleString('id-ID')}`);
}

main()
  .catch((e) => {
    console.error('Error seeding cash records:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
