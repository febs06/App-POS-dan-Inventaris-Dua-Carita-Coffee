import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      variants: {
        orderBy: [{ packaging: "asc" }, { size: "asc" }],
      },
      ingredients: {
        include: {
          rawMaterial: true,
        },
      },
    },
  });

  for (const p of products) {
    console.log(`\n========================================`);
    console.log(`PRODUCT: ${p.name} (id: ${p.id}, unit: ${p.unit}, price: ${p.price}, cost: ${p.cost}, stock: ${p.stock})`);
    console.log(`Category: ${p.category?.name}`);
    console.log(`Variants (${p.variants.length}):`);
    for (const v of p.variants) {
      console.log(`  - Variant id: ${v.id} | ${v.packaging} - ${v.size} | price: ${v.price} | cost: ${v.cost} | stock: ${v.stock} | active: ${v.isActive}`);
    }
    console.log(`Ingredients (attached to Product!) (${p.ingredients.length}):`);
    for (const ing of p.ingredients) {
      console.log(`  - ${ing.rawMaterial.name} (${ing.rawMaterial.category}) : ${ing.amount} ${ing.rawMaterial.unit} (unitCost: ${ing.rawMaterial.costPerUnit})`);
    }
  }
}

main().finally(() => prisma.$disconnect());
