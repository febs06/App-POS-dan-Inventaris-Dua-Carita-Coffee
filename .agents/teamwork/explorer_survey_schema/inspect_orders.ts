import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const totalOrderItems = await prisma.orderItem.count();
  const withVariant = await prisma.orderItem.count({
    where: { variantId: { not: null } },
  });
  const withoutVariant = await prisma.orderItem.count({
    where: { variantId: null },
  });

  console.log({ totalOrderItems, withVariant, withoutVariant });

  const sampleWithVariant = await prisma.orderItem.findMany({
    where: { variantId: { not: null } },
    take: 5,
    include: {
      product: { select: { name: true } },
      variant: true,
      order: { select: { orderNumber: true, createdAt: true } },
    },
  });
  console.log("Sample with variant:", JSON.stringify(sampleWithVariant, null, 2));

  const sampleWithoutVariant = await prisma.orderItem.findMany({
    where: { variantId: null },
    take: 5,
    include: {
      product: { select: { name: true } },
      order: { select: { orderNumber: true, createdAt: true } },
    },
  });
  console.log("Sample without variant:", JSON.stringify(sampleWithoutVariant, null, 2));
}

main().finally(() => prisma.$disconnect());
