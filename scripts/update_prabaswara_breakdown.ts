import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Memperbarui rincian item menu untuk Bazaar PRABASWARA...');

  const hazelnut = await prisma.product.findFirst({ where: { name: 'Hazelnut Coffee Milk' } });
  const matcha = await prisma.product.findFirst({ where: { name: 'Matcha Latte' } });
  const signature = await prisma.product.findFirst({ where: { name: 'Dua Carita Signature' } });
  const choco = await prisma.product.findFirst({ where: { name: 'Choco Blend Coffee' } });
  const aren = await prisma.product.findFirst({ where: { name: 'Aren Coffee Milk' } });

  if (!hazelnut || !matcha || !signature || !choco || !aren) {
    throw new Error('Salah satu produk menu tidak ditemukan di database!');
  }

  const cashOrderNumber = 'DIR-20260917-0211';
  const qrisOrderNumber = 'DIR-20260917-0212';

  const cashOrder = await prisma.order.findUnique({ where: { orderNumber: cashOrderNumber } });
  const qrisOrder = await prisma.order.findUnique({ where: { orderNumber: qrisOrderNumber } });

  if (!cashOrder || !qrisOrder) {
    throw new Error('Order PRABASWARA tidak ditemukan di database!');
  }

  // 1. Bersihkan order items lama
  console.log('🧹 Menghapus item placeholder lama...');
  await prisma.orderItem.deleteMany({
    where: { orderId: { in: [cashOrder.id, qrisOrder.id] } },
  });

  // 2. Buat item baru untuk Cash Order (31 cup | Rp 414.000)
  console.log('💾 Menambahkan rincian item ke Cash Order (DIR-20260917-0211)...');
  const cashItems = [
    { productId: hazelnut.id, qty: 12, price: 13000 },
    { productId: matcha.id, qty: 7, price: 16000 },
    { productId: signature.id, qty: 6, price: 10000 },
    { productId: choco.id, qty: 4, price: 15000 },
    { productId: aren.id, qty: 2, price: 13000 },
  ];

  for (const item of cashItems) {
    await prisma.orderItem.create({
      data: {
        orderId: cashOrder.id,
        productId: item.productId,
        qty: item.qty,
        price: item.price,
        createdAt: cashOrder.createdAt,
      },
    });
  }

  // 3. Buat item baru untuk QRIS Order (32 cup | Rp 414.000)
  console.log('💾 Menambahkan rincian item ke QRIS Order (DIR-20260917-0212)...');
  const qrisItems = [
    { productId: hazelnut.id, qty: 13, price: 13000 },
    { productId: matcha.id, qty: 4, price: 16000 },
    { productId: signature.id, qty: 8, price: 10000 },
    { productId: choco.id, qty: 5, price: 15000 },
    { productId: aren.id, qty: 2, price: 13000 },
  ];

  for (const item of qrisItems) {
    await prisma.orderItem.create({
      data: {
        orderId: qrisOrder.id,
        productId: item.productId,
        qty: item.qty,
        price: item.price,
        createdAt: qrisOrder.createdAt,
      },
    });
  }

  // 4. Verifikasi hasil
  const updatedOrders = await prisma.order.findMany({
    where: { id: { in: [cashOrder.id, qrisOrder.id] } },
    include: { items: { include: { product: true } } },
  });

  console.log('\n================ HASIL VERIFIKASI ================');
  let totalCupsAll = 0;
  let totalRevenueAll = 0;

  for (const o of updatedOrders) {
    const cups = o.items.reduce((s, i) => s + i.qty, 0);
    const amount = o.items.reduce((s, i) => s + (i.price * i.qty), 0);
    totalCupsAll += cups;
    totalRevenueAll += amount;

    console.log(`\n📦 Order: ${o.orderNumber} (Total: Rp ${o.totalAmount.toLocaleString('id-ID')})`);
    console.log(`   Item Count: ${cups} cups | Subtotal: Rp ${amount.toLocaleString('id-ID')}`);
    o.items.forEach((it) => {
      console.log(`   - ${it.product.name}: ${it.qty} cup @ Rp ${it.price.toLocaleString('id-ID')} = Rp ${(it.price * it.qty).toLocaleString('id-ID')}`);
    });
  }

  console.log('\n--------------------------------------------------');
  console.log(`🎉 Total Cup Keseluruhan: ${totalCupsAll} cup (Target: 63 cup)`);
  console.log(`💰 Total Omset Keseluruhan: Rp ${totalRevenueAll.toLocaleString('id-ID')} (Target: Rp 828.000)`);
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Gagal memperbarui breakdown PRABASWARA:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
