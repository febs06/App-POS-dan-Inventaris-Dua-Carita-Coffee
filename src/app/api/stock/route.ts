import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/stock
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const eventId = searchParams.get("eventId");
    const reason = searchParams.get("reason");

    // Ambil produk dan hitung status stok
    const products = await prisma.product.findMany({
      orderBy: { stock: "asc" },
      include: {
        category: true,
      },
    });

    const lowStockProducts = products.filter((p) => p.stock <= 10 && p.isActive);

    // Ambil StockLog dengan filter
    const logWhere: any = {};
    if (productId && productId !== "all") {
      logWhere.productId = productId;
    }
    if (eventId && eventId !== "all") {
      logWhere.eventId = eventId;
    }
    if (reason && reason !== "all") {
      logWhere.reason = reason;
    }

    const logs = await prisma.stockLog.findMany({
      where: logWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        product: { select: { id: true, name: true, unit: true } },
        event: { select: { id: true, name: true, location: true } },
      },
    });

    // Ringkasan alokasi stok ke event (berapa banyak stok dibawa per event)
    const eventAllocations = await prisma.stockLog.findMany({
      where: {
        reason: "dibawa ke event",
        eventId: { not: null },
      },
      include: {
        product: true,
        event: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      products,
      lowStockProducts,
      lowStockCount: lowStockProducts.length,
      logs,
      eventAllocations,
    });
  } catch (error) {
    console.error("Failed to fetch stock info:", error);
    return NextResponse.json({ error: "Gagal mengambil data stok" }, { status: 500 });
  }
}

// POST /api/stock
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, productId, changeQty, reason, eventId, allocations } = body;

    // Aksi 1: Alokasi stok ke event (Bawa stok ke booth bazaar)
    if (action === "allocate_event") {
      if (!eventId || !allocations || !Array.isArray(allocations) || allocations.length === 0) {
        return NextResponse.json({ error: "Event dan daftar item alokasi wajib diisi" }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        for (const item of allocations) {
          const qty = Number(item.qty);
          if (qty <= 0) continue;

          // Catat log alokasi dibawa ke event
          await tx.stockLog.create({
            data: {
              productId: item.productId,
              changeQty: -qty, // Berkurang dari stok induk / gudang persiapan
              reason: "dibawa ke event",
              eventId,
            },
          });
        }
      });

      return NextResponse.json({ message: "Alokasi stok ke event berhasil dicatat!" });
    }

    // Aksi 2: Restock / Penyesuaian stok per produk
    if (!productId || changeQty === undefined) {
      return NextResponse.json({ error: "ID produk dan jumlah perubahan stok wajib diisi" }, { status: 400 });
    }

    const qty = Number(changeQty);
    const validReason = reason || (qty >= 0 ? "restock" : "koreksi");

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          stock: { increment: qty },
        },
      });

      await tx.stockLog.create({
        data: {
          productId,
          changeQty: qty,
          reason: validReason,
          eventId: eventId || null,
        },
      });

      return product;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update stock:", error);
    return NextResponse.json({ error: "Gagal memproses penyesuaian stok" }, { status: 500 });
  }
}
