import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Product Ingredients / Recipes...");

  const products = await prisma.product.findMany();
  const rawMaterials = await prisma.rawMaterial.findMany();

  const getRaw = (namePart: string) =>
    rawMaterials.find((r) => r.name.toLowerCase().includes(namePart.toLowerCase()));

  const kopi = getRaw("Biji Kopi");
  const susu = getRaw("Susu");
  const caramel = getRaw("Caramel");
  const aren = getRaw("Aren");
  const cup = getRaw("Cup Plastik");
  const lid = getRaw("Sedotan");
  const matcha = getRaw("Matcha");

  for (const prod of products) {
    const pName = prod.name.toLowerCase();

    // Clear existing ingredients for clean seed
    await prisma.productIngredient.deleteMany({
      where: { productId: prod.id },
    });

    if (pName.includes("kopi susu")) {
      if (kopi) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: kopi.id, amount: 18 } });
      if (susu) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: susu.id, amount: 150 } });
      if (aren) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: aren.id, amount: 25 } });
      if (cup) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: cup.id, amount: 1 } });
      if (lid) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: lid.id, amount: 1 } });
    } else if (pName.includes("caramel")) {
      if (kopi) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: kopi.id, amount: 18 } });
      if (susu) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: susu.id, amount: 160 } });
      if (caramel) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: caramel.id, amount: 20 } });
      if (cup) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: cup.id, amount: 1 } });
      if (lid) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: lid.id, amount: 1 } });
    } else if (pName.includes("matcha")) {
      if (matcha) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: matcha.id, amount: 12 } });
      if (susu) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: susu.id, amount: 180 } });
      if (cup) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: cup.id, amount: 1 } });
      if (lid) await prisma.productIngredient.create({ data: { productId: prod.id, rawMaterialId: lid.id, amount: 1 } });
    }
  }

  console.log("Product Ingredients seeded successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
