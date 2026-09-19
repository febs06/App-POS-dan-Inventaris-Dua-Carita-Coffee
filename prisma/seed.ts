import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning existing database...");
  await prisma.stockLog.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.voucher.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.event.deleteMany({});

  console.log("Seeding Events...");
  const eventSenayan = await prisma.event.create({
    data: {
      name: "Bazaar Kuliner GBK Senayan",
      location: "Parkir Timur GBK, Jakarta Pusat",
      startDate: new Date("2026-09-18T09:00:00Z"),
      endDate: new Date("2026-09-22T21:00:00Z"),
      notes: "Booth A-12 dekat pintu masuk utama. Ramai saat sore & weekend.",
      status: "ongoing",
    },
  });

  const eventMonas = await prisma.event.create({
    data: {
      name: "Festival UMKM Monas Merdeka",
      location: "Silang Barat Monas, Jakarta",
      startDate: new Date("2026-09-26T08:00:00Z"),
      endDate: new Date("2026-09-28T22:00:00Z"),
      notes: "Booth Tenda B-05. Target 300 cup per hari.",
      status: "upcoming",
    },
  });

  const eventKemang = await prisma.event.create({
    data: {
      name: "Weekend Pop-Up Market Kemang",
      location: "Plaza Kemang 88, Jakarta Selatan",
      startDate: new Date("2026-09-10T10:00:00Z"),
      endDate: new Date("2026-09-12T20:00:00Z"),
      notes: "Event bazaar minggu lalu, omzet memuaskan.",
      status: "selesai",
    },
  });

  console.log("Seeding Categories...");
  const catMinuman = await prisma.category.create({
    data: {
      name: "Kopi & Minuman Segar",
      description: "Aneka racikan kopi espresso dan mocktail menyegarkan",
    },
  });

  const catTeh = await prisma.category.create({
    data: {
      name: "Teh & Artisan Latte",
      description: "Matcha premium, teh buah, dan susu rempah",
    },
  });

  const catSnack = await prisma.category.create({
    data: {
      name: "Pastry & Snack Booth",
      description: "Roti panggang, pastry renyah, dan camilan gurih",
    },
  });

  console.log("Seeding Products...");
  const prodKopiSusu = await prisma.product.create({
    data: {
      name: "Kopi Susu Gula Aren",
      categoryId: catMinuman.id,
      price: 22000,
      cost: 9500,
      stock: 65,
      unit: "cup",
      imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60",
      isActive: true,
    },
  });

  const prodCaramelLatte = await prisma.product.create({
    data: {
      name: "Iced Caramel Macchiato",
      categoryId: catMinuman.id,
      price: 28000,
      cost: 12000,
      stock: 40,
      unit: "cup",
      imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=60",
      isActive: true,
    },
  });

  const prodMatcha = await prisma.product.create({
    data: {
      name: "Matcha Oat Latte",
      categoryId: catTeh.id,
      price: 27000,
      cost: 13500,
      stock: 35,
      unit: "cup",
      imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60",
      isActive: true,
    },
  });

  const prodPeachBerry = await prisma.product.create({
    data: {
      name: "Peach Berry Sparkling Tea",
      categoryId: catTeh.id,
      price: 24000,
      cost: 9000,
      stock: 50,
      unit: "cup",
      imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=60",
      isActive: true,
    },
  });

  const prodCroissant = await prisma.product.create({
    data: {
      name: "Almond Butter Croissant",
      categoryId: catSnack.id,
      price: 26000,
      cost: 14000,
      stock: 18,
      unit: "pcs",
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60",
      isActive: true,
    },
  });

  const prodDimsum = await prisma.product.create({
    data: {
      name: "Dimsum Mentai Mozza (4 pcs)",
      categoryId: catSnack.id,
      price: 32000,
      cost: 17000,
      stock: 8, // Stok menipis untuk alert!
      unit: "porsi",
      imageUrl: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&auto=format&fit=crop&q=60",
      isActive: true,
    },
  });

  const prodCinnamonRoll = await prisma.product.create({
    data: {
      name: "Glazed Cinnamon Roll",
      categoryId: catSnack.id,
      price: 23000,
      cost: 11000,
      stock: 22,
      unit: "pcs",
      imageUrl: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=500&auto=format&fit=crop&q=60",
      isActive: true,
    },
  });

  console.log("Seeding Customers...");
  const custBudi = await prisma.customer.create({
    data: {
      name: "Budi Santoso",
      phoneNumber: "6281234567890",
      notes: "Suka pesan matcha oat milk manis sedikit, kantor dekat GBK.",
    },
  });

  const custSarah = await prisma.customer.create({
    data: {
      name: "Sarah Wijaya",
      phoneNumber: "6287711223344",
      notes: "Langganan PO croissant & dimsum mentai untuk meeting tim.",
    },
  });

  const custReza = await prisma.customer.create({
    data: {
      name: "Reza Pratama",
      phoneNumber: "6285699887766",
      notes: "Teman SMA, order PO biasanya COD area Tebet / Senayan.",
    },
  });

  console.log("Seeding Vouchers...");
  const vchDiskon10 = await prisma.voucher.create({
    data: {
      code: "BAZAAR10",
      type: "percentage",
      value: 10,
      minPurchase: 50000,
      maxDiscount: 15000,
      startDate: new Date("2026-09-01T00:00:00Z"),
      endDate: new Date("2026-10-31T23:59:59Z"),
      usageLimit: 100,
      usedCount: 14,
      isActive: true,
    },
  });

  const vchHemat5k = await prisma.voucher.create({
    data: {
      code: "HEMAT5RB",
      type: "nominal",
      value: 5000,
      minPurchase: 40000,
      startDate: new Date("2026-09-01T00:00:00Z"),
      endDate: new Date("2026-10-31T23:59:59Z"),
      usageLimit: 50,
      usedCount: 8,
      isActive: true,
    },
  });

  console.log("Seeding Orders & Payments...");
  // Order 1: Direct di Bazaar Senayan (Selesai, Lunas QRIS)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: "DIR-260918-001",
      orderSource: "DIRECT",
      eventId: eventSenayan.id,
      status: "selesai",
      pickupMethod: "ambil di event",
      subtotal: 70000,
      discountAmount: 7000,
      voucherId: vchDiskon10.id,
      tax: 0,
      totalAmount: 63000,
      createdAt: new Date("2026-09-18T10:30:00Z"),
      items: {
        create: [
          { productId: prodKopiSusu.id, qty: 2, price: 22000, notes: "Less sugar" },
          { productId: prodCroissant.id, qty: 1, price: 26000 },
        ],
      },
      payments: {
        create: [
          {
            method: "qris",
            amount: 63000,
            isDownPayment: false,
            paidAt: new Date("2026-09-18T10:32:00Z"),
          },
        ],
      },
    },
  });

  // Order 2: Direct di Bazaar Senayan (Selesai, Lunas Cash)
  const order2 = await prisma.order.create({
    data: {
      orderNumber: "DIR-260918-002",
      orderSource: "DIRECT",
      eventId: eventSenayan.id,
      status: "selesai",
      pickupMethod: "ambil di event",
      subtotal: 54000,
      discountAmount: 0,
      tax: 0,
      totalAmount: 54000,
      createdAt: new Date("2026-09-18T11:15:00Z"),
      items: {
        create: [
          { productId: prodMatcha.id, qty: 2, price: 27000 },
        ],
      },
      payments: {
        create: [
          {
            method: "cash",
            amount: 54000,
            isDownPayment: false,
            paidAt: new Date("2026-09-18T11:16:00Z"),
          },
        ],
      },
    },
  });

  // Order 3: PO Sarah (Status: Siap Diambil di Bazaar Senayan, Bayar DP 50rb via Transfer)
  const order3 = await prisma.order.create({
    data: {
      orderNumber: "PO-260918-001",
      orderSource: "PO",
      eventId: eventSenayan.id,
      customerId: custSarah.id,
      status: "siap diambil",
      pickupMethod: "ambil di event",
      pickupDate: new Date("2026-09-19T14:00:00Z"),
      subtotal: 142000,
      discountAmount: 10000,
      tax: 0,
      totalAmount: 132000,
      createdAt: new Date("2026-09-17T15:00:00Z"),
      items: {
        create: [
          { productId: prodDimsum.id, qty: 2, price: 32000, notes: "Pedas mantap" },
          { productId: prodCroissant.id, qty: 3, price: 26000 },
        ],
      },
      payments: {
        create: [
          {
            method: "transfer",
            amount: 50000,
            isDownPayment: true,
            paidAt: new Date("2026-09-17T16:00:00Z"),
          },
        ],
      },
    },
  });

  // Order 4: PO Budi (Status: Diproses, COD, Lunas via Transfer)
  const order4 = await prisma.order.create({
    data: {
      orderNumber: "PO-260918-002",
      orderSource: "PO",
      customerId: custBudi.id,
      status: "diproses",
      pickupMethod: "COD",
      pickupDate: new Date("2026-09-20T11:00:00Z"),
      subtotal: 94000,
      discountAmount: 5000,
      voucherId: vchHemat5k.id,
      tax: 0,
      totalAmount: 89000,
      createdAt: new Date("2026-09-18T08:20:00Z"),
      items: {
        create: [
          { productId: prodKopiSusu.id, qty: 2, price: 22000 },
          { productId: prodPeachBerry.id, qty: 1, price: 24000 },
          { productId: prodCinnamonRoll.id, qty: 1, price: 23000 },
        ],
      },
      payments: {
        create: [
          {
            method: "transfer",
            amount: 89000,
            isDownPayment: false,
            paidAt: new Date("2026-09-18T08:35:00Z"),
          },
        ],
      },
    },
  });

  // Order 5: Transaksi Masa Lalu di Kemang (Selesai)
  const order5 = await prisma.order.create({
    data: {
      orderNumber: "DIR-260911-001",
      orderSource: "DIRECT",
      eventId: eventKemang.id,
      status: "selesai",
      pickupMethod: "ambil di event",
      subtotal: 104000,
      discountAmount: 0,
      tax: 0,
      totalAmount: 104000,
      createdAt: new Date("2026-09-11T14:30:00Z"),
      items: {
        create: [
          { productId: prodCaramelLatte.id, qty: 2, price: 28000 },
          { productId: prodPeachBerry.id, qty: 2, price: 24000 },
        ],
      },
      payments: {
        create: [
          {
            method: "qris",
            amount: 104000,
            isDownPayment: false,
            paidAt: new Date("2026-09-11T14:31:00Z"),
          },
        ],
      },
    },
  });

  console.log("Seeding Stock Logs...");
  // Initial stock
  await prisma.stockLog.createMany({
    data: [
      { productId: prodKopiSusu.id, changeQty: 100, reason: "restock" },
      { productId: prodCaramelLatte.id, changeQty: 50, reason: "restock" },
      { productId: prodMatcha.id, changeQty: 50, reason: "restock" },
      { productId: prodPeachBerry.id, changeQty: 60, reason: "restock" },
      { productId: prodCroissant.id, changeQty: 30, reason: "restock" },
      { productId: prodDimsum.id, changeQty: 20, reason: "restock" },
      { productId: prodCinnamonRoll.id, changeQty: 30, reason: "restock" },
      // Alokasi ke event Senayan
      { productId: prodKopiSusu.id, changeQty: -30, reason: "dibawa ke event", eventId: eventSenayan.id },
      { productId: prodMatcha.id, changeQty: -15, reason: "dibawa ke event", eventId: eventSenayan.id },
      { productId: prodCroissant.id, changeQty: -10, reason: "dibawa ke event", eventId: eventSenayan.id },
    ],
  });

  console.log("Seeding complete successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
