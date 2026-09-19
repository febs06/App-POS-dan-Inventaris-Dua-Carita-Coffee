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

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        event: true,
        voucher: true,
        items: {
          include: {
            product: true,
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
    const productIds = items.map((it: any) => it.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        ingredients: {
          include: { rawMaterial: true },
        },
      },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let serverSubtotal = 0;
    const validatedItems: Array<{
      productId: string;
      qty: number;
      price: number;
      notes?: string | null;
      product: (typeof dbProducts)[0];
    }> = [];

    for (const item of items) {
      const qty = parseInt(item.qty);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ error: "Jumlah kuantitas item harus minimal 1" }, { status: 400 });
      }

      const prod = productMap.get(item.productId);
      if (!prod) {
        return NextResponse.json({ error: `Produk tidak ditemukan (ID: ${item.productId})` }, { status: 404 });
      }

      if (!prod.isActive) {
        return NextResponse.json({ error: `Produk "${prod.name}" sedang nonaktif` }, { status: 400 });
      }

      // Gunakan prod.price RESMI DARI SERVER
      serverSubtotal += prod.price * qty;
      validatedItems.push({
        productId: prod.id,
        qty,
        price: prod.price,
        notes: item.notes ? String(item.notes).slice(0, 200) : null,
        product: prod,
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

    // Tentukan status awal order
    // Jika DIRECT: kasir bisa memilih "selesai" atau "diproses" (antre). Default: "selesai".
    // Jika PO: default "pending".
    let initialStatus = "selesai";
    if (orderSource === "PO") {
      initialStatus = status || "pending";
    } else {
      initialStatus = status || "selesai";
    }

    // Kasir name: prioritaskan session resmi, fallback ke body
    const finalCashierName = session ? session.name : bodyCashierName || "Kasir Booth";

    const orderNumber = generateOrderNumber(orderSource === "PO" ? "PO" : "DIR");

    // Eksekusi atomik database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verifikasi ketersediaan bahan baku di dalam transaksi
      for (const item of validatedItems) {
        for (const ing of item.product.ingredients) {
          const requiredAmount = ing.amount * item.qty;
          const currentMat = await tx.rawMaterial.findUnique({
            where: { id: ing.rawMaterialId },
          });

          if (!currentMat || currentMat.stock < requiredAmount) {
            throw new Error(
              `Pesanan ditolak: Bahan baku "${currentMat?.name || "Bahan"}" tidak cukup untuk membuat "${item.product.name}". (Dibutuhkan: ${requiredAmount} ${currentMat?.unit || ""}, Sisa: ${currentMat?.stock || 0} ${currentMat?.unit || ""})`
            );
          }
        }
      }

      // 2. Buat Order
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
        },
      });

      // 3. Buat OrderItems, Potong Stok Produk, dan Potong Bahan Baku
      for (const item of validatedItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            qty: item.qty,
            price: item.price,
            notes: item.notes,
          },
        });

        // Kurangi stok produk jadi
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.qty },
          },
        });

        // Catat di StockLog produk
        await tx.stockLog.create({
          data: {
            productId: item.productId,
            changeQty: -item.qty,
            reason: "terjual",
            eventId: eventId || null,
          },
        });

        // Kurangi stok bahan baku sesuai resep
        for (const ing of item.product.ingredients) {
          const usedAmount = ing.amount * item.qty;
          await tx.rawMaterial.update({
            where: { id: ing.rawMaterialId },
            data: {
              stock: { decrement: usedAmount },
            },
          });

          await tx.rawMaterialLog.create({
            data: {
              rawMaterialId: ing.rawMaterialId,
              changeQty: -usedAmount,
              type: "pemakaian",
              notes: `Pemakaian order ${orderNumber} (${item.qty} ${item.product.unit || "item"})`,
            },
          });
        }
      }

      // 4. Tambah usageCount voucher jika pakai voucher
      if (appliedVoucherId) {
        await tx.voucher.update({
          where: { id: appliedVoucherId },
          data: {
            usedCount: { increment: 1 },
          },
        });
      }

      // 5. Catat Payment jika ada
      if (payment && Number(payment.amount) > 0) {
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            method: payment.method || "cash",
            amount: Number(payment.amount),
            isDownPayment: Boolean(payment.isDownPayment),
            paidAt: new Date(),
          },
        });
      }

      return newOrder;
    });

    const fullOrder = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
        customer: true,
        event: true,
        voucher: true,
        items: {
          include: { product: true },
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
            product: {
              include: { ingredients: true },
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

      const updated = await prisma.$transaction(async (tx) => {
        // Kembalikan stok setiap item & bahan bakunya
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

          // 2. Kembalikan stok bahan baku (FIX: Rollback bahan baku sesuai resep)
          if (item.product?.ingredients && item.product.ingredients.length > 0) {
            for (const ing of item.product.ingredients) {
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
                  notes: `Rollback void order ${currentOrder.orderNumber} (${returnAmount} ${ing.rawMaterialId})`,
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
            items: { include: { product: true } },
            payments: true,
          },
        });
      });

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
        items: { include: { product: true } },
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
            product: {
              include: { ingredients: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Kembalikan stok produk & bahan baku jika diminta dan transaksi belum di-void
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

          // Kembalikan stok bahan baku
          if (item.product?.ingredients && item.product.ingredients.length > 0) {
            for (const ing of item.product.ingredients) {
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
                  notes: `Pengembalian bahan dari penghapusan pesanan ${order.orderNumber}`,
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
    });

    return NextResponse.json({
      success: true,
      message: `Pesanan ${order.orderNumber} berhasil dihapus permanen`,
    });
  } catch (error) {
    console.error("Failed to delete order:", error);
    return NextResponse.json({ error: "Gagal menghapus pesanan" }, { status: 500 });
  }
}
