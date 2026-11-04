import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SalesToSync {
  dateStr: string; // YYYY-MM-DD
  account: 'CASH' | 'QRIS';
  amount: number;
  customerName: string;
  notes: string;
  cashierName: string;
  eventName?: string;
}

const SALES_TO_SYNC: SalesToSync[] = [
  { dateStr: '2026-09-01', account: 'QRIS', amount: 88000, customerName: 'Ibu', notes: 'Penjualan QRIS - Ibu', cashierName: 'Kasir Booth' },
  { dateStr: '2026-09-01', account: 'QRIS', amount: 153500, customerName: 'Febri', notes: 'Penjualan QRIS - Febri', cashierName: 'Febri' },
  { dateStr: '2026-09-01', account: 'QRIS', amount: 345000, customerName: 'Tante Dini PMI', notes: 'Penjualan QRIS - Tante Dini PMI', cashierName: 'Kasir Booth', eventName: 'Bazar PMI' },
  { dateStr: '2026-09-04', account: 'QRIS', amount: 60000, customerName: 'Babeh Raihan', notes: 'Penjualan QRIS - Babeh Raihan', cashierName: 'Raihan' },
  { dateStr: '2026-09-07', account: 'CASH', amount: 15000, customerName: 'Teh Elie', notes: 'Penjualan Tunai - Teh Elie', cashierName: 'Kasir Booth' },
  { dateStr: '2026-09-09', account: 'QRIS', amount: 81500, customerName: 'Royan', notes: 'Penjualan QRIS - Royan', cashierName: 'Kasir Booth' },
  { dateStr: '2026-09-11', account: 'CASH', amount: 1500000, customerName: 'SD BPI', notes: 'Penjualan Paket Booth / Pesanan SD BPI', cashierName: 'Kasir Booth' },
  { dateStr: '2026-09-15', account: 'QRIS', amount: 15000, customerName: 'Ibu Raihan', notes: 'Penjualan QRIS - Ibu Raihan', cashierName: 'Raihan' },
  { dateStr: '2026-09-15', account: 'QRIS', amount: 45000, customerName: 'Babeh Raihan', notes: 'Penjualan QRIS - Babeh Raihan', cashierName: 'Raihan' },
  { dateStr: '2026-09-16', account: 'QRIS', amount: 60000, customerName: 'Babeh Raihan', notes: 'Penjualan QRIS - Babeh Raihan', cashierName: 'Raihan' },
  { dateStr: '2026-09-17', account: 'CASH', amount: 414000, customerName: 'Pelanggan PRABASWARA', notes: 'Penjualan Bazaar PRABASWARA (Cash)', cashierName: 'Kasir Booth', eventName: 'PRABASWARA' },
  { dateStr: '2026-09-17', account: 'QRIS', amount: 414000, customerName: 'Pelanggan PRABASWARA', notes: 'Penjualan Bazaar PRABASWARA (QRIS)', cashierName: 'Kasir Booth', eventName: 'PRABASWARA' },
  { dateStr: '2026-09-17', account: 'QRIS', amount: 156000, customerName: 'Babeh Raihan', notes: 'Penjualan QRIS - Babeh Raihan', cashierName: 'Raihan' },
  { dateStr: '2026-09-17', account: 'QRIS', amount: 270000, customerName: 'Babeh Raihan', notes: 'Penjualan QRIS - Babeh Raihan', cashierName: 'Raihan' },
  { dateStr: '2026-09-18', account: 'CASH', amount: 15000, customerName: 'Babeh Raihan', notes: 'Penjualan Tunai - Babeh Raihan', cashierName: 'Raihan' },
  { dateStr: '2026-09-18', account: 'CASH', amount: 60000, customerName: 'Babeh Raihan', notes: 'Penjualan Tunai - Babeh Raihan', cashierName: 'Raihan' },
  { dateStr: '2026-09-18', account: 'QRIS', amount: 15000, customerName: 'Babeh Raihan', notes: 'Penjualan QRIS - Babeh Raihan', cashierName: 'Raihan' },
  { dateStr: '2026-09-20', account: 'CASH', amount: 13000, customerName: 'Aca', notes: 'Penjualan Tunai - Aca', cashierName: 'Kasir Booth' },
  { dateStr: '2026-09-21', account: 'QRIS', amount: 275000, customerName: 'Pelanggan Umum', notes: 'Penjualan QRIS', cashierName: 'Kasir Booth' },
  { dateStr: '2026-09-23', account: 'CASH', amount: 15000, customerName: 'Babeh Raihan', notes: 'Penjualan Tunai - Babeh Raihan', cashierName: 'Raihan' },
  { dateStr: '2026-09-23', account: 'CASH', amount: 55000, customerName: 'Babeh Raihan', notes: 'Penjualan Tunai - Babeh Raihan', cashierName: 'Raihan' },
  { dateStr: '2026-09-25', account: 'CASH', amount: 70000, customerName: 'Babeh Raihan', notes: 'Penjualan Tunai - Babeh Raihan', cashierName: 'Raihan' },
  { dateStr: '2026-10-02', account: 'CASH', amount: 58000, customerName: 'Babeh Revan', notes: 'Penjualan Tunai - Babeh Revan', cashierName: 'Revan' },
  { dateStr: '2026-10-04', account: 'CASH', amount: 372000, customerName: 'Babeh Revan', notes: 'Penjualan Tunai - Babeh Revan', cashierName: 'Revan' },
  { dateStr: '2026-10-04', account: 'CASH', amount: 145000, customerName: 'Arfi', notes: 'Penjualan Tunai - Arfi', cashierName: 'Kasir Booth' },
  { dateStr: '2026-10-04', account: 'CASH', amount: 28000, customerName: 'Teh Amel', notes: 'Penjualan Tunai - Teh Amel', cashierName: 'Kasir Booth' },
  { dateStr: '2026-10-05', account: 'QRIS', amount: 53000, customerName: 'Pelanggan Umum', notes: 'Penjualan QRIS', cashierName: 'Kasir Booth' },
  { dateStr: '2026-10-09', account: 'CASH', amount: 15000, customerName: 'Teh Elie', notes: 'Penjualan Tunai - Teh Elie', cashierName: 'Kasir Booth' },
  { dateStr: '2026-10-10', account: 'CASH', amount: 13000, customerName: 'Mamah Revan', notes: 'Penjualan Tunai - Mamah Revan', cashierName: 'Revan' },
  { dateStr: '2026-10-10', account: 'QRIS', amount: 28000, customerName: 'Pelanggan Umum', notes: 'Penjualan QRIS', cashierName: 'Kasir Booth' },
];

async function main() {
  console.log('🚀 Memulai Sinkronisasi Penjualan September - Oktober ke Riwayat & Laporan Audit...');

  const events = await prisma.event.findMany();
  const eventMap = new Map<string, string>();
  events.forEach((ev) => eventMap.set(ev.name.toUpperCase(), ev.id));

  // Get a default product to attach
  const defaultProduct = await prisma.product.findFirst({
    where: { name: { contains: 'Dua Carita Signature' } }
  }) || await prisma.product.findFirst();

  if (!defaultProduct) {
    throw new Error('Tidak ada produk terdaftar di database!');
  }

  let createdOrders = 0;
  let totalRevenueAdded = 0;

  for (let i = 0; i < SALES_TO_SYNC.length; i++) {
    const s = SALES_TO_SYNC[i];
    const [year, month, day] = s.dateStr.split('-').map(Number);
    const orderNumber = `DIR-${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}-${String(200 + i + 1).padStart(4, '0')}`;

    // Randomize time between 11:00 and 19:00 WIB (UTC+7)
    const hour = 11 + (i % 8);
    const minute = (i * 13) % 60;
    const txDate = new Date(Date.UTC(year, month - 1, day, hour - 7, minute, 0));

    let eventId: string | null = null;
    if (s.eventName) {
      for (const [name, id] of eventMap.entries()) {
        if (s.eventName.toUpperCase().includes(name) || name.includes(s.eventName.toUpperCase())) {
          eventId = id;
          break;
        }
      }
    }

    const paymentMethod = s.account === 'QRIS' ? 'qris' : 'cash';

    // Upsert order by orderNumber
    const existing = await prisma.order.findUnique({
      where: { orderNumber },
    });

    if (existing) {
      console.log(`Order ${orderNumber} sudah ada, melewati...`);
      continue;
    }

    await prisma.order.create({
      data: {
        orderNumber,
        orderSource: 'DIRECT',
        status: 'selesai',
        event: eventId ? { connect: { id: eventId } } : undefined,
        customerName: s.customerName,
        cashierName: s.cashierName,
        subtotal: s.amount,
        discountAmount: 0,
        tax: 0,
        totalAmount: s.amount,
        createdAt: txDate,
        updatedAt: txDate,
        items: {
          create: [
            {
              productId: defaultProduct.id,
              qty: 1,
              price: s.amount,
              notes: s.notes,
              createdAt: txDate,
            },
          ],
        },
        payments: {
          create: [
            {
              method: paymentMethod,
              amount: s.amount,
              isDownPayment: false,
              paidAt: txDate,
            },
          ],
        },
      },
    });

    createdOrders++;
    totalRevenueAdded += s.amount;
  }

  const finalOrderCount = await prisma.order.count();
  console.log('\n================ HASIL SINKRONISASI ================');
  console.log(`✅ Berhasil menambahkan ${createdOrders} Order Penjualan baru ke tabel Order!`);
  console.log(`💰 Total Omset baru yang masuk ke Laporan: Rp ${totalRevenueAdded.toLocaleString('id-ID')}`);
  console.log(`📊 Total Order keseluruhan di Riwayat & Laporan Audit: ${finalOrderCount} transaksi`);
  console.log('====================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Gagal sinkronisasi order:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
