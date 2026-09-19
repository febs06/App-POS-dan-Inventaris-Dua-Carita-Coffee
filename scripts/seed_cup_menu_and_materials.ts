import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rawMaterialsData = [
  {
    name: "Kopi Robusta",
    supplier: "Javanica",
    category: "Kopi",
    stock: 1000, // 1 Kg
    unit: "gram",
    minStock: 200,
    costPerUnit: 159.0,
  },
  {
    name: "Susu UHT",
    supplier: "Diamond",
    category: "Dairy/Susu",
    stock: 1000, // 1 L
    unit: "ml",
    minStock: 500,
    costPerUnit: 19.5,
  },
  {
    name: "Rich Milk",
    supplier: "Diamond",
    category: "Dairy/Susu",
    stock: 1000, // 1 L
    unit: "ml",
    minStock: 500,
    costPerUnit: 22.5,
  },
  {
    name: "Creamer",
    supplier: "Santos",
    category: "Creamer",
    stock: 1000, // 1 Kg
    unit: "gram",
    minStock: 200,
    costPerUnit: 48.0,
  },
  {
    name: "Gula Aren",
    supplier: "-",
    category: "Sweatener/Gula",
    stock: 1000, // 1 Kg
    unit: "gram",
    minStock: 200,
    costPerUnit: 22.0,
  },
  {
    name: "Gula Pasir",
    supplier: "GulaKu",
    category: "Sweatener/Gula",
    stock: 1000, // 1 Kg
    unit: "gram",
    minStock: 200,
    costPerUnit: 17.5,
  },
  {
    name: "Syrup Hazelnut",
    supplier: "Trieste",
    category: "Syrup/Flavor",
    stock: 650, // 650 ml
    unit: "ml",
    minStock: 100,
    costPerUnit: 123.08,
  },
  {
    name: "Syrup Cokelat",
    supplier: "Denali",
    category: "Syrup/Flavor",
    stock: 750, // 750 ml
    unit: "ml",
    minStock: 100,
    costPerUnit: 128.0,
  },
  {
    name: "Matcha",
    supplier: "Lets Brew",
    category: "Powder",
    stock: 100, // 100 gr
    unit: "gram",
    minStock: 20,
    costPerUnit: 850.0,
  },
  {
    name: "Air",
    supplier: "-",
    category: "Air",
    stock: 19000, // 19 L
    unit: "ml",
    minStock: 2000,
    costPerUnit: 0.26,
  },
];

const menuData = [
  {
    name: "Aren Coffee Milk",
    categoryName: "Kopi & Minuman Segar",
    price: 22000,
    cost: 4356.18,
    stock: 50,
    unit: "cup",
    imageUrl:
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 40 },
      { rawName: "Rich Milk", amount: 25 },
      { rawName: "Creamer", amount: 20 },
      { rawName: "Air", amount: 90 },
      { rawName: "Gula Aren", amount: 20 },
    ],
  },
  {
    name: "Hazelnut Coffee Milk",
    categoryName: "Kopi & Minuman Segar",
    price: 25000,
    cost: 6377.72,
    stock: 50,
    unit: "cup",
    imageUrl:
      "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 40 },
      { rawName: "Rich Milk", amount: 25 },
      { rawName: "Creamer", amount: 20 },
      { rawName: "Air", amount: 90 },
      { rawName: "Syrup Hazelnut", amount: 20 },
    ],
  },
  {
    name: "Choco Blend Coffee",
    categoryName: "Kopi & Minuman Segar",
    price: 25000,
    cost: 6476.18,
    stock: 50,
    unit: "cup",
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 40 },
      { rawName: "Rich Milk", amount: 25 },
      { rawName: "Creamer", amount: 20 },
      { rawName: "Air", amount: 90 },
      { rawName: "Syrup Cokelat", amount: 20 },
    ],
  },
  {
    name: "Dua Carita Signature",
    categoryName: "Kopi & Minuman Segar",
    price: 22000,
    cost: 4266.18,
    stock: 50,
    unit: "cup",
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Kopi Robusta", amount: 10 },
      { rawName: "Susu UHT", amount: 40 },
      { rawName: "Rich Milk", amount: 25 },
      { rawName: "Creamer", amount: 20 },
      { rawName: "Air", amount: 90 },
      { rawName: "Gula Pasir", amount: 20 },
    ],
  },
  {
    name: "Matcha Latte",
    categoryName: "Teh & Artisan Latte",
    price: 27000,
    cost: 6158.42,
    stock: 50,
    unit: "cup",
    imageUrl:
      "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60",
    ingredients: [
      { rawName: "Matcha", amount: 4 },
      { rawName: "Susu UHT", amount: 40 },
      { rawName: "Rich Milk", amount: 25 },
      { rawName: "Creamer", amount: 20 },
      { rawName: "Air", amount: 70 },
      { rawName: "Gula Pasir", amount: 25 },
    ],
  },
];

async function main() {
  console.log("=== 1. UPSERT MASTER BAHAN BAKU ===");
  const materialMap = new Map<string, string>(); // name -> id

  for (const raw of rawMaterialsData) {
    let existing = await prisma.rawMaterial.findFirst({
      where: { name: raw.name },
    });

    if (existing) {
      console.log(`Updating raw material: ${raw.name}`);
      existing = await prisma.rawMaterial.update({
        where: { id: existing.id },
        data: {
          supplier: raw.supplier,
          category: raw.category,
          unit: raw.unit,
          minStock: raw.minStock,
          costPerUnit: raw.costPerUnit,
          // jika stok 0, isi dengan default stock
          stock: existing.stock > 0 ? existing.stock : raw.stock,
        },
      });
    } else {
      console.log(`Creating raw material: ${raw.name}`);
      existing = await prisma.rawMaterial.create({
        data: {
          name: raw.name,
          supplier: raw.supplier,
          category: raw.category,
          unit: raw.unit,
          minStock: raw.minStock,
          costPerUnit: raw.costPerUnit,
          stock: raw.stock,
        },
      });

      await prisma.rawMaterialLog.create({
        data: {
          rawMaterialId: existing.id,
          changeQty: raw.stock,
          type: "restock",
          notes: "Stok awal master bahan baku",
        },
      });
    }

    materialMap.set(raw.name, existing.id);
  }

  console.log("=== 2. PASTIKAN KATEGORI TERSEDIA ===");
  const categories = await prisma.category.findMany();
  const categoryMap = new Map<string, string>(
    categories.map((c) => [c.name, c.id])
  );

  // Fallback category if not found
  let defaultKopiCatId = categoryMap.get("Kopi & Minuman Segar");
  if (!defaultKopiCatId) {
    const newCat = await prisma.category.create({
      data: {
        name: "Kopi & Minuman Segar",
        description: "Aneka racikan kopi espresso dan mocktail menyegarkan",
      },
    });
    defaultKopiCatId = newCat.id;
    categoryMap.set(newCat.name, newCat.id);
  }

  let defaultTehCatId = categoryMap.get("Teh & Artisan Latte");
  if (!defaultTehCatId) {
    const newCat = await prisma.category.create({
      data: {
        name: "Teh & Artisan Latte",
        description: "Matcha premium, teh buah, dan susu rempah",
      },
    });
    defaultTehCatId = newCat.id;
    categoryMap.set(newCat.name, newCat.id);
  }

  console.log("=== 3. UPSERT PRODUK MENU CUP & RESEP (BOM) ===");

  // Check if legacy "Aren Latte" exists, rename to "Aren Coffee Milk"
  const legacyAren = await prisma.product.findFirst({
    where: { name: "Aren Latte" },
  });
  if (legacyAren) {
    console.log("Migrating 'Aren Latte' -> 'Aren Coffee Milk'...");
    await prisma.product.update({
      where: { id: legacyAren.id },
      data: {
        name: "Aren Coffee Milk",
        cost: 4356.18,
        price: 22000,
        unit: "cup",
      },
    });
  }

  for (const menu of menuData) {
    const categoryId =
      categoryMap.get(menu.categoryName) || defaultKopiCatId!;

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
          // update image if empty
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

    // Update ingredients (resep)
    console.log(`Setting recipes for ${menu.name}...`);
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

  console.log("=== SEEDING BERHASIL! ===");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
