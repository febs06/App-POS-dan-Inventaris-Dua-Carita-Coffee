import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RawTx {
  month: string;
  date: string; // D/M/YYYY
  code: string;
  productName: string;
  qty: number;
  size: string;
  price: number;
  total: number;
  paymentMethod: string;
  notes: string;
  cashier: string;
}

const transactions: RawTx[] = [
  // --- APRIL ---
  { month: "April", date: "1/4/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 4, size: "250 ML", price: 15000, total: 60000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "April", date: "1/4/2026", code: "MT-B250", productName: "Matcha Latte", qty: 2, size: "250 ML", price: 15000, total: 30000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "April", date: "1/4/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Revan" },
  { month: "April", date: "1/4/2026", code: "CB-B250", productName: "Choco Blend", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Revan" },
  { month: "April", date: "2/4/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "April", date: "2/4/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "April", date: "2/4/2026", code: "CB-B250", productName: "Choco Blend", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "April", date: "2/4/2026", code: "HZ-B1L", productName: "Hazelnut Latte", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "April", date: "7/4/2026", code: "MT-B250", productName: "Matcha Latte", qty: 4, size: "250 ML", price: 15000, total: 60000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "April", date: "7/4/2026", code: "CB-B250", productName: "Choco Blend", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Revan" },
  { month: "April", date: "7/4/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "April", date: "8/4/2026", code: "HZ-B1L", productName: "Hazelnut Latte", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "QRIS", notes: "", cashier: "Revan" },
  { month: "April", date: "12/4/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "April", date: "13/4/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "April", date: "14/4/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 3, size: "250 ML", price: 15000, total: 45000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "April", date: "14/4/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "April", date: "14/4/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "April", date: "14/4/2026", code: "AR-B1L", productName: "Aren Latte", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "April", date: "15/4/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "April", date: "15/4/2026", code: "AR-B250", productName: "Aren Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "April", date: "15/4/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "April", date: "15/4/2026", code: "AR-B250", productName: "Aren Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "April", date: "19/4/2026", code: "HZ-B1L", productName: "Hazelnut Latte", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "April", date: "22/4/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "April", date: "22/4/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "April", date: "22/4/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "April", date: "22/4/2026", code: "CB-B1L", productName: "Choco Blend", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "QRIS", notes: "", cashier: "Revan" },
  { month: "April", date: "23/4/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Revan" },
  { month: "April", date: "30/4/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },

  // --- MEI ---
  { month: "Mei", date: "4/5/2026", code: "AR-B250", productName: "Aren Latte", qty: 2, size: "250 ML", price: 15000, total: 30000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Mei", date: "4/5/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Mei", date: "16/5/2026", code: "AR-B250", productName: "Aren Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "Mei", date: "18/5/2026", code: "DS-B250", productName: "Dua Carita S", qty: 1, size: "250 ML", price: 13000, total: 13000, paymentMethod: "QRIS", notes: "", cashier: "Revan" },
  { month: "Mei", date: "25/5/2026", code: "DS-B250", productName: "Dua Carita S", qty: 1, size: "250 ML", price: 13000, total: 13000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "Mei", date: "26/5/2026", code: "AR-B250", productName: "Aren Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Revan" },
  { month: "Mei", date: "27/5/2026", code: "DS-B1L", productName: "Dua Carita S", qty: 1, size: "1000 ML", price: 47000, total: 47000, paymentMethod: "QRIS", notes: "", cashier: "Revan" },
  { month: "Mei", date: "27/5/2026", code: "AR-B1L", productName: "Aren Latte", qty: 2, size: "1000 ML", price: 55000, total: 110000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Mei", date: "27/5/2026", code: "HZ-B1L", productName: "Hazelnut Latte", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Mei", date: "27/5/2026", code: "CB-B1L", productName: "Choco Blend", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Mei", date: "30/5/2026", code: "AR-B1L", productName: "Aren Latte", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Mei", date: "30/5/2026", code: "HZ-B1L", productName: "Hazelnut Latte", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Mei", date: "30/5/2026", code: "CB-B1L", productName: "Choco Blend", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },

  // --- JUNI ---
  { month: "Juni", date: "2/6/2026", code: "AR-B250", productName: "Aren Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juni", date: "3/6/2026", code: "CB-B250", productName: "Choco Blend", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "Juni", date: "8/6/2026", code: "AR-B1L", productName: "Aren Latte", qty: 2, size: "1000 ML", price: 55000, total: 110000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juni", date: "8/6/2026", code: "CB-B1L", productName: "Choco Blend", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Juni", date: "8/6/2026", code: "AR-B250", productName: "Aren Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },

  // --- JULI ---
  { month: "Juli", date: "3/7/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "3/7/2026", code: "AR-B250", productName: "Aren Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "5/7/2026", code: "AR-B1L", productName: "Aren Latte", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "6/7/2026", code: "MT-B250", productName: "Matcha Latte", qty: 2, size: "250 ML", price: 15000, total: 30000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "6/7/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "7/7/2026", code: "CB-B250", productName: "Choco Blend", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "7/7/2026", code: "CB-B250", productName: "Choco Blend", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "7/7/2026", code: "DS-B250", productName: "Dua Carita S", qty: 1, size: "250 ML", price: 13000, total: 13000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "12/7/2026", code: "CB-B1L", productName: "Choco Blend", qty: 3, size: "1000 ML", price: 55000, total: 165000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "12/7/2026", code: "AR-B1L", productName: "Aren Latte", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "12/7/2026", code: "DS-B1L", productName: "Dua Carita S", qty: 1, size: "1000 ML", price: 47000, total: 47000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "13/7/2026", code: "AR-B250", productName: "Aren Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "13/7/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "14/7/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "14/7/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "14/7/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "14/7/2026", code: "MT-B250", productName: "Matcha Latte", qty: 2, size: "250 ML", price: 15000, total: 30000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "15/7/2026", code: "DS-B250", productName: "Dua Carita S", qty: 1, size: "250 ML", price: 13000, total: 13000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "Juli", date: "16/7/2026", code: "AR-B250", productName: "Aren Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "16/7/2026", code: "AR-B250", productName: "Aren Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "16/7/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "17/7/2026", code: "CB-B250", productName: "Choco Blend", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "Juli", date: "17/7/2026", code: "AR-B250", productName: "Aren Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Juli", date: "17/7/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Revan" },
  { month: "Juli", date: "19/7/2026", code: "MT-B250", productName: "Matcha Latte", qty: 2, size: "250 ML", price: 15000, total: 30000, paymentMethod: "QRIS", notes: "", cashier: "Revan" },

  // --- AGUSTUS ---
  { month: "Agustus", date: "8/8/2026", code: "CB-B250", productName: "Choco Blend", qty: 3, size: "250 ML", price: 15000, total: 45000, paymentMethod: "Tunai", notes: "", cashier: "Revan" },
  { month: "Agustus", date: "11/8/2026", code: "HZ-B1L", productName: "Hazelnut Latte", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "QRIS", notes: "", cashier: "Febri" },
  { month: "Agustus", date: "14/8/2026", code: "CB-B250", productName: "Choco Blend", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  // Event MOKAZAR
  { month: "Agustus", date: "20/8/2026", code: "DS-C12", productName: "Dua Carita S", qty: 39, size: "12 Oz", price: 10000, total: 390000, paymentMethod: "Tunai", notes: "MOKAZAR", cashier: "Raihan" },
  { month: "Agustus", date: "20/8/2026", code: "AR-C12", productName: "Aren Latte", qty: 19, size: "12 Oz", price: 13000, total: 247000, paymentMethod: "Tunai", notes: "MOKAZAR", cashier: "Raihan" },
  { month: "Agustus", date: "20/8/2026", code: "HZ-C12", productName: "Hazelnut Latte", qty: 20, size: "12 Oz", price: 13000, total: 260000, paymentMethod: "Tunai", notes: "MOKAZAR", cashier: "Raihan" },
  { month: "Agustus", date: "20/8/2026", code: "CB-C12", productName: "Choco Blend", qty: 9, size: "12 Oz", price: 15000, total: 135000, paymentMethod: "Tunai", notes: "MOKAZAR", cashier: "Raihan" },
  { month: "Agustus", date: "20/8/2026", code: "MT-C12", productName: "Matcha Latte", qty: 21, size: "12 Oz", price: 16000, total: 336000, paymentMethod: "Tunai", notes: "MOKAZAR", cashier: "Raihan" },
  // Non-Mokazar Agustus
  { month: "Agustus", date: "21/8/2026", code: "MT-B1L", productName: "Matcha Latte", qty: 1, size: "1000 ML", price: 55000, total: 55000, paymentMethod: "QRIS", notes: "", cashier: "Revan" },
  { month: "Agustus", date: "21/8/2026", code: "AR-B250", productName: "Aren Latte", qty: 2, size: "250 ML", price: 15000, total: 30000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Agustus", date: "21/8/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Agustus", date: "21/8/2026", code: "CB-B250", productName: "Choco Blend", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Agustus", date: "21/8/2026", code: "DS-B250", productName: "Dua Carita S", qty: 1, size: "250 ML", price: 13000, total: 13000, paymentMethod: "Tunai", notes: "", cashier: "Raihan" },
  { month: "Agustus", date: "23/8/2026", code: "DS-C12", productName: "Dua Carita S", qty: 1, size: "12 Oz", price: 10000, total: 10000, paymentMethod: "Tunai", notes: "", cashier: "Kasir Booth" },
  { month: "Agustus", date: "23/8/2026", code: "DS-C12", productName: "Dua Carita S", qty: 1, size: "12 Oz", price: 10000, total: 10000, paymentMethod: "QRIS", notes: "", cashier: "Kasir Booth" },
  { month: "Agustus", date: "23/8/2026", code: "DS-C12", productName: "Dua Carita S", qty: 1, size: "12 Oz", price: 10000, total: 10000, paymentMethod: "Tunai", notes: "", cashier: "Kasir Booth" },
  { month: "Agustus", date: "23/8/2026", code: "DS-C12", productName: "Dua Carita S", qty: 1, size: "12 Oz", price: 10000, total: 10000, paymentMethod: "Tunai", notes: "", cashier: "Kasir Booth" },
  { month: "Agustus", date: "23/8/2026", code: "DS-C12", productName: "Dua Carita S", qty: 3, size: "12 Oz", price: 10000, total: 30000, paymentMethod: "QRIS", notes: "", cashier: "Kasir Booth" },
  { month: "Agustus", date: "23/8/2026", code: "AR-C12", productName: "Aren Latte", qty: 1, size: "12 Oz", price: 13000, total: 13000, paymentMethod: "QRIS", notes: "", cashier: "Kasir Booth" },
  { month: "Agustus", date: "23/8/2026", code: "DS-C12", productName: "Dua Carita S", qty: 1, size: "12 Oz", price: 10000, total: 10000, paymentMethod: "QRIS", notes: "", cashier: "Kasir Booth" },
  { month: "Agustus", date: "23/8/2026", code: "DS-C12", productName: "Dua Carita S", qty: 1, size: "12 Oz", price: 10000, total: 10000, paymentMethod: "QRIS", notes: "", cashier: "Kasir Booth" },
  { month: "Agustus", date: "23/8/2026", code: "HZ-C12", productName: "Hazelnut Latte", qty: 1, size: "12 Oz", price: 13000, total: 13000, paymentMethod: "Tunai", notes: "", cashier: "Kasir Booth" },
  { month: "Agustus", date: "23/8/2026", code: "HZ-C12", productName: "Hazelnut Latte", qty: 1, size: "12 Oz", price: 13000, total: 13000, paymentMethod: "QRIS", notes: "", cashier: "Kasir Booth" },
  { month: "Agustus", date: "23/8/2026", code: "DS-C12", productName: "Dua Carita S", qty: 3, size: "12 Oz", price: 10000, total: 30000, paymentMethod: "Tunai", notes: "", cashier: "Kasir Booth" },
  { month: "Agustus", date: "30/8/2026", code: "DS-C12", productName: "Dua Carita S", qty: 31, size: "12 Oz", price: 10000, total: 310000, paymentMethod: "QRIS", notes: "", cashier: "Kasir Booth" },
  { month: "Agustus", date: "30/8/2026", code: "DS-B250", productName: "Dua Carita S", qty: 1, size: "250 ML", price: 13000, total: 13000, paymentMethod: "Tunai", notes: "", cashier: "Kasir Booth" },
  { month: "Agustus", date: "31/8/2026", code: "MT-B250", productName: "Matcha Latte", qty: 2, size: "250 ML", price: 15000, total: 30000, paymentMethod: "QRIS", notes: "", cashier: "Febri" },
  { month: "Agustus", date: "31/8/2026", code: "AR-B250", productName: "Aren Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Agustus", date: "31/8/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Agustus", date: "31/8/2026", code: "CB-B250", productName: "Choco Blend", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Agustus", date: "31/8/2026", code: "MT-B250", productName: "Matcha Latte", qty: 1, size: "250 ML", price: 15000, total: 15000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Agustus", date: "31/8/2026", code: "AR-C12", productName: "Aren Latte", qty: 1, size: "12 Oz", price: 13000, total: 13000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Agustus", date: "31/8/2026", code: "AR-B250", productName: "Aren Latte", qty: 5, size: "250 ML", price: 15000, total: 75000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Agustus", date: "31/8/2026", code: "HZ-B250", productName: "Hazelnut Latte", qty: 7, size: "250 ML", price: 15000, total: 105000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Agustus", date: "31/8/2026", code: "CB-B250", productName: "Choco Blend", qty: 2, size: "250 ML", price: 15000, total: 30000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Agustus", date: "31/8/2026", code: "DS-B250", productName: "Dua Carita S", qty: 4, size: "250 ML", price: 13000, total: 52000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
  { month: "Agustus", date: "31/8/2026", code: "MT-B250", productName: "Matcha Latte", qty: 5, size: "250 ML", price: 15000, total: 75000, paymentMethod: "QRIS", notes: "", cashier: "Raihan" },
];

// Mapping kode ke nama produk resmi di DB
const productCodeMap: Record<string, string> = {
  "HZ-B250": "Hazelnut Coffee Milk 250ml",
  "MT-B250": "Matcha Latte 250ml",
  "CB-B250": "Choco Blend Coffee 250ml",
  "AR-B250": "Aren Coffee Milk 250ml",
  "DS-B250": "Dua Carita Signature 250ml",
  "HZ-B1L": "Hazelnut Coffee Milk 1000ml",
  "AR-B1L": "Aren Coffee Milk 1000ml",
  "CB-B1L": "Choco Blend Coffee 1000ml",
  "DS-B1L": "Dua Carita Signature 1000ml",
  "MT-B1L": "Matcha Latte 1000ml",
  "DS-C12": "Dua Carita Signature",
  "AR-C12": "Aren Coffee Milk",
  "HZ-C12": "Hazelnut Coffee Milk",
  "CB-C12": "Choco Blend Coffee",
  "MT-C12": "Matcha Latte",
};

async function main() {
  console.log("=== 1. AMBIL PRODUK DARI DB ===");
  const dbProducts = await prisma.product.findMany();
  const prodMap = new Map<string, typeof dbProducts[0]>();
  for (const p of dbProducts) {
    prodMap.set(p.name, p);
  }

  console.log("=== 2. PASTIKAN EVENT MOKAZAR TERSEDIA ===");
  let mokazarEvent = await prisma.event.findFirst({
    where: { name: "MOKAZAR" },
  });
  if (!mokazarEvent) {
    mokazarEvent = await prisma.event.create({
      data: {
        name: "MOKAZAR",
        location: "Bazaar MOKAZAR",
        startDate: new Date("2026-08-20T00:00:00.000Z"),
        endDate: new Date("2026-08-20T23:59:59.000Z"),
        notes: "Event Bazaar MOKAZAR 20 Agustus 2026",
        status: "selesai",
      },
    });
    console.log("Event MOKAZAR created:", mokazarEvent.id);
  }

  console.log(`=== 3. IMPORT ${transactions.length} TRANSAKSI PENJUALAN ===`);
  let importedCount = 0;
  let totalRevenue = 0;

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    const targetProdName = productCodeMap[tx.code];
    if (!targetProdName) {
      console.warn(`Product code unknown: ${tx.code}`);
      continue;
    }

    const prod = prodMap.get(targetProdName);
    if (!prod) {
      console.warn(`Product not found in DB: ${targetProdName}`);
      continue;
    }

    // Parse date: D/M/YYYY
    const [dayStr, monthStr, yearStr] = tx.date.split("/");
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    // Variasikan jam transaksi agar tersebar wajar (antara jam 10:00 sampai 20:00 WIB)
    const hour = 10 + (i % 10);
    const minute = (i * 7) % 60;
    // WIB adalah UTC+7
    const txDate = new Date(Date.UTC(year, month - 1, day, hour - 7, minute, 0));

    const orderNumber = `DIR-${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}-${String(i + 1).padStart(4, "0")}`;

    const isMokazar = tx.notes.toUpperCase().includes("MOKAZAR");
    const eventId = isMokazar ? mokazarEvent.id : null;
    const customerName = isMokazar ? "Pelanggan MOKAZAR" : "Pelanggan Umum";
    const cashierName = tx.cashier ? tx.cashier : (isMokazar ? "Raihan" : "Kasir Booth");

    const paymentMethod = tx.paymentMethod === "QRIS" ? "qris" : (tx.paymentMethod === "Tunai" ? "cash" : "transfer");

    // Create order with item & payment
    await prisma.order.create({
      data: {
        orderNumber,
        orderSource: "DIRECT",
        status: "selesai",
        eventId,
        customerName,
        cashierName,
        subtotal: tx.total,
        discountAmount: 0,
        tax: 0,
        totalAmount: tx.total,
        createdAt: txDate,
        updatedAt: txDate,
        items: {
          create: [
            {
              productId: prod.id,
              qty: tx.qty,
              price: tx.price,
              notes: tx.notes || null,
              createdAt: txDate,
            },
          ],
        },
        payments: {
          create: [
            {
              method: paymentMethod,
              amount: tx.total,
              isDownPayment: false,
              paidAt: txDate,
            },
          ],
        },
      },
    });

    importedCount++;
    totalRevenue += tx.total;
  }

  console.log(`=== BERHASIL IMPORT ${importedCount} TRANSAKSI! ===`);
  console.log(`Total Omset Terinput: Rp ${totalRevenue.toLocaleString("id-ID")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
