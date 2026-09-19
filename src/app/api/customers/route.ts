import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/customers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const where: any = {};
    if (search?.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { phoneNumber: { contains: search.trim() } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { orders: true },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            totalAmount: true,
          },
        },
      },
    });

    const enriched = customers.map((c) => ({
      id: c.id,
      name: c.name,
      phoneNumber: c.phoneNumber,
      notes: c.notes,
      totalOrders: c._count.orders,
      lastOrder: c.orders[0] || null,
      createdAt: c.createdAt,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json({ error: "Gagal mengambil data pelanggan" }, { status: 500 });
  }
}

// POST /api/customers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phoneNumber, notes } = body;

    if (!name?.trim() || !phoneNumber?.trim()) {
      return NextResponse.json({ error: "Nama dan nomor WhatsApp wajib diisi" }, { status: 400 });
    }

    // Format nomor WA jika perlu (hapus +, spasi, dash)
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phoneNumber: cleanPhone,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Failed to create customer:", error);
    return NextResponse.json({ error: "Gagal membuat data pelanggan" }, { status: 500 });
  }
}

// PUT /api/customers
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, phoneNumber, notes } = body;

    if (!id || !name?.trim() || !phoneNumber?.trim()) {
      return NextResponse.json({ error: "ID, nama, dan nomor WhatsApp wajib diisi" }, { status: 400 });
    }

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name.trim(),
        phoneNumber: cleanPhone,
        notes: notes !== undefined ? notes?.trim() || null : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update customer:", error);
    return NextResponse.json({ error: "Gagal memperbarui data pelanggan" }, { status: 500 });
  }
}

// DELETE /api/customers
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID pelanggan wajib disertakan" }, { status: 400 });
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Pelanggan berhasil dihapus" });
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return NextResponse.json({ error: "Gagal menghapus data pelanggan" }, { status: 500 });
  }
}
