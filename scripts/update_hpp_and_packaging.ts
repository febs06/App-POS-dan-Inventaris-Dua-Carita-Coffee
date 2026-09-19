import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 1. Data Kemasan (Packaging)
const packagingMaterials = [
  {
    name: "Cup Injection 12 Oz",
    category: "Kemasan & Packaging",
    unit: "pcs",
    costPerUnit: 1036.0,
    stock: 500,
    minStock: 100,
  },
  {
    name: "Tutup Cup Injection",
    category: "Kemasan & Packaging",
    unit: "pcs",
    costPerUnit: 440.0,
    stock: 500,
    minStock: 100,
  },
  {
    name: "Botol 250 ML",
    category: "Kemasan & Packaging",
    unit: "pcs",
    costPerUnit: 1075.0,
    stock: 200,
    minStock: 50,
  },
  {
    name: "Stiker 250 ML",
    category: "Kemasan & Packaging",
    unit: "pcs",
    costPerUnit: 555.56,
    stock: 200,
    minStock: 50,
  },
  {
    name: "Botol 1000 ML",
    category: "Kemasan & Packaging",
    unit: "pcs",
    costPerUnit: 2800.0,
    stock: 100,
    minStock: 25,
  },
  {
    name: "Stiker 1000 ML",
    category: "Kemasan & Packaging",
    unit: "pcs",
    costPerUnit: 1071.43,
    stock: 100,
    minStock: 25,
  },
];

// 2. Data Menu Lengkap dengan Kemasan & Harga Resmi dari Kalkulator HPP
const fullProductsData = [
  // =====================
  // A. CUP 12 OZ (6 Menu)
  // =====================
  {
    name: "Aren Coffee Milk",
    categoryName: "Kopi & Minuman Segar",
    price: 13000,
    cost: 5832.18,
    unit: "cup",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 40 },
      { rawName: "Rich Milk", amount: 25 },
      { rawName: "Creamer", amount: 20 },
      { rawName: "Air", amount: 90 },
      { rawName: "Gula Aren", amount: 20 },
      { rawName: "Cup Injection 12 Oz", amount: 1 },
      { rawName: "Tutup Cup Injection", amount: 1 },
    ],
  },
  {
    name: "Hazelnut Coffee Milk",
    categoryName: "Kopi & Minuman Segar",
    price: 13000,
    cost: 7853.72,
    unit: "cup",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 40 },
      { rawName: "Rich Milk", amount: 25 },
      { rawName: "Creamer", amount: 20 },
      { rawName: "Air", amount: 90 },
      { rawName: "Syrup Hazelnut", amount: 20 },
      { rawName: "Cup Injection 12 Oz", amount: 1 },
      { rawName: "Tutup Cup Injection", amount: 1 },
    ],
  },
  {
    name: "Choco Blend Coffee",
    categoryName: "Kopi & Minuman Segar",
    price: 15000,
    cost: 7952.18,
    unit: "cup",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 40 },
      { rawName: "Rich Milk", amount: 25 },
      { rawName: "Creamer", amount: 20 },
      { rawName: "Air", amount: 90 },
      { rawName: "Syrup Cokelat", amount: 20 },
      { rawName: "Cup Injection 12 Oz", amount: 1 },
      { rawName: "Tutup Cup Injection", amount: 1 },
    ],
  },
  {
    name: "Dua Carita Signature",
    categoryName: "Kopi & Minuman Segar",
    price: 10000,
    cost: 5742.18,
    unit: "cup",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 40 },
      { rawName: "Rich Milk", amount: 25 },
      { rawName: "Creamer", amount: 20 },
      { rawName: "Air", amount: 90 },
      { rawName: "Gula Pasir", amount: 20 },
      { rawName: "Cup Injection 12 Oz", amount: 1 },
      { rawName: "Tutup Cup Injection", amount: 1 },
    ],
  },
  {
    name: "Matcha Latte",
    categoryName: "Teh & Artisan Latte",
    price: 16000,
    cost: 7552.18,
    unit: "cup",
    ingredients: [
      { rawName: "Matcha", amount: 4 },
      { rawName: "Susu UHT", amount: 40 },
      { rawName: "Rich Milk", amount: 25 },
      { rawName: "Creamer", amount: 20 },
      { rawName: "Air", amount: 70 },
      { rawName: "Gula Pasir", amount: 25 },
      { rawName: "Cup Injection 12 Oz", amount: 1 },
      { rawName: "Tutup Cup Injection", amount: 1 },
    ],
  },
  {
    name: "Caffe Latte",
    categoryName: "Kopi & Minuman Segar",
    price: 13000,
    cost: 5392.18,
    unit: "cup",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 40 },
      { rawName: "Rich Milk", amount: 25 },
      { rawName: "Creamer", amount: 20 },
      { rawName: "Air", amount: 90 },
      { rawName: "Cup Injection 12 Oz", amount: 1 },
      { rawName: "Tutup Cup Injection", amount: 1 },
    ],
  },

  // =======================
  // B. BOTOL 250 ML (6 Menu)
  // =======================
  {
    name: "Aren Coffee Milk 250ml",
    categoryName: "Botol 250ml",
    price: 15000,
    cost: 7185.82,
    unit: "botol",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 60 },
      { rawName: "Rich Milk", amount: 50 },
      { rawName: "Creamer", amount: 25 },
      { rawName: "Air", amount: 115 },
      { rawName: "Gula Aren", amount: 20 },
      { rawName: "Botol 250 ML", amount: 1 },
      { rawName: "Stiker 250 ML", amount: 1 },
    ],
  },
  {
    name: "Hazelnut Coffee Milk 250ml",
    categoryName: "Botol 250ml",
    price: 16000,
    cost: 9207.36,
    unit: "botol",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 60 },
      { rawName: "Rich Milk", amount: 50 },
      { rawName: "Creamer", amount: 25 },
      { rawName: "Air", amount: 115 },
      { rawName: "Syrup Hazelnut", amount: 20 },
      { rawName: "Botol 250 ML", amount: 1 },
      { rawName: "Stiker 250 ML", amount: 1 },
    ],
  },
  {
    name: "Choco Blend Coffee 250ml",
    categoryName: "Botol 250ml",
    price: 18000,
    cost: 9305.82,
    unit: "botol",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 60 },
      { rawName: "Rich Milk", amount: 50 },
      { rawName: "Creamer", amount: 25 },
      { rawName: "Air", amount: 115 },
      { rawName: "Syrup Cokelat", amount: 20 },
      { rawName: "Botol 250 ML", amount: 1 },
      { rawName: "Stiker 250 ML", amount: 1 },
    ],
  },
  {
    name: "Dua Carita Signature 250ml",
    categoryName: "Botol 250ml",
    price: 13000,
    cost: 7095.82,
    unit: "botol",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 60 },
      { rawName: "Rich Milk", amount: 50 },
      { rawName: "Creamer", amount: 25 },
      { rawName: "Air", amount: 115 },
      { rawName: "Gula Pasir", amount: 20 },
      { rawName: "Botol 250 ML", amount: 1 },
      { rawName: "Stiker 250 ML", amount: 1 },
    ],
  },
  {
    name: "Matcha Latte 250ml",
    categoryName: "Botol 250ml",
    price: 19000,
    cost: 8905.82,
    unit: "botol",
    ingredients: [
      { rawName: "Matcha", amount: 4 },
      { rawName: "Susu UHT", amount: 60 },
      { rawName: "Rich Milk", amount: 50 },
      { rawName: "Creamer", amount: 25 },
      { rawName: "Air", amount: 90 },
      { rawName: "Gula Pasir", amount: 25 },
      { rawName: "Botol 250 ML", amount: 1 },
      { rawName: "Stiker 250 ML", amount: 1 },
    ],
  },
  {
    name: "Caffe Latte 250ml",
    categoryName: "Botol 250ml",
    price: 15000,
    cost: 6745.82,
    unit: "botol",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 60 },
      { rawName: "Rich Milk", amount: 50 },
      { rawName: "Creamer", amount: 25 },
      { rawName: "Air", amount: 115 },
      { rawName: "Botol 250 ML", amount: 1 },
      { rawName: "Stiker 250 ML", amount: 1 },
    ],
  },

  // ==============================
  // C. BOTOL 1000 ML (1L) (6 Menu)
  // ==============================
  {
    name: "Aren Coffee Milk 1000ml",
    categoryName: "Botol 1000ml (1L)",
    price: 55000,
    cost: 26092.48,
    unit: "botol",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 40 },
      { rawName: "Susu UHT", amount: 240 },
      { rawName: "Rich Milk", amount: 200 },
      { rawName: "Creamer", amount: 100 },
      { rawName: "Air", amount: 460 },
      { rawName: "Gula Aren", amount: 80 },
      { rawName: "Botol 1000 ML", amount: 1 },
      { rawName: "Stiker 1000 ML", amount: 1 },
    ],
  },
  {
    name: "Hazelnut Coffee Milk 1000ml",
    categoryName: "Botol 1000ml (1L)",
    price: 55000,
    cost: 34178.64,
    unit: "botol",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 40 },
      { rawName: "Susu UHT", amount: 240 },
      { rawName: "Rich Milk", amount: 200 },
      { rawName: "Creamer", amount: 100 },
      { rawName: "Air", amount: 460 },
      { rawName: "Syrup Hazelnut", amount: 80 },
      { rawName: "Botol 1000 ML", amount: 1 },
      { rawName: "Stiker 1000 ML", amount: 1 },
    ],
  },
  {
    name: "Choco Blend Coffee 1000ml",
    categoryName: "Botol 1000ml (1L)",
    price: 55000,
    cost: 34572.48,
    unit: "botol",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 40 },
      { rawName: "Susu UHT", amount: 240 },
      { rawName: "Rich Milk", amount: 200 },
      { rawName: "Creamer", amount: 100 },
      { rawName: "Air", amount: 460 },
      { rawName: "Syrup Cokelat", amount: 80 },
      { rawName: "Botol 1000 ML", amount: 1 },
      { rawName: "Stiker 1000 ML", amount: 1 },
    ],
  },
  {
    name: "Dua Carita Signature 1000ml",
    categoryName: "Botol 1000ml (1L)",
    price: 47000,
    cost: 25732.48,
    unit: "botol",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 40 },
      { rawName: "Susu UHT", amount: 240 },
      { rawName: "Rich Milk", amount: 200 },
      { rawName: "Creamer", amount: 100 },
      { rawName: "Air", amount: 460 },
      { rawName: "Gula Pasir", amount: 80 },
      { rawName: "Botol 1000 ML", amount: 1 },
      { rawName: "Stiker 1000 ML", amount: 1 },
    ],
  },
  {
    name: "Matcha Latte 1000ml",
    categoryName: "Botol 1000ml (1L)",
    price: 55000,
    cost: 32972.48,
    unit: "botol",
    ingredients: [
      { rawName: "Matcha", amount: 16 },
      { rawName: "Susu UHT", amount: 240 },
      { rawName: "Rich Milk", amount: 200 },
      { rawName: "Creamer", amount: 100 },
      { rawName: "Air", amount: 460 },
      { rawName: "Gula Pasir", amount: 80 },
      { rawName: "Botol 1000 ML", amount: 1 },
      { rawName: "Stiker 1000 ML", amount: 1 },
    ],
  },
  {
    name: "Caffe Latte 1000ml",
    categoryName: "Botol 1000ml (1L)",
    price: 55000,
    cost: 24332.48,
    unit: "botol",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 40 },
      { rawName: "Susu UHT", amount: 240 },
      { rawName: "Rich Milk", amount: 200 },
      { rawName: "Creamer", amount: 100 },
      { rawName: "Air", amount: 460 },
      { rawName: "Botol 1000 ML", amount: 1 },
      { rawName: "Stiker 1000 ML", amount: 1 },
    ],
  },
];

async function main() {
  console.log("=== 1. UPSERT BAHAN KEMASAN (PACKAGING) ===");
  for (const pkg of packagingMaterials) {
    let existing = await prisma.rawMaterial.findFirst({
      where: { name: pkg.name },
    });

    if (existing) {
      console.log(`Updating packaging: ${pkg.name}`);
      await prisma.rawMaterial.update({
        where: { id: existing.id },
        data: {
          category: pkg.category,
          unit: pkg.unit,
          costPerUnit: pkg.costPerUnit,
          minStock: pkg.minStock,
        },
      });
    } else {
      console.log(`Creating packaging: ${pkg.name}`);
      const created = await prisma.rawMaterial.create({
        data: {
          name: pkg.name,
          category: pkg.category,
          unit: pkg.unit,
          costPerUnit: pkg.costPerUnit,
          stock: pkg.stock,
          minStock: pkg.minStock,
        },
      });

      await prisma.rawMaterialLog.create({
        data: {
          rawMaterialId: created.id,
          changeQty: pkg.stock,
          type: "restock",
          notes: "Stok awal kemasan",
        },
      });
    }
  }

  console.log("=== 2. AMBIL SEMUA RAW MATERIALS & CATEGORIES ===");
  const allRaws = await prisma.rawMaterial.findMany();
  const rawMap = new Map<string, string>(allRaws.map((r) => [r.name, r.id]));

  const allCats = await prisma.category.findMany();
  const catMap = new Map<string, string>(allCats.map((c) => [c.name, c.id]));

  console.log("=== 3. UPDATE HARGA JUAL & TOTAL HPP MENU LENGKAP ===");
  for (const item of fullProductsData) {
    const categoryId = catMap.get(item.categoryName);
    if (!categoryId) {
      console.warn(`Category not found for: ${item.categoryName}`);
      continue;
    }

    let prod = await prisma.product.findFirst({
      where: { name: item.name },
    });

    if (prod) {
      console.log(`Updating ${item.name}: Price Rp ${item.price}, HPP Rp ${item.cost}`);
      prod = await prisma.product.update({
        where: { id: prod.id },
        data: {
          price: item.price,
          cost: item.cost,
          categoryId,
          unit: item.unit,
        },
      });
    } else {
      console.log(`Creating ${item.name}: Price Rp ${item.price}, HPP Rp ${item.cost}`);
      prod = await prisma.product.create({
        data: {
          name: item.name,
          price: item.price,
          cost: item.cost,
          categoryId,
          unit: item.unit,
          stock: 50,
          isActive: true,
        },
      });
    }

    // Update ingredients including packaging
    await prisma.productIngredient.deleteMany({
      where: { productId: prod.id },
    });

    for (const ing of item.ingredients) {
      const rawId = rawMap.get(ing.rawName);
      if (!rawId) {
        console.warn(`Raw material "${ing.rawName}" not found!`);
        continue;
      }

      await prisma.productIngredient.create({
        data: {
          productId: prod.id,
          rawMaterialId: rawId,
          amount: ing.amount,
        },
      });
    }
  }

  console.log("=== UPDATE SELESAI DENGAN SUKSES! ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
