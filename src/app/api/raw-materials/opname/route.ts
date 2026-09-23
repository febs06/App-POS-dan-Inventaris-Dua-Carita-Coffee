import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/raw-materials/opname
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawMaterialId = searchParams.get("rawMaterialId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};
    if (rawMaterialId && rawMaterialId !== "all") {
      where.rawMaterialId = rawMaterialId;
    }

    const opnames = await prisma.stockOpname.findMany({
      where,
      orderBy: { opnameDate: "desc" },
      take: limit,
      include: {
        rawMaterial: {
          select: {
            id: true,
            name: true,
            unit: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(opnames);
  } catch (error: any) {
    console.error("GET /api/raw-materials/opname error:", error);
    return NextResponse.json({ error: error.message || "Gagal mengambil data stock opname" }, { status: 500 });
  }
}

// POST /api/raw-materials/opname
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawMaterialId, physicalStock, notes, opnameDate } = body;

    if (!rawMaterialId || physicalStock === undefined || physicalStock === null) {
      return NextResponse.json(
        { error: "Bahan baku dan hasil hitung stok fisik wajib diisi" },
        { status: 400 }
      );
    }

    const parsedPhysical = parseFloat(physicalStock);
    if (isNaN(parsedPhysical) || parsedPhysical < 0) {
      return NextResponse.json(
        { error: "Stok fisik harus berupa angka valid minimal 0" },
        { status: 400 }
      );
    }

    const material = await prisma.rawMaterial.findUnique({
      where: { id: rawMaterialId },
    });

    if (!material) {
      return NextResponse.json({ error: "Bahan baku tidak ditemukan" }, { status: 404 });
    }

    const systemStock = material.stock;
    const difference = parsedPhysical - systemStock;
    const recordDate = opnameDate ? new Date(opnameDate) : new Date();

    const [opnameRecord, updatedMaterial] = await prisma.$transaction(async (tx) => {
      // 1. Simpan rekaman Stock Opname
      const opname = await tx.stockOpname.create({
        data: {
          rawMaterialId,
          systemStock,
          physicalStock: parsedPhysical,
          difference,
          notes: notes?.trim() || null,
          opnameDate: recordDate,
        },
        include: {
          rawMaterial: true,
        },
      });

      // 2. Koreksi stok sistem mengikuti hasil fisik aktual
      const updated = await tx.rawMaterial.update({
        where: { id: rawMaterialId },
        data: { stock: parsedPhysical },
      });

      // 3. Catat di RawMaterialLog sebagai audit mutasi koreksi
      await tx.rawMaterialLog.create({
        data: {
          rawMaterialId,
          changeQty: difference,
          type: "koreksi",
          notes: notes?.trim()
            ? `Stock Opname: ${notes.trim()} (Sistem: ${systemStock}, Fisik: ${parsedPhysical})`
            : `Koreksi Stock Opname (Sistem: ${systemStock} -> Fisik: ${parsedPhysical})`,
          createdAt: recordDate,
        },
      });

      return [opname, updated];
    });

    return NextResponse.json(
      {
        success: true,
        opname: opnameRecord,
        material: updatedMaterial,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/raw-materials/opname error:", error);
    return NextResponse.json({ error: error.message || "Gagal menyimpan stock opname" }, { status: 500 });
  }
}
