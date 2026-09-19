import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/rab
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // "MEI 2026", "JUNI 2026", etc. or "all"
    const fundedBy = searchParams.get("fundedBy"); // "DCC", "Febri", etc. or "all"
    const search = searchParams.get("search");

    const where: any = {};

    if (month && month !== "all") {
      where.month = month;
    }

    if (fundedBy && fundedBy !== "all") {
      where.fundedBy = fundedBy;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const items = await prisma.rabItem.findMany({
      where,
      orderBy: [{ month: "asc" }, { seqNo: "asc" }],
    });

    // Compute summaries across all items
    const allItems = await prisma.rabItem.findMany({
      orderBy: [{ month: "asc" }, { seqNo: "asc" }],
    });

    const monthTotals: Record<string, number> = {};
    const funderTotals: Record<string, number> = {};
    let grandTotal = 0;

    for (const item of allItems) {
      grandTotal += item.totalPrice;

      // Month breakdown
      monthTotals[item.month] = (monthTotals[item.month] || 0) + item.totalPrice;

      // Funder breakdown
      const f = item.fundedBy || "DCC";
      funderTotals[f] = (funderTotals[f] || 0) + item.totalPrice;
    }

    // Filtered subtotal
    const filteredTotal = items.reduce((acc, i) => acc + i.totalPrice, 0);

    return NextResponse.json({
      items,
      summary: {
        grandTotal,
        filteredTotal,
        totalItems: items.length,
        monthTotals,
        funderTotals,
      },
    });
  } catch (error: any) {
    console.error("GET /api/rab error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/rab
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { month, name, qty, unit, unitPrice, notes, fundedBy } = body;

    if (!month || !name || unitPrice === undefined) {
      return NextResponse.json(
        { error: "Bulan, nama item, dan harga satuan wajib diisi" },
        { status: 400 }
      );
    }

    const parsedQty = parseFloat(qty) || 1;
    const parsedUnitPrice = parseFloat(unitPrice) || 0;
    const totalPrice = parsedQty * parsedUnitPrice;

    // Find the latest seqNo in this month
    const latest = await prisma.rabItem.findFirst({
      where: { month },
      orderBy: { seqNo: "desc" },
    });
    const nextSeq = (latest?.seqNo || 0) + 1;

    const newItem = await prisma.rabItem.create({
      data: {
        month: month.trim().toUpperCase(),
        year: 2026,
        seqNo: nextSeq,
        name: name.trim(),
        qty: parsedQty,
        unit: unit?.trim() || "Pcs",
        unitPrice: parsedUnitPrice,
        totalPrice,
        notes: notes?.trim() || null,
        fundedBy: fundedBy?.trim() || "DCC",
        status: "PLANNED",
      },
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/rab error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/rab
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID wajib disertakan" }, { status: 400 });
    }

    await prisma.rabItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/rab error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
