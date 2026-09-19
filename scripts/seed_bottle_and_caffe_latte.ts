import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const additionalMenuData = [
  // 1. CUP 12 OZ
  {
    name: "Caffe Latte",
    categoryName: "Kopi & Minuman Segar",
    price: 22000,
    cost: 3916.18,
    stock: 50,
    unit: "cup",
    imageUrl:
      "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 40 },
      { rawName: "Rich Milk", amount: 25 },
      { rawName: "Creamer", amount: 20 },
      { rawName: "Air", amount: 90 },
    ],
  },

  // 2. BOTOL 250ML
  {
    name: "Aren Coffee Milk 250ml",
    categoryName: "Botol 250ml",
    price: 25000,
    cost: 5555.26,
    stock: 30,
    unit: "botol",
    imageUrl:
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 60 },
      { rawName: "Rich Milk", amount: 50 },
      { rawName: "Creamer", amount: 25 },
      { rawName: "Air", amount: 115 },
      { rawName: "Gula Aren", amount: 20 },
    ],
  },
  {
    name: "Hazelnut Coffee Milk 250ml",
    categoryName: "Botol 250ml",
    price: 28000,
    cost: 7576.8,
    stock: 30,
    unit: "botol",
    imageUrl:
      "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 60 },
      { rawName: "Rich Milk", amount: 50 },
      { rawName: "Creamer", amount: 25 },
      { rawName: "Air", amount: 115 },
      { rawName: "Syrup Hazelnut", amount: 20 },
    ],
  },
  {
    name: "Choco Blend Coffee 250ml",
    categoryName: "Botol 250ml",
    price: 28000,
    cost: 7675.26,
    stock: 30,
    unit: "botol",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 60 },
      { rawName: "Rich Milk", amount: 50 },
      { rawName: "Creamer", amount: 25 },
      { rawName: "Air", amount: 115 },
      { rawName: "Syrup Cokelat", amount: 20 },
    ],
  },
  {
    name: "Dua Carita Signature 250ml",
    categoryName: "Botol 250ml",
    price: 25000,
    cost: 5465.26,
    stock: 30,
    unit: "botol",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 60 },
      { rawName: "Rich Milk", amount: 50 },
      { rawName: "Creamer", amount: 25 },
      { rawName: "Air", amount: 115 },
      { rawName: "Gula Pasir", amount: 20 },
    ],
  },
  {
    name: "Matcha Latte 250ml",
    categoryName: "Botol 250ml",
    price: 30000,
    cost: 7356.18,
    stock: 30,
    unit: "botol",
    imageUrl:
      "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Matcha", amount: 4 },
      { rawName: "Susu UHT", amount: 60 },
      { rawName: "Rich Milk", amount: 50 },
      { rawName: "Creamer", amount: 25 },
      { rawName: "Air", amount: 90 },
      { rawName: "Gula Pasir", amount: 25 },
    ],
  },
  {
    name: "Caffe Latte 250ml",
    categoryName: "Botol 250ml",
    price: 25000,
    cost: 5115.26,
    stock: 30,
    unit: "botol",
    imageUrl:
      "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 60 },
      { rawName: "Rich Milk", amount: 50 },
      { rawName: "Creamer", amount: 25 },
      { rawName: "Air", amount: 115 },
    ],
  },

  // 3. BOTOL 1000ML (1 LITER)
  {
    name: "Aren Coffee Milk 1000ml",
    categoryName: "Botol 1000ml (1L)",
    price: 85000,
    cost: 22221.05,
    stock: 15,
    unit: "botol",
    imageUrl:
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 40 },
      { rawName: "Susu UHT", amount: 240 },
      { rawName: "Rich Milk", amount: 200 },
      { rawName: "Creamer", amount: 100 },
      { rawName: "Air", amount: 460 },
      { rawName: "Gula Aren", amount: 80 },
    ],
  },
  {
    name: "Hazelnut Coffee Milk 1000ml",
    categoryName: "Botol 1000ml (1L)",
    price: 110000,
    cost: 30307.21,
    stock: 15,
    unit: "botol",
    imageUrl:
      "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 40 },
      { rawName: "Susu UHT", amount: 240 },
      { rawName: "Rich Milk", amount: 200 },
      { rawName: "Creamer", amount: 100 },
      { rawName: "Air", amount: 460 },
      { rawName: "Syrup Hazelnut", amount: 80 },
    ],
  },
  {
    name: "Choco Blend Coffee 1000ml",
    categoryName: "Botol 1000ml (1L)",
    price: 110000,
    cost: 30701.05,
    stock: 15,
    unit: "botol",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 40 },
      { rawName: "Susu UHT", amount: 240 },
      { rawName: "Rich Milk", amount: 200 },
      { rawName: "Creamer", amount: 100 },
      { rawName: "Air", amount: 460 },
      { rawName: "Syrup Cokelat", amount: 80 },
    ],
  },
  {
    name: "Dua Carita Signature 1000ml",
    categoryName: "Botol 1000ml (1L)",
    price: 85000,
    cost: 21861.05,
    stock: 15,
    unit: "botol",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 40 },
      { rawName: "Susu UHT", amount: 240 },
      { rawName: "Rich Milk", amount: 200 },
      { rawName: "Creamer", amount: 100 },
      { rawName: "Air", amount: 460 },
      { rawName: "Gula Pasir", amount: 80 },
    ],
  },
  {
    name: "Matcha Latte 1000ml",
    categoryName: "Botol 1000ml (1L)",
    price: 115000,
    cost: 29101.05,
    stock: 15,
    unit: "botol",
    imageUrl:
      "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Matcha", amount: 16 },
      { rawName: "Susu UHT", amount: 240 },
      { rawName: "Rich Milk", amount: 200 },
      { rawName: "Creamer", amount: 100 },
      { rawName: "Air", amount: 460 },
      { rawName: "Gula Pasir", amount: 80 },
    ],
  },
  {
    name: "Caffe Latte 1000ml",
    categoryName: "Botol 1000ml (1L)",
    price: 85000,
    cost: 20461.05,
    stock: 15,
    unit: "botol",
    imageUrl:
      "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 40 },
      { rawName: "Susu UHT", amount: 240 },
      { rawName: "Rich Milk", amount: 200 },
      { rawName: "Creamer", amount: 100 },
      { rawName: "Air", amount: 460 },
    ],
  },
];

async function main() {
  console.log("=== AMBIL BAHAN BAKU ===");
  const materials = await prisma.rawMaterial.findMany();
  const materialMap = new Map<string, string>(
    materials.map((m) => [m.name, m.id])
  );

  console.log("=== PASTIKAN KATEGORI BOTOL TERSEDIA ===");
  const catNames = ["Botol 250ml", "Botol 1000ml (1L)", "Kopi & Minuman Segar"];
  const categoryMap = new Map<string, string>();

  for (const name of catNames) {
    let cat = await prisma.category.findUnique({ where: { name } });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          name,
          description: `Kategori menu ${name}`,
        },
      });
    }
    categoryMap.set(name, cat.id);
  }

  // Juga ambil kategori lainnya
  const allCats = await prisma.category.findMany();
  for (const c of allCats) {
    categoryMap.set(c.name, c.id);
  }

  console.log("=== UPSERT MENU & RESEP ===");
  for (const menu of additionalMenuData) {
    const categoryId = categoryMap.get(menu.categoryName)!;

    let product = await prisma.product.findFirst({
      where: { name: menu.name },
    });

    if (product) {
      console.log(`Updating product: ${menu.name}`);
      product = await prisma.product.update({
        where: { id: product.id },
        data: {
          categoryId,
          price: menu.price,
          cost: menu.cost,
          unit: menu.unit,
          isActive: true,
          imageUrl: product.imageUrl || menu.imageUrl,
        },
      });
    } else {
      console.log(`Creating product: ${menu.name}`);
      product = await prisma.product.create({
        data: {
          name: menu.name,
          categoryId,
          price: menu.price,
          cost: menu.cost,
          stock: menu.stock,
          unit: menu.unit,
          imageUrl: menu.imageUrl,
          isActive: true,
        },
      });

      await prisma.stockLog.create({
        data: {
          productId: product.id,
          changeQty: menu.stock,
          reason: "restock",
        },
      });
    }

    // Set ProductIngredient (resep)
    await prisma.productIngredient.deleteMany({
      where: { productId: product.id },
    });

    for (const ing of menu.ingredients) {
      const rawId = materialMap.get(ing.rawName);
      if (!rawId) {
        console.warn(`Warning: Raw material "${ing.rawName}" not found!`);
        continue;
      }

      await prisma.productIngredient.create({
        data: {
          productId: product.id,
          rawMaterialId: rawId,
          amount: ing.amount,
        },
      });
    }
  }

  console.log("=== BERHASIL MENDAFTARKAN SEMUA RESEP BOTOL & CAFFE LATTE! ===");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
