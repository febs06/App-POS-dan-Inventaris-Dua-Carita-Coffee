import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing and normalizing Raw Materials categories...');

  // 1. Fix Botol 1000 ML category to Kemasan & Packaging
  const botol1000 = await prisma.rawMaterial.updateMany({
    where: { name: 'Botol 1000 ML' },
    data: { category: 'Kemasan & Packaging' }
  });
  console.log('Updated Botol 1000 ML to Kemasan & Packaging:', botol1000.count);

  // 2. Fix Botol 250 ML and other packaging if needed
  await prisma.rawMaterial.updateMany({
    where: {
      name: { in: ['Botol 250 ML', 'Cup Injection 12 Oz', 'Tutup Cup Injection', 'Stiker 250 ML', 'Stiker 1000 ML', 'Cup Plastik 16oz Sablon', 'Lid Cup Dome & Sedotan Kertas'] }
    },
    data: { category: 'Kemasan & Packaging' }
  });

  // 3. Normalize Sirup & Gula
  await prisma.rawMaterial.updateMany({
    where: { name: 'Sirup Caramel Premium' },
    data: { category: 'Syrup/Flavor' }
  });
  await prisma.rawMaterial.updateMany({
    where: { name: 'Gula Aren Cair Organik' },
    data: { category: 'Sweatener/Gula' }
  });

  // 4. Ensure Topping & Tambahan items exist
  const existingEs = await prisma.rawMaterial.findFirst({
    where: { name: { contains: 'Es Batu', mode: 'insensitive' } }
  });
  if (!existingEs) {
    await prisma.rawMaterial.create({
      data: {
        name: 'Es Batu Kristal (Additional Es)',
        category: 'Topping & Tambahan',
        unit: 'porsi',
        stock: 150,
        minStock: 25,
        costPerUnit: 1000,
        supplier: 'Supplier Es Kristal'
      }
    });
    console.log('Created Es Batu Kristal in Topping & Tambahan');
  } else {
    await prisma.rawMaterial.update({
      where: { id: existingEs.id },
      data: { category: 'Topping & Tambahan' }
    });
    console.log('Updated existing Es to Topping & Tambahan');
  }

  const existingExtraShot = await prisma.rawMaterial.findFirst({
    where: { name: { contains: 'Extra Shot', mode: 'insensitive' } }
  });
  if (!existingExtraShot) {
    await prisma.rawMaterial.create({
      data: {
        name: 'Extra Shot Espresso',
        category: 'Topping & Tambahan',
        unit: 'shot',
        stock: 100,
        minStock: 20,
        costPerUnit: 3500,
        supplier: 'Dua Carita Roastery'
      }
    });
    console.log('Created Extra Shot Espresso in Topping & Tambahan');
  }

  // 5. Print all items by category
  const all = await prisma.rawMaterial.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  console.log(`\n=== ALL RAW MATERIALS (${all.length}) ===`);
  all.forEach(m => console.log(`[${m.category}] ${m.name} (${m.stock} ${m.unit})`));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
