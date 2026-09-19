import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { method, amount, isDownPayment } = body;

    if (!id || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Nominal pembayaran wajib lebih dari 0" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    if (order.isVoided) {
      return NextResponse.json({ error: "Order yang sudah dibatalkan tidak dapat dibayar" }, { status: 400 });
    }

    // Catat payment baru
    await prisma.payment.create({
      data: {
        orderId: id,
        method: method || "cash",
        amount: Number(amount),
        isDownPayment: Boolean(isDownPayment),
        paidAt: new Date(),
      },
    });

    // Ambil order terbaru dengan semua pembayaran
    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        event: true,
        voucher: true,
        items: { include: { product: true } },
        payments: true,
      },
    });

    const totalPaid = updatedOrder?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;
    const isFullyPaid = totalPaid >= (updatedOrder?.totalAmount || 0);

    return NextResponse.json({
      order: updatedOrder,
      totalPaid,
      remainingAmount: Math.max(0, (updatedOrder?.totalAmount || 0) - totalPaid),
      isFullyPaid,
      message: isFullyPaid ? "Pembayaran lunas!" : "Pembayaran berhasil dicatat",
    });
  } catch (error) {
    console.error("Failed to record payment:", error);
    return NextResponse.json({ error: "Gagal mencatat pembayaran" }, { status: 500 });
  }
}
