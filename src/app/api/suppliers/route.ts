import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/suppliers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "Bahan Baku", "Packaging", etc.

    const where: any = {};
    if (type && type !== "all") {
      where.type = type;
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { code: "asc" },
      include: {
        items: {
          orderBy: { name: "asc" },
        },
        priceHistories: {
          orderBy: { date: "desc" },
          take: 20,
        },
      },
    });

    const allItems = await prisma.supplierItem.findMany({
      orderBy: { name: "asc" },
      include: {
        supplier: {
          select: { id: true, code: true, name: true, phone: true, city: true },
        },
      },
    });

    const allHistories = await prisma.supplierPriceHistory.findMany({
      orderBy: { date: "desc" },
      include: {
        supplier: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    return NextResponse.json({
      suppliers,
      items: allItems,
      histories: allHistories,
    });
  } catch (error: any) {
    console.error("GET /api/suppliers error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/suppliers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Aksi 1: Buat Supplier Baru
    if (action === "create_supplier" || !action) {
      const { code, name, pic, phone, city, type, mapsUrl, notes } = body;
      if (!code || !name) {
        return NextResponse.json(
          { error: "Kode supplier dan nama supplier wajib diisi" },
          { status: 400 }
        );
      }

      const existing = await prisma.supplier.findUnique({ where: { code } });
      if (existing) {
        return NextResponse.json(
          { error: `Supplier dengan kode ${code} sudah terdaftar` },
          { status: 400 }
        );
      }

      const supplier = await prisma.supplier.create({
        data: {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          pic: pic?.trim() || null,
          phone: phone?.trim() || null,
          city: city?.trim() || "Bandung",
          type: type?.trim() || "Bahan Baku",
          mapsUrl: mapsUrl?.trim() || null,
          status: "Aktif",
          notes: notes?.trim() || null,
        },
      });

      return NextResponse.json(supplier, { status: 201 });
    }

    // Aksi 2: Buat Item Supplier Baru
    if (action === "create_item") {
      const { supplierId, category, name, qty, unit, price, notes } = body;
      if (!supplierId || !name || price === undefined) {
        return NextResponse.json(
          { error: "Supplier, nama item, dan harga wajib diisi" },
          { status: 400 }
        );
      }

      const item = await prisma.supplierItem.create({
        data: {
          supplierId,
          category: category || "Bahan Baku",
          name: name.trim(),
          qty: parseFloat(qty) || 1,
          unit: unit || "Pcs",
          price: parseFloat(price) || 0,
          priceDate: new Date(),
          status: "Aktif",
          notes: notes?.trim() || null,
        },
      });

      // Catat ke riwayat harga
      await prisma.supplierPriceHistory.create({
        data: {
          supplierId,
          supplierItemId: item.id,
          itemName: item.name,
          qty: item.qty,
          unit: item.unit,
          price: item.price,
          priceDiff: 0,
          date: new Date(),
          notes: "Harga Awal",
        },
      });

      return NextResponse.json(item, { status: 201 });
    }

    // Aksi 3: Update Harga Item & Catat History
    if (action === "update_price") {
      const { itemId, newPrice, notes } = body;
      if (!itemId || newPrice === undefined) {
        return NextResponse.json(
          { error: "Item ID dan harga baru wajib disertakan" },
          { status: 400 }
        );
      }

      const currentItem = await prisma.supplierItem.findUnique({
        where: { id: itemId },
      });

      if (!currentItem) {
        return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
      }

      const parsedPrice = parseFloat(newPrice);
      const priceDiff = parsedPrice - currentItem.price;

      const updatedItem = await prisma.supplierItem.update({
        where: { id: itemId },
        data: {
          price: parsedPrice,
          priceDate: new Date(),
        },
      });

      await prisma.supplierPriceHistory.create({
        data: {
          supplierId: currentItem.supplierId,
          supplierItemId: currentItem.id,
          itemName: currentItem.name,
          qty: currentItem.qty,
          unit: currentItem.unit,
          price: parsedPrice,
          priceDiff,
          date: new Date(),
          notes: notes?.trim() || (priceDiff > 0 ? "Kenaikan harga" : "Penurunan harga"),
        },
      });

      return NextResponse.json(updatedItem);
    }

    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/suppliers error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
