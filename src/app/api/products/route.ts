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
      where.name = { contains: search.trim(), mode: "insensitive" };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        category: {
          select: { id: true, name: true },
        },
        variants: {
          orderBy: [{ packaging: "asc" }, { size: "asc" }],
          include: {
            ingredients: {
              include: {
                rawMaterial: true,
              },
            },
          },
        },
      },
    });

    // Hitung status ketersediaan bahan baku & HPP akurat per varian dan per produk
    const enriched = products.map((p) => {
      let productAvailable = false;
      const productMissingSet = new Set<string>();
      let productMaxProducible = 0;

      const enrichedVariants = p.variants.map((v) => {
        let isAvailableByIngredients = true;
        const missingIngredients: string[] = [];
        let maxProducible = v.stock;
        let calculatedHpp = 0;

        if (v.ingredients && v.ingredients.length > 0) {
          const producibleLimits: number[] = [];

          v.ingredients.forEach((ing) => {
            const raw = ing.rawMaterial;
            const costPerUnit = raw?.costPerUnit ?? 0;
            calculatedHpp += ing.amount * costPerUnit;

            if (!raw || raw.stock < ing.amount) {
              isAvailableByIngredients = false;
              const missingDesc = `${raw?.name || "Bahan"} (Sisa: ${raw?.stock || 0} ${raw?.unit || ""})`;
              missingIngredients.push(missingDesc);
              productMissingSet.add(missingDesc);
            }
            if (raw && ing.amount > 0) {
              producibleLimits.push(Math.floor(raw.stock / ing.amount));
            }
          });

          if (producibleLimits.length > 0) {
            maxProducible = Math.min(...producibleLimits);
          }
        }

        if (v.isActive && isAvailableByIngredients) {
          productAvailable = true;
        }

        if (v.isActive && maxProducible > productMaxProducible) {
          productMaxProducible = maxProducible;
        }

        return {
          ...v,
          calculatedHpp: Math.round(calculatedHpp * 100) / 100,
          isAvailableByIngredients,
          missingIngredients,
          maxProducible,
        };
      });

      if (p.variants.length === 0) {
        productAvailable = p.stock > 0;
        productMaxProducible = p.stock;
      }

      return {
        ...p,
        variants: enrichedVariants,
        isAvailableByIngredients: productAvailable,
        missingIngredients: Array.from(productMissingSet),
        maxProducible: productMaxProducible,
      };
    });

    return NextResponse.json(enriched, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ error: "Gagal mengambil data produk" }, { status: 500 });
  }
}

// POST /api/products
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, categoryId, price, cost, stock, unit, imageUrl, isActive, ingredients, variants } = body;

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

    // Simpan varian ukuran & kemasan jika dikirim, atau generate default 4 varian
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        if (v.size && v.price !== undefined) {
          const createdVariant = await prisma.productVariant.create({
            data: {
              productId: product.id,
              packaging: v.packaging || "Cup",
              size: v.size,
              price: Number(v.price),
              cost: Number(v.cost || 0),
              stock: Number(v.stock || parsedStock),
              isActive: v.isActive !== undefined ? Boolean(v.isActive) : true,
            },
          });

          // Simpan resep varian jika dikirim per-varian
          if (Array.isArray(v.ingredients)) {
            for (const ing of v.ingredients) {
              if (ing.rawMaterialId && Number(ing.amount) > 0) {
                await prisma.productIngredient.create({
                  data: {
                    variantId: createdVariant.id,
                    rawMaterialId: ing.rawMaterialId,
                    amount: Number(ing.amount),
                  },
                });
              }
            }
          }
        }
      }
    } else {
      // Buat default 4 varian
      const defaultVariantsData = [
        { packaging: "Cup", size: "Reguler", price: parsedPrice, cost: parsedCost, stock: parsedStock, isActive: true },
        { packaging: "Cup", size: "Large", price: parsedPrice + 3000, cost: Math.round(parsedCost * 1.3), stock: parsedStock, isActive: true },
        { packaging: "Botol", size: "250 ML", price: parsedPrice + 2000, cost: Math.round(parsedCost * 1.2), stock: 25, isActive: true },
        { packaging: "Botol", size: "1.000 ML", price: 55000, cost: 25000, stock: 10, isActive: true },
      ];

      for (const defVar of defaultVariantsData) {
        const created = await prisma.productVariant.create({
          data: {
            productId: product.id,
            ...defVar,
          },
        });

        // Jika ada resep bahan baku dikirim via legacy payload, pasang pada Cup Reguler
        if (defVar.packaging === "Cup" && defVar.size === "Reguler" && Array.isArray(ingredients)) {
          for (const ing of ingredients) {
            if (ing.rawMaterialId && Number(ing.amount) > 0) {
              await prisma.productIngredient.create({
                data: {
                  variantId: created.id,
                  rawMaterialId: ing.rawMaterialId,
                  amount: Number(ing.amount),
                },
              });
            }
          }
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

    const createdProductWithVariants = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        category: true,
        variants: {
          orderBy: [{ packaging: "asc" }, { size: "asc" }],
          include: {
            ingredients: {
              include: { rawMaterial: true },
            },
          },
        },
      },
    });

    return NextResponse.json(createdProductWithVariants, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json({ error: "Gagal membuat produk" }, { status: 500 });
  }
}

// PUT /api/products
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, categoryId, price, cost, stock, unit, imageUrl, isActive, ingredients, variants } = body;

    if (!id) {
      return NextResponse.json({ error: "ID produk wajib disertakan" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            ingredients: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    const parsedPrice = price !== undefined ? Number(price) : existing.price;
    const parsedCost = cost !== undefined ? Number(cost) : existing.cost;
    const parsedStock = stock !== undefined ? Number(stock) : existing.stock;

    if (parsedPrice < 0 || parsedCost < 0 || parsedStock < 0) {
      return NextResponse.json({ error: "Harga dan stok tidak boleh bernilai negatif" }, { status: 400 });
    }

    const stockDiff = parsedStock - existing.stock;

    await prisma.product.update({
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
    });

    // SAFE UPSERT/DIFF UNTUK PRODUCT VARIANTS (TIDAK MENGHAPUS VARIAN ATAU RESEP VARIAN)
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        if (!v.size) continue;

        const targetPackaging = v.packaging || "Cup";
        const targetSize = v.size;

        // Cari varian eksisting berdasarkan ID atau kombinasi (packaging, size)
        const matched = existing.variants.find(
          (ev) => (v.id && ev.id === v.id) || (ev.packaging === targetPackaging && ev.size === targetSize)
        );

        if (matched) {
          // Update varian yang sudah ada tanpa menghapus ID
          await prisma.productVariant.update({
            where: { id: matched.id },
            data: {
              packaging: targetPackaging,
              size: targetSize,
              price: v.price !== undefined ? Number(v.price) : matched.price,
              cost: v.cost !== undefined ? Number(v.cost) : matched.cost,
              stock: v.stock !== undefined ? Number(v.stock) : matched.stock,
              isActive: v.isActive !== undefined ? Boolean(v.isActive) : matched.isActive,
            },
          });

          // Jika varian membawa resep bahan baku spesifik, perbarui resep varian ini
          if (Array.isArray(v.ingredients)) {
            await prisma.productIngredient.deleteMany({
              where: { variantId: matched.id },
            });
            for (const ing of v.ingredients) {
              if (ing.rawMaterialId && Number(ing.amount) > 0) {
                await prisma.productIngredient.create({
                  data: {
                    variantId: matched.id,
                    rawMaterialId: ing.rawMaterialId,
                    amount: Number(ing.amount),
                  },
                });
              }
            }
          }
        } else {
          // Buat varian baru jika belum ada
          const created = await prisma.productVariant.create({
            data: {
              productId: id,
              packaging: targetPackaging,
              size: targetSize,
              price: Number(v.price || parsedPrice),
              cost: Number(v.cost || 0),
              stock: Number(v.stock || parsedStock),
              isActive: v.isActive !== undefined ? Boolean(v.isActive) : true,
            },
          });

          if (Array.isArray(v.ingredients)) {
            for (const ing of v.ingredients) {
              if (ing.rawMaterialId && Number(ing.amount) > 0) {
                await prisma.productIngredient.create({
                  data: {
                    variantId: created.id,
                    rawMaterialId: ing.rawMaterialId,
                    amount: Number(ing.amount),
                  },
                });
              }
            }
          }
        }
      }
    }

    // Jika ada resep dikirim di level produk (legacy modal), hubungkan aman ke Cup Reguler tanpa merusak varian lain
    if (Array.isArray(ingredients)) {
      const regulerVariant = existing.variants.find(
        (ev) => ev.packaging === "Cup" && ev.size === "Reguler"
      );

      if (regulerVariant) {
        await prisma.productIngredient.deleteMany({
          where: { variantId: regulerVariant.id },
        });

        for (const ing of ingredients) {
          if (ing.rawMaterialId && Number(ing.amount) > 0) {
            await prisma.productIngredient.create({
              data: {
                variantId: regulerVariant.id,
                rawMaterialId: ing.rawMaterialId,
                amount: Number(ing.amount),
              },
            });
          }
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

    const finalProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          orderBy: [{ packaging: "asc" }, { size: "asc" }],
          include: {
            ingredients: {
              include: { rawMaterial: true },
            },
          },
        },
      },
    });

    return NextResponse.json(finalProduct);
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
