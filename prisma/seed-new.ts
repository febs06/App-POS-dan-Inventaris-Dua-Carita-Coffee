import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding StoreSetting...");
  await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeName: "Dua Carita Coffee",
      tagline: "Bazaar & Pre-Order System",
      phoneNumber: "081234567890",
      address: "Jakarta, Indonesia",
      receiptFooter: "Terima Kasih atas Kunjungan Anda! Follow IG @duacarita.coffee",
      logoUrl: null,
    },
  });

  console.log("Seeding Employees...");
  const employees = [
    {
      name: "Febri (Owner)",
      username: "owner",
      pin: "1234",
      role: "OWNER",
    },
    {
      name: "Siti Rahma (Kasir Booth)",
      username: "kasir1",
      pin: "0000",
      role: "KASIR",
    },
    {
      name: "Dimas Pratama (Barista)",
      username: "barista1",
      pin: "1111",
      role: "BARISTA",
    },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { username: emp.username },
      update: { pin: emp.pin, role: emp.role, name: emp.name },
      create: emp,
    });
  }

  console.log("Seeding Raw Materials...");
  const rawMaterials = [
    {
      name: "Biji Kopi Arabika House Blend",
      category: "Bahan Minuman",
      stock: 3500,
      unit: "gram",
      minStock: 1000,
      costPerUnit: 250, // Rp 250/gram (Rp 250.000/kg)
      supplier: "Roastery Senja Utama",
    },
    {
      name: "Susu UHT Fresh Milk",
      category: "Bahan Minuman",
      stock: 12000,
      unit: "ml",
      minStock: 4000,
      costPerUnit: 19, // Rp 19/ml (Rp 19.000/liter)
      supplier: "Greenfields Distributor",
    },
    {
      name: "Sirup Caramel Premium",
      category: "Sirup & Flavour",
      stock: 2200,
      unit: "ml",
      minStock: 500,
      costPerUnit: 120,
      supplier: "Monin Supplier Jakarta",
    },
    {
      name: "Gula Aren Cair Organik",
      category: "Sirup & Flavour",
      stock: 4500,
      unit: "ml",
      minStock: 1000,
      costPerUnit: 45,
      supplier: "Aren Asli Lebak",
    },
    {
      name: "Cup Plastik 16oz Sablon",
      category: "Kemasan & Packaging",
      stock: 450,
      unit: "pcs",
      minStock: 100,
      costPerUnit: 650,
      supplier: "CV Kemasan Nusantara",
    },
    {
      name: "Lid Cup Dome & Sedotan Kertas",
      category: "Kemasan & Packaging",
      stock: 500,
      unit: "pcs",
      minStock: 150,
      costPerUnit: 250,
      supplier: "CV Kemasan Nusantara",
    },
    {
      name: "Bubuk Matcha Uji Premium",
      category: "Bahan Minuman",
      stock: 300, // Stok menipis (< minStock)
      unit: "gram",
      minStock: 500,
      costPerUnit: 600,
      supplier: "Kyoto Imports ID",
    },
  ];

  for (const raw of rawMaterials) {
    const existing = await prisma.rawMaterial.findFirst({
      where: { name: raw.name },
    });
    if (!existing) {
      const created = await prisma.rawMaterial.create({
        data: raw,
      });

      // Create initial stock log
      await prisma.rawMaterialLog.create({
        data: {
          rawMaterialId: created.id,
          changeQty: raw.stock,
          type: "restock",
          notes: "Stok awal pembukaan sistem",
        },
      });
    }
  }

  console.log("Done seeding new features!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
