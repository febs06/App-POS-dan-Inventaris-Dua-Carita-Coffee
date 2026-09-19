import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      where.OR = [
        { orderNumber: { contains: search.trim() } },
        { customer: { name: { contains: search.trim() } } },
        { customer: { phoneNumber: { contains: search.trim() } } },
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
    const body = await req.json();
    const {
      orderSource, // PO or DIRECT
      eventId,
      customerId,
      pickupMethod,
      pickupDate,
      items, // array of { productId, qty, notes, price }
      voucherId,
      discountAmount = 0,
      tax = 0,
      payment, // { method: "cash"|"qris"|"transfer", amount: number, isDownPayment: boolean }
      cashierName,
    } = body;

    if (!orderSource || !items || items.length === 0) {
      return NextResponse.json({ error: "Data order dan item produk wajib diisi" }, { status: 400 });
    }

    if (orderSource === "PO" && !customerId) {
      return NextResponse.json({ error: "Order Pre-Order (PO) wajib memilih customer" }, { status: 400 });
    }

    const orderNumber = generateOrderNumber(orderSource === "PO" ? "PO" : "DIR");

    // Hitung subtotal
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.qty * item.price;
    }

    const finalDiscount = Number(discountAmount || 0);
    const finalTax = Number(tax || 0);
    const totalAmount = Math.max(0, subtotal - finalDiscount + finalTax);

    // Validasi ketersediaan bahan baku sebelum transaksi
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          ingredients: {
            include: { rawMaterial: true },
          },
        },
      });

      if (!product) {
        return NextResponse.json({ error: `Produk tidak ditemukan (ID: ${item.productId})` }, { status: 404 });
      }

      for (const ing of product.ingredients) {
        const requiredAmount = ing.amount * item.qty;
        if (!ing.rawMaterial || ing.rawMaterial.stock < requiredAmount) {
          return NextResponse.json({
            error: `Pesanan ditolak: Bahan baku "${ing.rawMaterial?.name || "Bahan"}" habis/kurang untuk membuat "${product.name}". (Dibutuhkan: ${requiredAmount} ${ing.rawMaterial?.unit || ""}, Sisa: ${ing.rawMaterial?.stock || 0} ${ing.rawMaterial?.unit || ""})`,
          }, { status: 400 });
        }
      }
    }

    // Database transaction untuk order, order items, stock decrement, dan payment
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          orderSource,
          eventId: eventId || null,
          customerId: customerId || null,
          status: orderSource === "DIRECT" ? "selesai" : "pending",
          pickupMethod: pickupMethod || (orderSource === "DIRECT" ? "ambil di event" : null),
          pickupDate: pickupDate ? new Date(pickupDate) : null,
          subtotal,
          voucherId: voucherId || null,
          discountAmount: finalDiscount,
          tax: finalTax,
          totalAmount,
          cashierName: cashierName || null,
        },
      });

      // 2. Buat OrderItems & Potong Stok Produk & Potong Bahan Baku
      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            qty: item.qty,
            price: item.price,
            notes: item.notes || null,
          },
        });

        // Kurangi stok produk jadi
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.qty,
            },
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
        const prodWithIngredients = await tx.product.findUnique({
          where: { id: item.productId },
          include: { ingredients: true },
        });

        if (prodWithIngredients?.ingredients) {
          for (const ing of prodWithIngredients.ingredients) {
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
                notes: `Pemakaian order ${orderNumber} (${item.qty} ${prodWithIngredients.unit || "item"})`,
              },
            });
          }
        }
      }

      // 3. Tambah usageCount voucher jika pakai voucher
      if (voucherId) {
        await tx.voucher.update({
          where: { id: voucherId },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // 4. Catat Payment jika ada
      if (payment && payment.amount > 0) {
        await tx.payment.create({
          data: {
            orderId: newOrder.id,
            method: payment.method || "cash",
            amount: payment.amount,
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
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json({ error: "Gagal membuat order transaksi" }, { status: 500 });
  }
}

// PUT /api/orders (Update status / Void order)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, isVoided, voidReason } = body;

    if (!id) {
      return NextResponse.json({ error: "ID order wajib disertakan" }, { status: 400 });
    }

    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    // Jika order divoid/dibatalkan dan sebelumnya belum void, kembalikan stok produk
    if (isVoided && !currentOrder.isVoided) {
      if (!voidReason?.trim()) {
        return NextResponse.json({ error: "Alasan pembatalan/void wajib diisi" }, { status: 400 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        // Kembalikan stok setiap item
        for (const item of currentOrder.items) {
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
        }

        return tx.order.update({
          where: { id },
          data: {
            status: "dibatalkan",
            isVoided: true,
            voidReason: voidReason.trim(),
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

