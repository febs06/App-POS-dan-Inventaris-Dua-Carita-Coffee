import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "Gagal mengambil data kategori" }, { status: 500 });
  }
}

// POST /api/categories
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create category:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Kategori dengan nama tersebut sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal membuat kategori" }, { status: 500 });
  }
}

// PUT /api/categories
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, description } = body;

    if (!id || !name?.trim()) {
      return NextResponse.json({ error: "ID dan nama kategori wajib diisi" }, { status: 400 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update category:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Kategori dengan nama tersebut sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal memperbarui kategori" }, { status: 500 });
  }
}

// DELETE /api/categories
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID kategori wajib disertakan" }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Kategori berhasil dihapus" });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
  }
}
