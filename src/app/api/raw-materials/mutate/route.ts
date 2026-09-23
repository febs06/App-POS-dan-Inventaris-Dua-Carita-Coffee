import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawMaterialId = searchParams.get("rawMaterialId");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (rawMaterialId && rawMaterialId !== "all") {
      where.rawMaterialId = rawMaterialId;
    }
    if (type && type !== "all") {
      where.type = type;
    }

    const logs = await prisma.rawMaterialLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        rawMaterial: {
          select: {
            name: true,
            unit: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("GET /api/raw-materials/mutate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rawMaterialId, changeQty, type, notes, date } = body;

    if (!rawMaterialId || changeQty === undefined || !type) {
      return NextResponse.json(
        { error: "Bahan baku, jumlah mutasi, dan jenis mutasi wajib diisi" },
        { status: 400 }
      );
    }

    const qty = parseFloat(changeQty);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Jumlah mutasi harus berupa angka positif lebih dari 0" },
        { status: 400 }
      );
    }

    const material = await prisma.rawMaterial.findUnique({
      where: { id: rawMaterialId },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Bahan baku tidak ditemukan" },
        { status: 404 }
      );
    }

    // Determine sign: restock / masuk is positive, pemakaian / rusak is negative, koreksi depends
    let signedQty = qty;
    if (type === "pemakaian" || type === "rusak") {
      signedQty = -Math.abs(qty);
    } else if (type === "restock") {
      signedQty = Math.abs(qty);
    } else if (type === "koreksi") {
      signedQty = qty; // can be positive or negative
    }

    const newStock = Math.max(0, material.stock + signedQty);
    const logDate = date ? new Date(date) : new Date();

    const [updatedMaterial, log] = await prisma.$transaction([
      prisma.rawMaterial.update({
        where: { id: rawMaterialId },
        data: { stock: newStock },
      }),
      prisma.rawMaterialLog.create({
        data: {
          rawMaterialId,
          changeQty: signedQty,
          type,
          notes: notes || null,
          createdAt: logDate,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      material: updatedMaterial,
      log,
    });
  } catch (error: any) {
    console.error("POST /api/raw-materials/mutate error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
