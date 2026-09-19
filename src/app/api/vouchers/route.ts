import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/vouchers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const validateCode = searchParams.get("validate");
    const amount = Number(searchParams.get("amount") || 0);

    // Endpoint khusus validasi voucher saat kasir checkout
    if (validateCode) {
      const voucher = await prisma.voucher.findUnique({
        where: { code: validateCode.trim().toUpperCase() },
      });

      if (!voucher) {
        return NextResponse.json({ valid: false, message: "Kode voucher tidak ditemukan" }, { status: 404 });
      }

      if (!voucher.isActive) {
        return NextResponse.json({ valid: false, message: "Voucher sedang dinonaktifkan" }, { status: 400 });
      }

      const now = new Date();
      if (now < new Date(voucher.startDate)) {
        return NextResponse.json({ valid: false, message: "Voucher belum mulai berlaku" }, { status: 400 });
      }
      if (now > new Date(voucher.endDate)) {
        return NextResponse.json({ valid: false, message: "Voucher sudah kedaluwarsa" }, { status: 400 });
      }

      if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
        return NextResponse.json({ valid: false, message: "Kuota pemakaian voucher telah habis" }, { status: 400 });
      }

      if (voucher.minPurchase && amount < voucher.minPurchase) {
        return NextResponse.json({
          valid: false,
          message: `Minimal pembelian Rp ${voucher.minPurchase.toLocaleString("id-ID")}`,
        }, { status: 400 });
      }

      // Hitung nominal diskon
      let discount = 0;
      if (voucher.type === "percentage") {
        discount = (amount * voucher.value) / 100;
        if (voucher.maxDiscount && discount > voucher.maxDiscount) {
          discount = voucher.maxDiscount;
        }
      } else {
        discount = Math.min(voucher.value, amount);
      }

      return NextResponse.json({
        valid: true,
        voucher,
        calculatedDiscount: discount,
        message: "Voucher berhasil digunakan!",
      });
    }

    const vouchers = await prisma.voucher.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error("Failed to fetch vouchers:", error);
    return NextResponse.json({ error: "Gagal mengambil data voucher" }, { status: 500 });
  }
}

// POST /api/vouchers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, type, value, minPurchase, maxDiscount, startDate, endDate, usageLimit, isActive } = body;

    if (!code?.trim() || !type || value === undefined || !startDate || !endDate) {
      return NextResponse.json({ error: "Kode, tipe, nilai, dan periode tanggal wajib diisi" }, { status: 400 });
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: code.trim().toUpperCase(),
        type, // percentage or nominal
        value: Number(value),
        minPurchase: minPurchase ? Number(minPurchase) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        usageLimit: usageLimit ? Number(usageLimit) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json(voucher, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create voucher:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Kode voucher tersebut sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal membuat voucher" }, { status: 500 });
  }
}

// PUT /api/vouchers
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, code, type, value, minPurchase, maxDiscount, startDate, endDate, usageLimit, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID voucher wajib disertakan" }, { status: 400 });
    }

    const updated = await prisma.voucher.update({
      where: { id },
      data: {
        ...(code && { code: code.trim().toUpperCase() }),
        ...(type && { type }),
        ...(value !== undefined && { value: Number(value) }),
        minPurchase: minPurchase !== undefined ? (minPurchase ? Number(minPurchase) : null) : undefined,
        maxDiscount: maxDiscount !== undefined ? (maxDiscount ? Number(maxDiscount) : null) : undefined,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        usageLimit: usageLimit !== undefined ? (usageLimit ? Number(usageLimit) : null) : undefined,
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update voucher:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Kode voucher tersebut sudah digunakan" }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal memperbarui voucher" }, { status: 500 });
  }
}

// DELETE /api/vouchers
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID voucher wajib disertakan" }, { status: 400 });
    }

    await prisma.voucher.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Voucher berhasil dihapus" });
  } catch (error) {
    console.error("Failed to delete voucher:", error);
    return NextResponse.json({ error: "Gagal menghapus voucher" }, { status: 500 });
  }
}
