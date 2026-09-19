import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cashflow
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // "1" - "12" or "all"
    const year = searchParams.get("year") || "2026";
    const type = searchParams.get("type"); // "MASUK" | "KELUAR" | "all"
    const category = searchParams.get("category"); // "PENJUALAN", etc.
    const search = searchParams.get("search");

    const where: any = {};

    if (type && type !== "all") {
      where.type = type;
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { cashier: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by month/year if specified
    if (month && month !== "all") {
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const records = await prisma.cashRecord.findMany({
      where,
      orderBy: [{ date: "asc" }, { seqNo: "asc" }],
    });

    // Overall stats (regardless of filter)
    const allRecords = await prisma.cashRecord.findMany({
      orderBy: [{ date: "asc" }, { seqNo: "asc" }],
    });

    let totalMasuk = 0;
    let totalKeluar = 0;
    const categoryStats: Record<string, { masuk: number; keluar: number }> = {};
    const monthlyStats: Record<string, { masuk: number; keluar: number; balance: number }> = {};

    for (const r of allRecords) {
      if (r.type === "MASUK") totalMasuk += r.amount;
      if (r.type === "KELUAR") totalKeluar += r.amount;

      // Category breakdown
      if (!categoryStats[r.category]) {
        categoryStats[r.category] = { masuk: 0, keluar: 0 };
      }
      if (r.type === "MASUK") categoryStats[r.category].masuk += r.amount;
      if (r.type === "KELUAR") categoryStats[r.category].keluar += r.amount;

      // Monthly breakdown
      const mKey = `${r.date.getUTCFullYear()}-${String(r.date.getUTCMonth() + 1).padStart(2, "0")}`;
      if (!monthlyStats[mKey]) {
        monthlyStats[mKey] = { masuk: 0, keluar: 0, balance: 0 };
      }
      if (r.type === "MASUK") monthlyStats[mKey].masuk += r.amount;
      if (r.type === "KELUAR") monthlyStats[mKey].keluar += r.amount;
      monthlyStats[mKey].balance = r.balance;
    }

    // Get latest cash balance
    const latestRecord = allRecords[allRecords.length - 1];
    const currentBalance = latestRecord ? latestRecord.balance : 0;

    return NextResponse.json({
      records,
      summary: {
        currentBalance,
        totalMasuk,
        totalKeluar,
        netCashFlow: totalMasuk - totalKeluar,
        totalTransactions: allRecords.length,
        categoryStats,
        monthlyStats,
      },
    });
  } catch (error: any) {
    console.error("GET /api/cashflow error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/cashflow
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, category, amount, notes, cashier, date } = body;

    if (!name || !type || !category || amount === undefined) {
      return NextResponse.json(
        { error: "Nama, tipe (MASUK/KELUAR), kategori, dan nominal wajib diisi" },
        { status: 400 }
      );
    }

    const parsedAmount = Math.abs(parseFloat(amount));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal harus berupa angka lebih dari 0" },
        { status: 400 }
      );
    }

    // Find the latest record to compute seqNo and running balance
    const latestRecord = await prisma.cashRecord.findFirst({
      orderBy: [{ date: "desc" }, { seqNo: "desc" }],
    });

    const lastBalance = latestRecord ? latestRecord.balance : 0;
    const lastSeqNo = latestRecord?.seqNo ? latestRecord.seqNo : 0;

    const newBalance =
      type === "MASUK"
        ? lastBalance + parsedAmount
        : lastBalance - parsedAmount;

    const recordDate = date ? new Date(date) : new Date();

    const newRecord = await prisma.cashRecord.create({
      data: {
        seqNo: lastSeqNo + 1,
        date: recordDate,
        name: name.trim(),
        type,
        category,
        amount: parsedAmount,
        balance: newBalance,
        notes: notes?.trim() || null,
        cashier: cashier?.trim() || null,
      },
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/cashflow error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/cashflow
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID wajib disertakan" }, { status: 400 });
    }

    await prisma.cashRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/cashflow error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
