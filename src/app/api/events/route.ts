import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startDate: "desc" },
      include: {
        _count: {
          select: { orders: true },
        },
        orders: {
          select: {
            totalAmount: true,
            isVoided: true,
          },
        },
      },
    });

    const enriched = events.map((ev) => {
      const activeOrders = ev.orders.filter((o) => !o.isVoided);
      const totalRevenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const { orders, ...rest } = ev;
      return {
        ...rest,
        orderCount: activeOrders.length,
        totalRevenue,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return NextResponse.json({ error: "Gagal mengambil data event" }, { status: 500 });
  }
}

// POST /api/events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, location, startDate, endDate, notes, status } = body;

    if (!name || !location || !startDate || !endDate) {
      return NextResponse.json({ error: "Nama, lokasi, dan tanggal wajib diisi" }, { status: 400 });
    }

    const event = await prisma.event.create({
      data: {
        name,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes: notes || null,
        status: status || "upcoming",
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json({ error: "Gagal membuat event" }, { status: 500 });
  }
}

// PUT /api/events
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, location, startDate, endDate, notes, status } = body;

    if (!id) {
      return NextResponse.json({ error: "ID event wajib disertakan" }, { status: 400 });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        notes: notes !== undefined ? notes : undefined,
        ...(status && { status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json({ error: "Gagal memperbarui event" }, { status: 500 });
  }
}

// DELETE /api/events
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID event wajib disertakan" }, { status: 400 });
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Event berhasil dihapus" });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json({ error: "Gagal menghapus event" }, { status: 500 });
  }
}
