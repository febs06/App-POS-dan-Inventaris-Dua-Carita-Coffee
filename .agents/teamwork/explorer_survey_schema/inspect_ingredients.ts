import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ingredients = await prisma.productIngredient.findMany({
    include: {
      product: {
        select: { id: true, name: true, unit: true },
      },
      rawMaterial: {
        select: { id: true, name: true, category: true, unit: true },
      },
    },
  });

  console.log(`Total ProductIngredient rows: ${ingredients.length}`);
  for (const ing of ingredients) {
    console.log(`id: ${ing.id} | Product: ${ing.product?.name} (${ing.productId}) -> Raw: ${ing.rawMaterial?.name} (${ing.rawMaterialId}) | amount: ${ing.amount}`);
  }
}

main().finally(() => prisma.$disconnect());
