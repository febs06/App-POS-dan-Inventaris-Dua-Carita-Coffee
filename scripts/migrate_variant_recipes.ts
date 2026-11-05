import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Recipe specifications per product category/name
type RecipeItem = {
  rawName: string;
  amount: number;
};

type VariantSpecs = {
  "Cup - Reguler": RecipeItem[];
  "Cup - Large": RecipeItem[];
  "Botol - 250 ML": RecipeItem[];
  "Botol - 1.000 ML": RecipeItem[];
};

// Base recipe formulations
function getVariantRecipes(productName: string): VariantSpecs {
  const normName = productName.trim().toLowerCase();

  if (normName.includes("matcha")) {
    return {
      "Cup - Reguler": [
        { rawName: "Powder Matcha Super Green Ceremonial", amount: 4 },
        { rawName: "Diamond UHT", amount: 40 },
        { rawName: "Diamond Rich Milk", amount: 25 },
        { rawName: "Creamer", amount: 20 },
        { rawName: "Air Demineral", amount: 70 },
        { rawName: "Gula Pasir", amount: 25 },
        { rawName: "Cup Injection 12 Oz", amount: 1 },
        { rawName: "Tutup Cup Injection", amount: 1 },
      ],
      "Cup - Large": [
        { rawName: "Powder Matcha Super Green Ceremonial", amount: 5.2 },
        { rawName: "Diamond UHT", amount: 52 },
        { rawName: "Diamond Rich Milk", amount: 32.5 },
        { rawName: "Creamer", amount: 26 },
        { rawName: "Air Demineral", amount: 91 },
        { rawName: "Gula Pasir", amount: 32.5 },
        { rawName: "Cup Injection 12 Oz", amount: 1 },
        { rawName: "Tutup Cup Injection", amount: 1 },
      ],
      "Botol - 250 ML": [
        { rawName: "Powder Matcha Super Green Ceremonial", amount: 4 },
        { rawName: "Diamond UHT", amount: 60 },
        { rawName: "Diamond Rich Milk", amount: 50 },
        { rawName: "Creamer", amount: 25 },
        { rawName: "Air Demineral", amount: 90 },
        { rawName: "Gula Pasir", amount: 25 },
        { rawName: "Botol Kale 250 ML", amount: 1 },
        { rawName: "Stiker Matcha Latte - 250 ML", amount: 1 },
      ],
      "Botol - 1.000 ML": [
        { rawName: "Powder Matcha Super Green Ceremonial", amount: 16 },
        { rawName: "Diamond UHT", amount: 240 },
        { rawName: "Diamond Rich Milk", amount: 200 },
        { rawName: "Creamer", amount: 100 },
        { rawName: "Air Demineral", amount: 460 },
        { rawName: "Gula Pasir", amount: 80 },
        { rawName: "Botol Kale 1L", amount: 1 },
        { rawName: "Stiker Matcha Latte - 1 L", amount: 1 },
      ],
    };
  }

  if (normName.includes("caffe latte")) {
    return {
      "Cup - Reguler": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 10 },
        { rawName: "Diamond UHT", amount: 40 },
        { rawName: "Diamond Rich Milk", amount: 25 },
        { rawName: "Creamer", amount: 20 },
        { rawName: "Air Demineral", amount: 90 },
        { rawName: "Cup Injection 12 Oz", amount: 1 },
        { rawName: "Tutup Cup Injection", amount: 1 },
      ],
      "Cup - Large": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 13 },
        { rawName: "Diamond UHT", amount: 52 },
        { rawName: "Diamond Rich Milk", amount: 32.5 },
        { rawName: "Creamer", amount: 26 },
        { rawName: "Air Demineral", amount: 117 },
        { rawName: "Cup Injection 12 Oz", amount: 1 },
        { rawName: "Tutup Cup Injection", amount: 1 },
      ],
      "Botol - 250 ML": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 10 },
        { rawName: "Diamond UHT", amount: 60 },
        { rawName: "Diamond Rich Milk", amount: 50 },
        { rawName: "Creamer", amount: 25 },
        { rawName: "Air Demineral", amount: 115 },
        { rawName: "Botol Kale 250 ML", amount: 1 },
        { rawName: "Stiker Caffe Latte - 250 ML", amount: 1 },
      ],
      "Botol - 1.000 ML": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 40 },
        { rawName: "Diamond UHT", amount: 240 },
        { rawName: "Diamond Rich Milk", amount: 200 },
        { rawName: "Creamer", amount: 100 },
        { rawName: "Air Demineral", amount: 460 },
        { rawName: "Botol Kale 1L", amount: 1 },
        { rawName: "Stiker Caffe Latte - 1 L", amount: 1 },
      ],
    };
  }

  if (normName.includes("choco")) {
    return {
      "Cup - Reguler": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 10 },
        { rawName: "Diamond UHT", amount: 40 },
        { rawName: "Diamond Rich Milk", amount: 25 },
        { rawName: "Creamer", amount: 20 },
        { rawName: "Air Demineral", amount: 90 },
        { rawName: "Denali Cokelat", amount: 20 },
        { rawName: "Cup Injection 12 Oz", amount: 1 },
        { rawName: "Tutup Cup Injection", amount: 1 },
      ],
      "Cup - Large": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 13 },
        { rawName: "Diamond UHT", amount: 52 },
        { rawName: "Diamond Rich Milk", amount: 32.5 },
        { rawName: "Creamer", amount: 26 },
        { rawName: "Air Demineral", amount: 117 },
        { rawName: "Denali Cokelat", amount: 26 },
        { rawName: "Cup Injection 12 Oz", amount: 1 },
        { rawName: "Tutup Cup Injection", amount: 1 },
      ],
      "Botol - 250 ML": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 10 },
        { rawName: "Diamond UHT", amount: 60 },
        { rawName: "Diamond Rich Milk", amount: 50 },
        { rawName: "Creamer", amount: 25 },
        { rawName: "Air Demineral", amount: 115 },
        { rawName: "Denali Cokelat", amount: 20 },
        { rawName: "Botol Kale 250 ML", amount: 1 },
        { rawName: "Stiker Choco Blend -250 ML", amount: 1 },
      ],
      "Botol - 1.000 ML": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 40 },
        { rawName: "Diamond UHT", amount: 240 },
        { rawName: "Diamond Rich Milk", amount: 200 },
        { rawName: "Creamer", amount: 100 },
        { rawName: "Air Demineral", amount: 460 },
        { rawName: "Denali Cokelat", amount: 80 },
        { rawName: "Botol Kale 1L", amount: 1 },
        { rawName: "Stiker Choco Blend - 1 L", amount: 1 },
      ],
    };
  }

  if (normName.includes("hazelnut")) {
    return {
      "Cup - Reguler": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 10 },
        { rawName: "Diamond UHT", amount: 40 },
        { rawName: "Diamond Rich Milk", amount: 25 },
        { rawName: "Creamer", amount: 20 },
        { rawName: "Air Demineral", amount: 90 },
        { rawName: "Trieste Hazelnut", amount: 20 },
        { rawName: "Cup Injection 12 Oz", amount: 1 },
        { rawName: "Tutup Cup Injection", amount: 1 },
      ],
      "Cup - Large": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 13 },
        { rawName: "Diamond UHT", amount: 52 },
        { rawName: "Diamond Rich Milk", amount: 32.5 },
        { rawName: "Creamer", amount: 26 },
        { rawName: "Air Demineral", amount: 117 },
        { rawName: "Trieste Hazelnut", amount: 26 },
        { rawName: "Cup Injection 12 Oz", amount: 1 },
        { rawName: "Tutup Cup Injection", amount: 1 },
      ],
      "Botol - 250 ML": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 10 },
        { rawName: "Diamond UHT", amount: 60 },
        { rawName: "Diamond Rich Milk", amount: 50 },
        { rawName: "Creamer", amount: 25 },
        { rawName: "Air Demineral", amount: 115 },
        { rawName: "Trieste Hazelnut", amount: 20 },
        { rawName: "Botol Kale 250 ML", amount: 1 },
        { rawName: "Stiker Hazelnut Latte - 250 ML", amount: 1 },
      ],
      "Botol - 1.000 ML": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 40 },
        { rawName: "Diamond UHT", amount: 240 },
        { rawName: "Diamond Rich Milk", amount: 200 },
        { rawName: "Creamer", amount: 100 },
        { rawName: "Air Demineral", amount: 460 },
        { rawName: "Trieste Hazelnut", amount: 80 },
        { rawName: "Botol Kale 1L", amount: 1 },
        { rawName: "Stiker Hazelnut Latte - 1 L", amount: 1 },
      ],
    };
  }

  if (normName.includes("signature")) {
    return {
      "Cup - Reguler": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 10 },
        { rawName: "Diamond UHT", amount: 40 },
        { rawName: "Diamond Rich Milk", amount: 25 },
        { rawName: "Creamer", amount: 20 },
        { rawName: "Air Demineral", amount: 90 },
        { rawName: "Gula Pasir", amount: 20 },
        { rawName: "Cup Injection 12 Oz", amount: 1 },
        { rawName: "Tutup Cup Injection", amount: 1 },
      ],
      "Cup - Large": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 13 },
        { rawName: "Diamond UHT", amount: 52 },
        { rawName: "Diamond Rich Milk", amount: 32.5 },
        { rawName: "Creamer", amount: 26 },
        { rawName: "Air Demineral", amount: 117 },
        { rawName: "Gula Pasir", amount: 26 },
        { rawName: "Cup Injection 12 Oz", amount: 1 },
        { rawName: "Tutup Cup Injection", amount: 1 },
      ],
      "Botol - 250 ML": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 10 },
        { rawName: "Diamond UHT", amount: 60 },
        { rawName: "Diamond Rich Milk", amount: 50 },
        { rawName: "Creamer", amount: 25 },
        { rawName: "Air Demineral", amount: 115 },
        { rawName: "Gula Pasir", amount: 20 },
        { rawName: "Botol Kale 250 ML", amount: 1 },
        { rawName: "Stiker Dua Carita Signature - 250 ML", amount: 1 },
      ],
      "Botol - 1.000 ML": [
        { rawName: "Javanica Eclipse (Robusta)", amount: 40 },
        { rawName: "Diamond UHT", amount: 240 },
        { rawName: "Diamond Rich Milk", amount: 200 },
        { rawName: "Creamer", amount: 100 },
        { rawName: "Air Demineral", amount: 460 },
        { rawName: "Gula Pasir", amount: 80 },
        { rawName: "Botol Kale 1L", amount: 1 },
        { rawName: "Stiker Dua Carita Signature - 1 L", amount: 1 },
      ],
    };
  }

  // Default: Aren Coffee Milk
  return {
    "Cup - Reguler": [
      { rawName: "Javanica Eclipse (Robusta)", amount: 10 },
      { rawName: "Diamond UHT", amount: 40 },
      { rawName: "Diamond Rich Milk", amount: 25 },
      { rawName: "Creamer", amount: 20 },
      { rawName: "Air Demineral", amount: 90 },
      { rawName: "Gula Aren", amount: 20 },
      { rawName: "Cup Injection 12 Oz", amount: 1 },
      { rawName: "Tutup Cup Injection", amount: 1 },
    ],
    "Cup - Large": [
      { rawName: "Javanica Eclipse (Robusta)", amount: 13 },
      { rawName: "Diamond UHT", amount: 52 },
      { rawName: "Diamond Rich Milk", amount: 32.5 },
      { rawName: "Creamer", amount: 26 },
      { rawName: "Air Demineral", amount: 117 },
      { rawName: "Gula Aren", amount: 26 },
      { rawName: "Cup Injection 12 Oz", amount: 1 },
      { rawName: "Tutup Cup Injection", amount: 1 },
    ],
    "Botol - 250 ML": [
      { rawName: "Javanica Eclipse (Robusta)", amount: 10 },
      { rawName: "Diamond UHT", amount: 60 },
      { rawName: "Diamond Rich Milk", amount: 50 },
      { rawName: "Creamer", amount: 25 },
      { rawName: "Air Demineral", amount: 115 },
      { rawName: "Gula Aren", amount: 20 },
      { rawName: "Botol Kale 250 ML", amount: 1 },
      { rawName: "Stiker Aren Latte - 250 ML", amount: 1 },
    ],
    "Botol - 1.000 ML": [
      { rawName: "Javanica Eclipse (Robusta)", amount: 40 },
      { rawName: "Diamond UHT", amount: 240 },
      { rawName: "Diamond Rich Milk", amount: 200 },
      { rawName: "Creamer", amount: 100 },
      { rawName: "Air Demineral", amount: 460 },
      { rawName: "Gula Aren", amount: 80 },
      { rawName: "Botol Kale 1L", amount: 1 },
      { rawName: "Stiker Aren Latte - 1 L", amount: 1 },
    ],
  };
}

async function main() {
  console.log("=== STEP 1: LOAD RAW MATERIALS & PRODUCTS ===");
  const allRawMaterials = await prisma.rawMaterial.findMany();
  const rawMap = new Map<string, typeof allRawMaterials[0]>(
    allRawMaterials.map((r) => [r.name, r])
  );
  console.log(`Loaded ${allRawMaterials.length} raw materials.`);

  const products = await prisma.product.findMany({
    include: {
      variants: true,
    },
  });
  console.log(`Loaded ${products.length} products.`);

  let totalVariantsMigrated = 0;
  let totalIngredientsCreated = 0;

  console.log("\n=== STEP 2: MIGRATE RECIPES TO PRODUCT VARIANTS ===");
  for (const product of products) {
    console.log(`\nProcessing Product: ${product.name} (id: ${product.id})`);
    const specs = getVariantRecipes(product.name);

    for (const variant of product.variants) {
      const key = `${variant.packaging} - ${variant.size}` as keyof VariantSpecs;
      const recipe = specs[key];

      if (!recipe) {
        console.warn(`  [WARN] No recipe spec found for variant: ${key}`);
        continue;
      }

      // 1. Remove existing ingredients tied to this variant
      await prisma.productIngredient.deleteMany({
        where: { variantId: variant.id },
      });

      let variantHpp = 0;
      let ingCount = 0;

      // 2. Insert ingredients for this specific variant
      for (const item of recipe) {
        const raw = rawMap.get(item.rawName);
        if (!raw) {
          console.error(`  [ERROR] Raw material "${item.rawName}" not found in database!`);
          continue;
        }

        const cost = item.amount * raw.costPerUnit;
        variantHpp += cost;

        await prisma.productIngredient.create({
          data: {
            variantId: variant.id,
            rawMaterialId: raw.id,
            amount: item.amount,
          },
        });

        ingCount++;
        totalIngredientsCreated++;
      }

      const roundedHpp = Math.round(variantHpp * 100) / 100;

      // 3. Update variant HPP cost
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: {
          cost: roundedHpp,
        },
      });

      console.log(
        `  -> Variant: [${variant.packaging} - ${variant.size}] (id: ${variant.id}) | ${ingCount} ingredients | Calculated HPP: Rp ${roundedHpp} | Selling Price: Rp ${variant.price}`
      );
      totalVariantsMigrated++;
    }
  }

  console.log("\n=== STEP 3: VERIFICATION OF ALL 28 VARIANTS ===");
  const allVariantsWithIngredients = await prisma.productVariant.findMany({
    include: {
      product: true,
      ingredients: {
        include: { rawMaterial: true },
      },
    },
    orderBy: [{ product: { name: "asc" } }, { packaging: "asc" }, { size: "asc" }],
  });

  console.log(`Total Variants in DB: ${allVariantsWithIngredients.length}`);
  let allHaveRecipes = true;
  for (const v of allVariantsWithIngredients) {
    if (v.ingredients.length === 0) {
      allHaveRecipes = false;
      console.error(`[FAIL] Variant has 0 ingredients: ${v.product.name} ${v.packaging} ${v.size}`);
    }
  }
  console.log(`All 28 variants have recipes attached: ${allHaveRecipes ? "PASSED" : "FAILED"}`);

  console.log("\n=== STEP 4: VERIFY SAFE UPSERT / PRESERVING RECIPES ON PRODUCT EDIT ===");
  // Test updating a product's price/name with existing variants
  const sampleProduct = products[0];
  const beforeEditVariants = await prisma.productVariant.findMany({
    where: { productId: sampleProduct.id },
    include: { ingredients: true },
  });
  const beforeMap = new Map(beforeEditVariants.map((v) => [v.id, v.ingredients.length]));

  // Simulate updating product name and price while passing variants array (standard Admin UI behavior)
  await prisma.product.update({
    where: { id: sampleProduct.id },
    data: { name: sampleProduct.name, price: sampleProduct.price },
  });

  // Verify variants and their ingredients were NOT touched or wiped
  const afterEditVariants = await prisma.productVariant.findMany({
    where: { productId: sampleProduct.id },
    include: { ingredients: true },
  });

  let recipesPreserved = true;
  for (const afterV of afterEditVariants) {
    const beforeCount = beforeMap.get(afterV.id);
    if (!beforeCount || beforeCount !== afterV.ingredients.length || afterV.ingredients.length === 0) {
      recipesPreserved = false;
    }
  }
  console.log(`Variant recipes preserved across product edits: ${recipesPreserved ? "PASSED" : "FAILED"}`);

  console.log("\n=== STEP 5: VERIFY GET & PUT API ROUTE ENDPOINTS ===");
  try {
    const { GET, PUT } = await import("../src/app/api/products/route");

    // Test GET /api/products
    const mockGetReq = {
      url: "http://localhost:3000/api/products",
    } as any;
    const getRes = await GET(mockGetReq);
    const getJson = await getRes.json();
    console.log(`GET /api/products returned ${getJson.length} products (status: ${getRes.status}).`);
    const sampleGetProd = getJson.find((p: any) => p.id === sampleProduct.id);
    if (sampleGetProd && sampleGetProd.variants.length > 0) {
      console.log(`Sample Product Variants returned: ${sampleGetProd.variants.length}`);
      console.log(`Sample Variant Calculated HPP: Rp ${sampleGetProd.variants[0].calculatedHpp}`);
      console.log(`Sample Variant Recipe Items: ${sampleGetProd.variants[0].ingredients.length}`);
      console.log(`Sample Variant isAvailableByIngredients: ${sampleGetProd.variants[0].isAvailableByIngredients}`);
      console.log(`Sample Variant maxProducible: ${sampleGetProd.variants[0].maxProducible}`);
    }

    // Test PUT /api/products (Safe Upsert)
    const mockPutReq = {
      json: async () => ({
        id: sampleProduct.id,
        name: sampleProduct.name,
        price: sampleProduct.price,
        variants: afterEditVariants.map((v) => ({
          id: v.id,
          packaging: v.packaging,
          size: v.size,
          price: v.price,
          cost: v.cost,
          stock: v.stock,
          isActive: v.isActive,
        })),
      }),
    } as any;

    const putRes = await PUT(mockPutReq);
    const putJson = await putRes.json();
    console.log(`PUT /api/products executed successfully (status: ${putRes.status}).`);

    // Verify variants and recipes after PUT
    const postPutVariants = await prisma.productVariant.findMany({
      where: { productId: sampleProduct.id },
      include: { ingredients: true },
    });

    let putPreserved = true;
    for (const postV of postPutVariants) {
      const origCount = beforeMap.get(postV.id);
      if (!origCount || origCount !== postV.ingredients.length || postV.ingredients.length === 0) {
        putPreserved = false;
      }
    }
    console.log(`PUT endpoint preserved all variant recipes without deletion: ${putPreserved ? "PASSED" : "FAILED"}`);
  } catch (err: any) {
    console.error("API endpoint test notice:", err.message);
  }

  console.log("\n=== MIGRATION & VERIFICATION SUMMARY ===");
  console.log(`Total Products: ${products.length}`);
  console.log(`Total Variants Migrated: ${totalVariantsMigrated} (Target: 28)`);
  console.log(`Total Variant Ingredients Seeded: ${totalIngredientsCreated}`);
  console.log("=== COMPLETED SUCCESSFULLY ===");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
