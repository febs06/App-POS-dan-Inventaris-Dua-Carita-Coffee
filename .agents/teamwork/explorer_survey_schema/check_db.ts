import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [
    productsCount,
    variantsCount,
    ingredientsCount,
    rawMaterialsCount,
    ordersCount,
    orderItemsCount,
    categoriesCount,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.productIngredient.count(),
    prisma.rawMaterial.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.category.count(),
  ]);

  console.log("=== COUNTS ===");
  console.log({
    productsCount,
    variantsCount,
    ingredientsCount,
    rawMaterialsCount,
    ordersCount,
    orderItemsCount,
    categoriesCount,
  });

  console.log("\n=== SAMPLE PRODUCTS ===");
  const products = await prisma.product.findMany({
    take: 5,
    include: {
      category: true,
      variants: true,
      ingredients: {
        include: {
          rawMaterial: true,
        },
      },
    },
  });
  console.log(JSON.stringify(products, null, 2));

  console.log("\n=== ALL VARIANTS ===");
  const variants = await prisma.productVariant.findMany({
    include: {
      product: {
        select: { id: true, name: true },
      },
    },
  });
  console.log(JSON.stringify(variants, null, 2));

  console.log("\n=== RAW MATERIALS CATEGORIES ===");
  const rawMaterials = await prisma.rawMaterial.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      unit: true,
      costPerUnit: true,
      stock: true,
    },
  });
  console.log(JSON.stringify(rawMaterials, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
