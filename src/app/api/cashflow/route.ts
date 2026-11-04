import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/cashflow
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const account = searchParams.get("account"); // "CASH" | "QRIS" | "all"
    const month = searchParams.get("month"); // "1" - "12" or "all"
    const year = searchParams.get("year") || "2026";
    const type = searchParams.get("type"); // "MASUK" | "KELUAR" | "all"
    const category = searchParams.get("category"); // "PENJUALAN", etc.
    const search = searchParams.get("search");

    const where: any = {};

    if (account && account !== "all") {
      where.account = account;
    }

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
      let monthNum: number;
      let yearNum: number;
      if (month.includes("-")) {
        const parts = month.split("-");
        yearNum = parseInt(parts[0], 10);
        monthNum = parseInt(parts[1], 10);
      } else {
        monthNum = parseInt(month, 10);
        yearNum = parseInt(year, 10);
      }
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

    // Compute overall stats across all records for CASH and QRIS
    const allCashRecords = await prisma.cashRecord.findMany({
      where: { account: "CASH" },
      orderBy: [{ date: "asc" }, { seqNo: "asc" }],
    });

    const allQrisRecords = await prisma.cashRecord.findMany({
      where: { account: "QRIS" },
      orderBy: [{ date: "asc" }, { seqNo: "asc" }],
    });

    const latestCash = allCashRecords[allCashRecords.length - 1];
    const latestQris = allQrisRecords[allQrisRecords.length - 1];

    const cashBalance = latestCash ? latestCash.balance : 0;
    const qrisBalance = latestQris ? latestQris.balance : 0;
    const totalLiquidity = cashBalance + qrisBalance;

    // Subtotal for currently filtered records
    let filteredMasuk = 0;
    let filteredKeluar = 0;
    for (const r of records) {
      if (r.type === "MASUK") filteredMasuk += r.amount;
      if (r.type === "KELUAR") filteredKeluar += r.amount;
    }

    // Determine current display balance
    let currentBalance = totalLiquidity;
    if (account === "CASH") currentBalance = cashBalance;
    if (account === "QRIS") currentBalance = qrisBalance;

    // Indonesian Month Names
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    // Compute distinct months present across all records
    const allRecordsDates = await prisma.cashRecord.findMany({
      select: { date: true },
      orderBy: { date: "asc" },
    });

    const monthsMap = new Map<string, { label: string; value: string; year: number; month: number }>();

    // Baseline: April to December 2026
    for (let m = 4; m <= 12; m++) {
      const key = `2026-${m}`;
      monthsMap.set(key, {
        label: `${monthNames[m - 1]} 2026`,
        value: String(m),
        year: 2026,
        month: m,
      });
    }

    // Include any other months found from records (e.g. 2027 or earlier months)
    for (const r of allRecordsDates) {
      const d = new Date(r.date);
      const m = d.getUTCMonth() + 1;
      const y = d.getUTCFullYear();
      const key = `${y}-${m}`;
      if (!monthsMap.has(key)) {
        monthsMap.set(key, {
          label: `${monthNames[m - 1]} ${y}`,
          value: y === 2026 ? String(m) : key,
          year: y,
          month: m,
        });
      }
    }

    const availableMonths = [
      { label: "Semua Bulan", value: "all" },
      ...Array.from(monthsMap.values()).sort((a, b) => a.year - b.year || a.month - b.month)
    ];

    return NextResponse.json({
      records,
      summary: {
        currentBalance,
        cashBalance,
        qrisBalance,
        totalLiquidity,
        latestCashDate: latestCash ? latestCash.date : null,
        latestQrisDate: latestQris ? latestQris.date : null,
        totalCashCount: allCashRecords.length,
        totalQrisCount: allQrisRecords.length,
        totalMasuk: filteredMasuk,
        totalKeluar: filteredKeluar,
        netCashFlow: filteredMasuk - filteredKeluar,
        totalTransactions: records.length,
        availableMonths,
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
    const { account = "CASH", name, type, category, amount, notes, cashier, date } = body;

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

    const accountType = account === "QRIS" ? "QRIS" : "CASH";

    // Find the latest record of this specific account to compute seqNo and running balance
    const latestRecord = await prisma.cashRecord.findFirst({
      where: { account: accountType },
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
        account: accountType,
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
