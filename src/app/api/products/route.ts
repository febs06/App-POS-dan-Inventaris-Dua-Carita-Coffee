import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const activeOnly = searchParams.get("activeOnly") === "true";
    const search = searchParams.get("search");

    const where: any = {};
    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }
    if (activeOnly) {
      where.isActive = true;
    }
    if (search?.trim()) {
      where.name = { contains: search.trim() };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        category: {
          select: { id: true, name: true },
        },
        ingredients: {
          include: {
            rawMaterial: true,
          },
        },
      },
    });

    // Hitung status ketersediaan bahan baku untuk setiap produk
    const enriched = products.map((p) => {
      let isAvailableByIngredients = true;
      const missingIngredients: string[] = [];
      let maxProducible = p.stock;

      if (p.ingredients && p.ingredients.length > 0) {
        const producibleLimits: number[] = [];

        p.ingredients.forEach((ing) => {
          const raw = ing.rawMaterial;
          if (!raw || raw.stock < ing.amount) {
            isAvailableByIngredients = false;
            missingIngredients.push(
              `${raw?.name || "Bahan"} (Sisa: ${raw?.stock || 0} ${raw?.unit || ""})`
            );
          }
          if (raw && ing.amount > 0) {
            producibleLimits.push(Math.floor(raw.stock / ing.amount));
          }
        });

        if (producibleLimits.length > 0) {
          maxProducible = Math.min(...producibleLimits);
        }
      }

      return {
        ...p,
        isAvailableByIngredients,
        missingIngredients,
        maxProducible,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Gagal mengambil data produk" }, { status: 500 });
  }
}

// POST /api/products
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, categoryId, price, cost, stock, unit, imageUrl, isActive, ingredients } = body;

    if (!name?.trim() || !categoryId || price === undefined) {
      return NextResponse.json({ error: "Nama, kategori, dan harga jual wajib diisi" }, { status: 400 });
    }

    const parsedPrice = Number(price);
    const parsedCost = Number(cost || 0);
    const parsedStock = Number(stock || 0);

    if (parsedPrice < 0 || parsedCost < 0 || parsedStock < 0) {
      return NextResponse.json({ error: "Harga dan stok tidak boleh bernilai negatif" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        categoryId,
        price: parsedPrice,
        cost: parsedCost,
        stock: parsedStock,
        unit: unit?.trim() || "pcs",
        imageUrl: imageUrl?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        category: true,
      },
    });

    // Simpan resep bahan baku jika ada
    if (Array.isArray(ingredients)) {
      for (const ing of ingredients) {
        if (ing.rawMaterialId && Number(ing.amount) > 0) {
          await prisma.productIngredient.create({
            data: {
              productId: product.id,
              rawMaterialId: ing.rawMaterialId,
              amount: Number(ing.amount),
            },
          });
        }
      }
    }

    // Catat log stok awal jika ada stok
    if (parsedStock > 0) {
      await prisma.stockLog.create({
        data: {
          productId: product.id,
          changeQty: parsedStock,
          reason: "restock",
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Gagal membuat produk" }, { status: 500 });
  }
}

// PUT /api/products
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, categoryId, price, cost, stock, unit, imageUrl, isActive, ingredients } = body;

    if (!id) {
      return NextResponse.json({ error: "ID produk wajib disertakan" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const parsedPrice = price !== undefined ? Number(price) : existing.price;
    const parsedCost = cost !== undefined ? Number(cost) : existing.cost;
    const parsedStock = stock !== undefined ? Number(stock) : existing.stock;

    if (parsedPrice < 0 || parsedCost < 0 || parsedStock < 0) {
      return NextResponse.json({ error: "Harga dan stok tidak boleh bernilai negatif" }, { status: 400 });
    }

    // Jika ada perubahan stok langsung
    const stockDiff = parsedStock - existing.stock;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name?.trim() ?? existing.name,
        categoryId: categoryId ?? existing.categoryId,
        price: parsedPrice,
        cost: parsedCost,
        stock: parsedStock,
        unit: unit?.trim() ?? existing.unit,
        imageUrl: imageUrl !== undefined ? imageUrl?.trim() || null : existing.imageUrl,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
      include: {
        category: true,
      },
    });

    // Simpan resep bahan baku jika dikirim
    if (Array.isArray(ingredients)) {
      await prisma.productIngredient.deleteMany({
        where: { productId: id },
      });
      for (const ing of ingredients) {
        if (ing.rawMaterialId && Number(ing.amount) > 0) {
          await prisma.productIngredient.create({
            data: {
              productId: id,
              rawMaterialId: ing.rawMaterialId,
              amount: Number(ing.amount),
            },
          });
        }
      }
    }

    if (stockDiff !== 0) {
      await prisma.stockLog.create({
        data: {
          productId: id,
          changeQty: stockDiff,
          reason: "koreksi",
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json({ error: "Gagal memperbarui produk" }, { status: 500 });
  }
}

// DELETE /api/products
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID produk wajib disertakan" }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ error: "Gagal menghapus produk" }, { status: 500 });
  }
}
