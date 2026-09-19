import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function main() {
  const jsonPath = "C:\\Users\\febri\\.gemini\\antigravity-ide\\brain\\fe84656d-3c1f-453a-81bc-b19a196613db\\scratch\\exported_local_data.json";
  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(rawData);

  console.log("Cleaning Neon tables...");
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.stockLog.deleteMany({});
  await prisma.rawMaterialLog.deleteMany({});
  await prisma.productIngredient.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.rawMaterial.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.voucher.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.storeSetting.deleteMany({});

  console.log("Importing StoreSetting...");
  for (const item of data.StoreSetting) {
    await prisma.storeSetting.create({
      data: {
        id: item.id,
        storeName: item.storeName,
        tagline: item.tagline,
        logoUrl: item.logoUrl,
        phoneNumber: item.phoneNumber,
        address: item.address,
        receiptFooter: item.receiptFooter,
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      },
    });
  }

  console.log("Importing Events...");
  for (const item of data.Event) {
    await prisma.event.create({
      data: {
        id: item.id,
        name: item.name,
        location: item.location,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        notes: item.notes,
        status: item.status,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      },
    });
  }

  console.log("Importing Categories...");
  for (const item of data.Category) {
    await prisma.category.create({
      data: {
        id: item.id,
        name: item.name,
        description: item.description,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      },
    });
  }

  console.log("Importing RawMaterials...");
  for (const item of data.RawMaterial) {
    await prisma.rawMaterial.create({
      data: {
        id: item.id,
        name: item.name,
        category: item.category,
        stock: item.stock,
        unit: item.unit,
        minStock: item.minStock,
        costPerUnit: item.costPerUnit,
        supplier: item.supplier,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      },
    });
  }

  console.log("Importing Products...");
  for (const item of data.Product) {
    await prisma.product.create({
      data: {
        id: item.id,
        name: item.name,
        categoryId: item.categoryId,
        price: item.price,
        cost: item.cost,
        stock: item.stock,
        unit: item.unit,
        imageUrl: item.imageUrl,
        isActive: Boolean(item.isActive),
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      },
    });
  }

  console.log("Importing ProductIngredients...");
  for (const item of data.ProductIngredient) {
    await prisma.productIngredient.create({
      data: {
        id: item.id,
        productId: item.productId,
        rawMaterialId: item.rawMaterialId,
        amount: item.amount,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      },
    });
  }

  console.log("Importing Customers...");
  for (const item of data.Customer) {
    await prisma.customer.create({
      data: {
        id: item.id,
        name: item.name,
        phoneNumber: item.phoneNumber,
        notes: item.notes,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      },
    });
  }

  console.log("Importing Vouchers...");
  for (const item of data.Voucher) {
    await prisma.voucher.create({
      data: {
        id: item.id,
        code: item.code,
        type: item.type,
        value: item.value,
        minPurchase: item.minPurchase,
        maxDiscount: item.maxDiscount,
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        usageLimit: item.usageLimit,
        usedCount: item.usedCount || 0,
        isActive: Boolean(item.isActive),
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      },
    });
  }

  console.log("Importing Employees...");
  for (const item of data.Employee) {
    await prisma.employee.create({
      data: {
        id: item.id,
        name: item.name,
        username: item.username,
        pin: item.pin,
        role: item.role,
        isActive: Boolean(item.isActive),
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
      },
    });
  }

  console.log("Importing StockLogs...");
  for (const item of data.StockLog) {
    await prisma.stockLog.create({
      data: {
        id: item.id,
        productId: item.productId,
        changeQty: item.changeQty,
        reason: item.reason,
        eventId: item.eventId,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      },
    });
  }

  console.log("Importing RawMaterialLogs...");
  for (const item of data.RawMaterialLog) {
    await prisma.rawMaterialLog.create({
      data: {
        id: item.id,
        rawMaterialId: item.rawMaterialId,
        changeQty: item.changeQty,
        type: item.type,
        notes: item.notes,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      },
    });
  }

  console.log("Neon database successfully synchronized with local data!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
