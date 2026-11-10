import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySessionToken } from "@/lib/auth";

// Helper generate order number
function generateOrderNumber(prefix: string): string {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${yy}${mm}${dd}-${randomSuffix}`;
}

// GET /api/orders
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderSource = searchParams.get("orderSource"); // PO, DIRECT
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus"); // lunas, dp, belum_bayar
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (orderSource && orderSource !== "all") {
      where.orderSource = orderSource;
    }
    if (eventId && eventId !== "all") {
      where.eventId = eventId;
    }
    if (status && status !== "all") {
      where.status = status;
    }
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.createdAt = { gte: new Date(startDate) };
    }

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
        { customer: { phoneNumber: { contains: q, mode: "insensitive" } } },
      ];
    }

    const sortParam = searchParams.get("sort");
    const sortDirection: "asc" | "desc" =
      sortParam === "asc"
        ? "asc"
        : sortParam === "desc"
        ? "desc"
        : status === "diproses" || status === "pending"
        ? "asc"
        : "desc";

    const includeIngredients = searchParams.get("includeIngredients") === "true";
    const limitParam = searchParams.get("limit");
    const take = limitParam ? Math.min(parseInt(limitParam, 10), 500) : (searchParams.get("all") === "true" ? undefined : 300);

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: sortDirection },
      take,
      include: {
        customer: true,
        event: true,
        voucher: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                cost: true,
                unit: true,
                categoryId: true,
                isActive: true,
              },
            },
            variant: includeIngredients
              ? {
                  include: {
                    ingredients: {
                      include: {
                        rawMaterial: true,
                      },
                    },
                  },
                }
              : {
                  select: {
                    id: true,
                    packaging: true,
                    size: true,
                    price: true,
                    cost: true,
                    stock: true,
                    isActive: true,
                  },
                },
          },
        },
        payments: true,
      },
    });

    // Enriched dengan status pembayaran & sisa bayar
    const enriched = orders.map((order) => {
      const paidAmount = order.payments.reduce((sum, p) => sum + p.amount, 0);
      const remainingAmount = Math.max(0, order.totalAmount - paidAmount);
      let calculatedPaymentStatus: "lunas" | "dp" | "belum_bayar" = "belum_bayar";

      if (paidAmount >= order.totalAmount && order.totalAmount > 0) {
        calculatedPaymentStatus = "lunas";
      } else if (paidAmount > 0) {
        calculatedPaymentStatus = "dp";
      }

      return {
        ...order,
        paidAmount,
        remainingAmount,
        paymentStatus: calculatedPaymentStatus,
      };
    });

    // Filter by paymentStatus jika ada
    if (paymentStatus && paymentStatus !== "all") {
      const filtered = enriched.filter((o) => o.paymentStatus === paymentStatus);
      return NextResponse.json(filtered);
    }

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json({ error: "Gagal mengambil data pesanan" }, { status: 500 });
  }
}

// POST /api/orders
export async function POST(req: NextRequest) {
  try {
    // Sesi kasir: Coba baca dari cookie session_token atau header
    const token =
      req.cookies.get("session_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    const session = verifySessionToken(token);

    const body = await req.json();
    const {
      orderSource, // PO or DIRECT
      eventId,
      customerId,
      customerName, // Nama pelanggan direct / umum
      status, // "selesai" | "diproses" | "pending"
      pickupMethod,
      pickupDate,
      items, // array of { productId, qty, notes }
      voucherCode,
      voucherId,
      manualDiscountAmount = 0,
      discountAmount = 0,
      tax = 0,
      payment, // { method: "cash"|"qris"|"transfer", amount: number, isDownPayment: boolean }
      cashierName: bodyCashierName,
    } = body;

    if (!orderSource || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Data order dan item produk wajib diisi" }, { status: 400 });
    }

    if (orderSource === "PO" && !customerId && !customerName) {
      return NextResponse.json({ error: "Order Pre-Order (PO) wajib mencantumkan nama/kontak customer" }, { status: 400 });
    }

    // Validasi item dan ambil HARGA RESMI DARI DATABASE (Cegah Price Tampering)
    const productIds = items.map((it: any) => it.productId).filter(Boolean);
    const variantIds = items.map((it: any) => it.variantId).filter(Boolean);

    const dbProducts = await prisma.product.findMany({
      where: {
        OR: [
          ...(productIds.length > 0 ? [{ id: { in: productIds } }] : []),
          ...(variantIds.length > 0 ? [{ variants: { some: { id: { in: variantIds } } } }] : []),
        ],
      },
      include: {
        variants: {
          include: {
            ingredients: {
              include: { rawMaterial: true },
            },
          },
        },
      },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const variantMap = new Map<
      string,
      {
        variant: (typeof dbProducts)[0]["variants"][0];
        product: (typeof dbProducts)[0];
      }
    >();

    for (const prod of dbProducts) {
      for (const v of prod.variants) {
        variantMap.set(v.id, { variant: v, product: prod });
      }
    }

    let serverSubtotal = 0;
    const validatedItems: Array<{
      productId: string;
      variantId: string;
      qty: number;
      price: number;
      notes?: string | null;
      product: (typeof dbProducts)[0];
      variant: (typeof dbProducts)[0]["variants"][0];
    }> = [];

    for (const item of items) {
      const qty = parseInt(item.qty);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ error: "Jumlah kuantitas item harus minimal 1" }, { status: 400 });
      }

      let prod: (typeof dbProducts)[0] | undefined;
      let variant: (typeof dbProducts)[0]["variants"][0] | undefined;

      if (item.variantId) {
        const mapped = variantMap.get(item.variantId);
        if (mapped) {
          variant = mapped.variant;
          prod = mapped.product;
        }
      }

      if (!prod && item.productId) {
        prod = productMap.get(item.productId);
      }

      if (!prod) {
        return NextResponse.json({ error: `Produk tidak ditemukan (ID: ${item.productId || item.variantId})` }, { status: 404 });
      }

      if (!prod.isActive) {
        return NextResponse.json({ error: `Produk "${prod.name}" sedang nonaktif` }, { status: 400 });
      }

      // Default active variant lookup jika item.variantId belum ada/ditemukan
      if (!variant) {
        variant =
          prod.variants.find((v) => v.isActive && v.packaging === "Cup" && v.size === "Reguler") ||
          prod.variants.find((v) => v.isActive && v.packaging === "Cup") ||
          prod.variants.find((v) => v.isActive);
      }

      if (!variant) {
        return NextResponse.json(
          { error: `Varian aktif tidak ditemukan untuk produk "${prod.name}"` },
          { status: 400 }
        );
      }

      if (!variant.isActive) {
        return NextResponse.json(
          { error: `Varian "${variant.packaging} ${variant.size}" untuk produk "${prod.name}" sedang nonaktif` },
          { status: 400 }
        );
      }

      // Tentukan harga resmi: prioritaskan harga variant
      const effectivePrice = variant.price;

      serverSubtotal += effectivePrice * qty;
      validatedItems.push({
        productId: prod.id,
        variantId: variant.id,
        qty,
        price: effectivePrice,
        notes: item.notes ? String(item.notes).slice(0, 200) : null,
        product: prod,
        variant,
      });
    }

    // Validasi & Perhitungan Voucher secara Deterministik di Server
    let validatedDiscount = 0;
    let appliedVoucherId: string | null = null;

    if (voucherCode || voucherId) {
      const voucher = await prisma.voucher.findFirst({
        where: voucherId
          ? { id: voucherId }
          : { code: String(voucherCode).trim().toUpperCase() },
      });

      const now = new Date();
      if (
        voucher &&
        voucher.isActive &&
        voucher.startDate <= now &&
        voucher.endDate >= now &&
        (!voucher.usageLimit || voucher.usedCount < voucher.usageLimit) &&
        (!voucher.minPurchase || serverSubtotal >= voucher.minPurchase)
      ) {
        appliedVoucherId = voucher.id;
        if (voucher.type === "percentage") {
          const rawDisc = (serverSubtotal * voucher.value) / 100;
          validatedDiscount = voucher.maxDiscount ? Math.min(rawDisc, voucher.maxDiscount) : rawDisc;
        } else {
          validatedDiscount = Math.min(voucher.value, serverSubtotal);
        }
      } else if (voucherId || voucherCode) {
        return NextResponse.json({ error: "Voucher tidak valid atau sudah kedaluwarsa" }, { status: 400 });
      }
    } else {
      const manualDisc = Number(manualDiscountAmount || discountAmount || 0);
      if (manualDisc > 0) {
        validatedDiscount = Math.min(manualDisc, serverSubtotal);
      }
    }

    const finalTax = Number(tax || 0);
    const totalAmount = Math.max(0, serverSubtotal - validatedDiscount + finalTax);

    // Tentukan status awal order: default selalu "diproses" (Sedang Diproses)
    // Status baru berubah ke "selesai" setelah ada aksi eksplisit dari kasir/admin
    let initialStatus = status || "diproses";

    // Kasir name: prioritaskan session resmi, fallback ke body
    const finalCashierName = session ? session.name : bodyCashierName || "Kasir Booth";

    const orderNumber = generateOrderNumber(orderSource === "PO" ? "PO" : "DIR");

    // Hitung total kebutuhan bahan baku per material strictly dari variant.ingredients
    const requiredMaterialsMap = new Map<
      string,
      { materialId: string; name: string; unit: string; totalAmount: number }
    >();

    for (const item of validatedItems) {
      if (item.variant && item.variant.ingredients) {
        for (const ing of item.variant.ingredients) {
          const requiredAmount = ing.amount * item.qty;
          const existing = requiredMaterialsMap.get(ing.rawMaterialId);
          if (existing) {
            existing.totalAmount += requiredAmount;
          } else {
            requiredMaterialsMap.set(ing.rawMaterialId, {
              materialId: ing.rawMaterialId,
              name: ing.rawMaterial?.name || "Bahan",
              unit: ing.rawMaterial?.unit || "",
              totalAmount: requiredAmount,
            });
          }
        }
      }
    }

    // Verifikasi ketersediaan bahan baku sebelum transaksi
    const materialIds = Array.from(requiredMaterialsMap.keys());
    if (materialIds.length > 0) {
      const currentMaterials = await prisma.rawMaterial.findMany({
        where: { id: { in: materialIds } },
      });

      for (const mat of currentMaterials) {
        const req = requiredMaterialsMap.get(mat.id);
        if (req && mat.stock < req.totalAmount) {
          return NextResponse.json(
            {
              error: `Pesanan ditolak: Bahan baku "${mat.name}" tidak cukup. (Dibutuhkan: ${req.totalAmount} ${mat.unit}, Sisa: ${mat.stock} ${mat.unit})`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Eksekusi atomik database transaction dengan timeout 30 detik untuk lingkungan serverless (Vercel)
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Verifikasi ketersediaan bahan baku secara batch dalam transaksi
        if (materialIds.length > 0) {
          const currentMaterials = await tx.rawMaterial.findMany({
            where: { id: { in: materialIds } },
          });

          for (const mat of currentMaterials) {
            const req = requiredMaterialsMap.get(mat.id);
            if (req && mat.stock < req.totalAmount) {
              throw new Error(
                `Pesanan ditolak: Bahan baku "${mat.name}" tidak cukup. (Dibutuhkan: ${req.totalAmount} ${mat.unit}, Sisa: ${mat.stock} ${mat.unit})`
              );
            }
          }
        }

        // 2. Buat Order sekaligus OrderItems & Payment dalam 1 query bersarang
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            orderSource,
            eventId: eventId || null,
            customerId: customerId || null,
            customerName: customerName?.trim() || null,
            status: initialStatus,
            pickupMethod: pickupMethod || (orderSource === "DIRECT" ? "ambil di event" : null),
            pickupDate: pickupDate ? new Date(pickupDate) : null,
            subtotal: serverSubtotal,
            voucherId: appliedVoucherId,
            discountAmount: validatedDiscount,
            tax: finalTax,
            totalAmount,
            cashierName: finalCashierName,
            items: {
              create: validatedItems.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                qty: item.qty,
                price: item.price,
                notes: item.notes,
              })),
            },
            payments:
              payment && Number(payment.amount) > 0
                ? {
                    create: [
                      {
                        method: payment.method || "cash",
                        amount: Number(payment.amount),
                        isDownPayment: Boolean(payment.isDownPayment),
                        paidAt: new Date(),
                      },
                    ],
                  }
                : undefined,
          },
        });

        // 3. Potong stok produk jadi
        for (const item of validatedItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.qty },
            },
          });
        }

        // 4. Potong stok varian produk
        for (const item of validatedItems) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { decrement: item.qty },
            },
          });
        }

        // 5. Catat StockLog produk secara batch
        await tx.stockLog.createMany({
          data: validatedItems.map((item) => ({
            productId: item.productId,
            changeQty: -item.qty,
            reason: "terjual",
            eventId: eventId || null,
          })),
        });

        // 6. Potong stok bahan baku secara batch
        for (const [matId, req] of requiredMaterialsMap.entries()) {
          await tx.rawMaterial.update({
            where: { id: matId },
            data: {
              stock: { decrement: req.totalAmount },
            },
          });
        }

        // 7. Catat RawMaterialLog secara batch
        if (requiredMaterialsMap.size > 0) {
          await tx.rawMaterialLog.createMany({
            data: Array.from(requiredMaterialsMap.entries()).map(([matId, req]) => ({
              rawMaterialId: matId,
              changeQty: -req.totalAmount,
              type: "pemakaian",
              notes: `Pemakaian order ${orderNumber} (${req.totalAmount} ${req.unit})`,
            })),
          });
        }

        // 8. Tambah usageCount voucher jika pakai voucher
        if (appliedVoucherId) {
          await tx.voucher.update({
            where: { id: appliedVoucherId },
            data: {
              usedCount: { increment: 1 },
            },
          });
        }

        return newOrder;
      },
      {
        maxWait: 15000, // 15 detik waktu tunggu antrean koneksi
        timeout: 30000, // 30 detik batas waktu transaksi
      }
    );

    const fullOrder = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
        customer: true,
        event: true,
        voucher: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                cost: true,
                unit: true,
                categoryId: true,
                isActive: true,
              },
            },
            variant: {
              include: {
                ingredients: {
                  include: {
                    rawMaterial: true,
                  },
                },
              },
            },
          },
        },
        payments: true,
      },
    });

    return NextResponse.json(fullOrder, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat order transaksi" }, { status: 400 });
  }
}

// PUT /api/orders (Update status / Void order)
export async function PUT(req: NextRequest) {
  try {
    const token =
      req.cookies.get("session_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");
    const session = verifySessionToken(token);

    const body = await req.json();
    const { id, status, isVoided, voidReason } = body;

    if (!id) {
      return NextResponse.json({ error: "ID order wajib disertakan" }, { status: 400 });
    }

    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        voucher: true,
        items: {
          include: {
            product: true,
            variant: {
              include: {
                ingredients: {
                  include: { rawMaterial: true },
                },
              },
            },
          },
        },
      },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    // Jika order divoid/dibatalkan dan sebelumnya belum void, kembalikan stok produk & BAHAN BAKU
    if (isVoided && !currentOrder.isVoided) {
      if (!voidReason?.trim()) {
        return NextResponse.json({ error: "Alasan pembatalan/void wajib diisi" }, { status: 400 });
      }

      const voidAuthor = session ? `${session.name} (${session.role})` : "Kasir";

      const updated = await prisma.$transaction(
        async (tx) => {
          // Kembalikan stok setiap item, varian & bahan bakunya
          for (const item of currentOrder.items) {
            // 1. Kembalikan stok produk jadi
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.qty },
              },
            });

            await tx.stockLog.create({
              data: {
                productId: item.productId,
                changeQty: item.qty,
                reason: "koreksi",
                eventId: currentOrder.eventId,
              },
            });

            // 2. Kembalikan stok varian produk jika ada
            if (item.variantId && item.variant) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                  stock: { increment: item.qty },
                },
              });
            }

            // 3. Kembalikan stok bahan baku dari variant.ingredients (safely handle variantId = null)
            if (item.variant?.ingredients && item.variant.ingredients.length > 0) {
              for (const ing of item.variant.ingredients) {
                const returnAmount = ing.amount * item.qty;
                await tx.rawMaterial.update({
                  where: { id: ing.rawMaterialId },
                  data: {
                    stock: { increment: returnAmount },
                  },
                });

                await tx.rawMaterialLog.create({
                  data: {
                    rawMaterialId: ing.rawMaterialId,
                    changeQty: returnAmount,
                    type: "koreksi",
                    notes: `Rollback void order ${currentOrder.orderNumber} (${returnAmount} ${ing.rawMaterial?.unit || ""})`,
                  },
                });
              }
            }
          }

          // Kembalikan pemakaian voucher jika ada
          if (currentOrder.voucherId && currentOrder.voucher && currentOrder.voucher.usedCount > 0) {
            await tx.voucher.update({
              where: { id: currentOrder.voucherId },
              data: {
                usedCount: { decrement: 1 },
              },
            });
          }

          return tx.order.update({
            where: { id },
            data: {
              status: "dibatalkan",
              isVoided: true,
              voidReason: `${voidReason.trim()} [Dibatalkan oleh: ${voidAuthor}]`,
            },
            include: {
              customer: true,
              event: true,
              items: {
                include: {
                  product: true,
                  variant: true,
                },
              },
              payments: true,
            },
          });
        },
        {
          maxWait: 15000,
          timeout: 30000,
        }
      );

      return NextResponse.json(updated);
    }

    // Update status biasa (misal: diproses -> siap diambil -> selesai)
    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
      },
      include: {
        customer: true,
        event: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                cost: true,
                unit: true,
                categoryId: true,
                isActive: true,
              },
            },
            variant: {
              include: {
                ingredients: {
                  include: {
                    rawMaterial: true,
                  },
                },
              },
            },
          },
        },
        payments: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json({ error: "Gagal memperbarui order" }, { status: 500 });
  }
}

// DELETE /api/orders (Hapus permanen transaksi)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const restoreStock = searchParams.get("restoreStock") !== "false";

    if (!id) {
      return NextResponse.json({ error: "ID order wajib disertakan" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        voucher: true,
        items: {
          include: {
            product: true,
            variant: {
              include: {
                ingredients: {
                  include: { rawMaterial: true },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(
      async (tx) => {
        // 1. Kembalikan stok produk, varian & bahan baku jika diminta dan transaksi belum di-void
        if (restoreStock && !order.isVoided) {
          for (const item of order.items) {
            // Kembalikan stok produk
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.qty },
              },
            });

            await tx.stockLog.create({
              data: {
                productId: item.productId,
                changeQty: item.qty,
                reason: "koreksi",
                eventId: order.eventId,
              },
            });

            // Kembalikan stok varian produk jika ada
            if (item.variantId && item.variant) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                  stock: { increment: item.qty },
                },
              });
            }

            // Kembalikan stok bahan baku dari variant.ingredients (safely handle variantId = null)
            if (item.variant?.ingredients && item.variant.ingredients.length > 0) {
              for (const ing of item.variant.ingredients) {
                const usedAmount = ing.amount * item.qty;
                await tx.rawMaterial.update({
                  where: { id: ing.rawMaterialId },
                  data: {
                    stock: { increment: usedAmount },
                  },
                });

                await tx.rawMaterialLog.create({
                  data: {
                    rawMaterialId: ing.rawMaterialId,
                    changeQty: usedAmount,
                    type: "koreksi",
                    notes: `Pengembalian bahan dari penghapusan pesanan ${order.orderNumber} (${usedAmount} ${ing.rawMaterial?.unit || ""})`,
                  },
                });
              }
            }
          }
        }

        // 2. Kembalikan pemakaian voucher jika ada
        if (order.voucherId && order.voucher && order.voucher.usedCount > 0) {
          await tx.voucher.update({
            where: { id: order.voucherId },
            data: {
              usedCount: { decrement: 1 },
            },
          });
        }

        // 3. Hapus order (OrderItem & Payment terhapus otomatis via cascade)
        await tx.order.delete({
          where: { id },
        });
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Pesanan ${order.orderNumber} berhasil dihapus permanen`,
    });
  } catch (error) {
    console.error("Failed to delete order:", error);
    return NextResponse.json({ error: "Gagal menghapus pesanan" }, { status: 500 });
  }
}
