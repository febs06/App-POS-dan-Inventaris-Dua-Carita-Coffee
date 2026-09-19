import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCategory = searchParams.get("category");
    const status = searchParams.get("status"); // 'critical', 'safe'
    const search = searchParams.get("search");

    const where: any = {};

    if (rawCategory && rawCategory !== "all") {
      const decoded = decodeURIComponent(rawCategory).trim();

      // Normalisasi kategori multi-kata / variasi penulisan
      if (
        decoded === "Kemasan & Packaging" ||
        decoded.startsWith("Kemasan") ||
        decoded.startsWith("Packaging")
      ) {
        where.category = { in: ["Kemasan & Packaging", "Kemasan", "Packaging"] };
      } else if (
        decoded === "Topping & Tambahan" ||
        decoded.startsWith("Topping") ||
        decoded.startsWith("Tambahan")
      ) {
        where.category = { in: ["Topping & Tambahan", "Topping", "Tambahan"] };
      } else if (
        decoded === "Syrup/Flavor" ||
        decoded === "Sirup & Flavour" ||
        decoded.toLowerCase().includes("syrup") ||
        decoded.toLowerCase().includes("sirup")
      ) {
        where.category = { in: ["Syrup/Flavor", "Sirup & Flavour"] };
      } else if (
        decoded === "Sweatener/Gula" ||
        decoded.toLowerCase().includes("gula") ||
        decoded.toLowerCase().includes("sweatener")
      ) {
        where.category = { in: ["Sweatener/Gula", "Gula"] };
      } else if (decoded === "Dairy/Susu" || decoded.toLowerCase().includes("susu")) {
        where.category = { in: ["Dairy/Susu", "Susu"] };
      } else {
        where.category = { equals: decoded, mode: "insensitive" };
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { supplier: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ];
    }

    let materials = await prisma.rawMaterial.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: {
        logs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (status === "critical") {
      materials = materials.filter((m) => m.stock <= m.minStock);
    } else if (status === "safe") {
      materials = materials.filter((m) => m.stock > m.minStock);
    }

    const lowStockCount = materials.filter((m) => m.stock <= m.minStock).length;
    const totalInventoryValue = materials.reduce(
      (sum, m) => sum + m.stock * m.costPerUnit,
      0
    );

    return NextResponse.json({
      materials,
      totalCount: materials.length,
      lowStockCount,
      totalInventoryValue,
    });
  } catch (error: any) {
    console.error("GET /api/raw-materials error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, category, stock, unit, minStock, costPerUnit, supplier } = body;

    if (!name || !unit) {
      return NextResponse.json(
        { error: "Nama bahan baku dan satuan wajib diisi" },
        { status: 400 }
      );
    }

    const initialStock = parseFloat(stock) || 0;

    const material = await prisma.rawMaterial.create({
      data: {
        name: name.trim(),
        category: category?.trim() || "Bahan Minuman",
        stock: initialStock,
        unit: unit.trim(),
        minStock: parseFloat(minStock) || 10,
        costPerUnit: parseFloat(costPerUnit) || 0,
        supplier: supplier?.trim() || "",
      },
    });

    if (initialStock > 0) {
      await prisma.rawMaterialLog.create({
        data: {
          rawMaterialId: material.id,
          changeQty: initialStock,
          type: "restock",
          notes: "Saldo stok awal pendaftaran bahan",
        },
      });
    }

    return NextResponse.json(material, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/raw-materials error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, category, unit, minStock, costPerUnit, supplier } = body;

    if (!id) {
      return NextResponse.json({ error: "ID bahan baku diperlukan" }, { status: 400 });
    }

    const updated = await prisma.rawMaterial.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        category: category !== undefined ? category.trim() : undefined,
        unit: unit !== undefined ? unit.trim() : undefined,
        minStock: minStock !== undefined ? parseFloat(minStock) : undefined,
        costPerUnit: costPerUnit !== undefined ? parseFloat(costPerUnit) : undefined,
        supplier: supplier !== undefined ? supplier.trim() : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/raw-materials error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID bahan baku diperlukan" }, { status: 400 });
    }

    await prisma.rawMaterial.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/raw-materials error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
