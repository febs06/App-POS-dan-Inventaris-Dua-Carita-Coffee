import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeProductName } from "@/lib/format";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "30"; // 7, 14, 30, 90 days

    const days = parseInt(range, 10) || 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Ambil semua order aktif (tidak void)
    const orders = await prisma.order.findMany({
      where: {
        isVoided: false,
        createdAt: { gte: sinceDate },
      },
      include: {
        event: true,
        customer: true,
        voucher: true,
        payments: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 1. Stat Cards
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const totalDiscount = orders.reduce((sum, o) => sum + o.discountAmount, 0);

    // Hitung total modal (cost) & estimasi laba kotor
    let totalCost = 0;
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!item.isVoided) {
          totalCost += item.qty * (item.product?.cost || 0);
        }
      });
    });
    const grossProfit = totalRevenue - totalCost;

    // 2. Trend Omzet per Tanggal (Line Chart)
    const revenueMap: Record<string, { date: string; direct: number; po: number; total: number }> = {};
    orders.forEach((o) => {
      const d = new Date(o.createdAt).toISOString().split("T")[0];
      if (!revenueMap[d]) {
        revenueMap[d] = { date: d, direct: 0, po: 0, total: 0 };
      }
      if (o.orderSource === "DIRECT") {
        revenueMap[d].direct += o.totalAmount;
      } else {
        revenueMap[d].po += o.totalAmount;
      }
      revenueMap[d].total += o.totalAmount;
    });
    const revenueTrend = Object.values(revenueMap).sort((a, b) => a.date.localeCompare(b.date));

    // 3. Perbandingan Performa PO vs Direct
    let poRevenue = 0;
    let directRevenue = 0;
    let poCount = 0;
    let directCount = 0;

    orders.forEach((o) => {
      if (o.orderSource === "PO") {
        poRevenue += o.totalAmount;
        poCount++;
      } else {
        directRevenue += o.totalAmount;
        directCount++;
      }
    });

    const sourceComparison = [
      { name: "Pre-Order (PO)", revenue: poRevenue, count: poCount, color: "#8b5cf6" },
      { name: "Direct Booth (Kasir)", revenue: directRevenue, count: directCount, color: "#f59e0b" },
    ];

    // 4. Perbandingan Event (Bar Chart)
    const eventMap: Record<string, { name: string; revenue: number; orders: number }> = {};
    orders.forEach((o) => {
      const evName = o.event ? o.event.name : "Non-Event / PO Lepas";
      if (!eventMap[evName]) {
        eventMap[evName] = { name: evName, revenue: 0, orders: 0 };
      }
      eventMap[evName].revenue += o.totalAmount;
      eventMap[evName].orders += 1;
    });
    const eventComparison = Object.values(eventMap).sort((a, b) => b.revenue - a.revenue);

    // 5. Produk Terlaris (Top 8 - Agregasi nama dasar tanpa varian ukuran)
    const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!item.isVoided) {
          const rawName = item.product?.name || "Produk";
          const pName = normalizeProductName(rawName);
          if (!productMap[pName]) {
            productMap[pName] = { name: pName, qty: 0, revenue: 0 };
          }
          productMap[pName].qty += item.qty;
          productMap[pName].revenue += item.qty * item.price;
        }
      });
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);

    // 6. Distribusi Metode Pembayaran
    const paymentMap: Record<string, number> = { cash: 0, qris: 0, transfer: 0 };
    orders.forEach((o) => {
      o.payments.forEach((p) => {
        const method = (p.method || "cash").toLowerCase();
        paymentMap[method] = (paymentMap[method] || 0) + p.amount;
      });
    });
    const paymentDistribution = [
      { name: "QRIS", value: paymentMap.qris || 0, color: "#0ea5e9" },
      { name: "Tunai (Cash)", value: paymentMap.cash || 0, color: "#10b981" },
      { name: "Transfer Bank", value: paymentMap.transfer || 0, color: "#6366f1" },
    ].filter((p) => p.value > 0);

    // 7. Efektivitas Voucher
    const voucherMap: Record<string, { code: string; count: number; totalDiscount: number }> = {};
    orders.forEach((o) => {
      if (o.voucher) {
        const vCode = o.voucher.code;
        if (!voucherMap[vCode]) {
          voucherMap[vCode] = { code: vCode, count: 0, totalDiscount: 0 };
        }
        voucherMap[vCode].count += 1;
        voucherMap[vCode].totalDiscount += o.discountAmount;
      }
    });
    const voucherStats = Object.values(voucherMap);

    // 8. Rekapitulasi & Analisis Omzet Bulanan (Januari - Desember)
    const yearParam = searchParams.get("year");
    const currentYear = new Date().getFullYear();
    const targetYear = parseInt(yearParam || "", 10) || currentYear;

    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const yearOrders = await prisma.order.findMany({
      where: {
        isVoided: false,
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    const monthShorts = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
    ];

    const monthlyData = monthNames.map((name, idx) => ({
      monthIndex: idx,
      monthName: name,
      monthShort: monthShorts[idx],
      grossRevenue: 0,
      discount: 0,
      netRevenue: 0,
      ordersCount: 0,
      avgTicket: 0,
      directRevenue: 0,
      poRevenue: 0,
      momGrowth: 0,
    }));

    yearOrders.forEach((o) => {
      const orderDate = new Date(o.createdAt);
      const mIdx = orderDate.getMonth();
      if (monthlyData[mIdx]) {
        monthlyData[mIdx].netRevenue += o.totalAmount;
        monthlyData[mIdx].discount += o.discountAmount;
        monthlyData[mIdx].grossRevenue += o.totalAmount + o.discountAmount;
        monthlyData[mIdx].ordersCount += 1;
        if (o.orderSource === "DIRECT") {
          monthlyData[mIdx].directRevenue += o.totalAmount;
        } else {
          monthlyData[mIdx].poRevenue += o.totalAmount;
        }
      }
    });

    // Hitung rata-rata ticket dan pertumbuhan MoM
    for (let i = 0; i < monthlyData.length; i++) {
      if (monthlyData[i].ordersCount > 0) {
        monthlyData[i].avgTicket = Math.round(
          monthlyData[i].netRevenue / monthlyData[i].ordersCount
        );
      }
      if (i > 0 && monthlyData[i - 1].netRevenue > 0) {
        const diff = monthlyData[i].netRevenue - monthlyData[i - 1].netRevenue;
        monthlyData[i].momGrowth = Math.round((diff / monthlyData[i - 1].netRevenue) * 100);
      }
    }

    const annualTotalRevenue = monthlyData.reduce((sum, m) => sum + m.netRevenue, 0);
    const annualTotalOrders = monthlyData.reduce((sum, m) => sum + m.ordersCount, 0);
    const activeMonthsCount = monthlyData.filter((m) => m.ordersCount > 0).length || 1;
    const averageMonthlyRevenue = Math.round(annualTotalRevenue / activeMonthsCount);

    let bestMonth = monthlyData[0];
    monthlyData.forEach((m) => {
      if (m.netRevenue > bestMonth.netRevenue) {
        bestMonth = m;
      }
    });

    const monthlySummary = {
      selectedYear: targetYear,
      annualTotalRevenue,
      annualTotalOrders,
      averageMonthlyRevenue,
      bestMonthName: bestMonth.netRevenue > 0 ? bestMonth.monthName : "-",
      bestMonthRevenue: bestMonth.netRevenue,
    };

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        totalDiscount,
        grossProfit,
      },
      revenueTrend,
      sourceComparison,
      eventComparison,
      topProducts,
      paymentDistribution,
      voucherStats,
      monthlyRevenue: monthlyData,
      monthlySummary,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Gagal mengambil data analitik" }, { status: 500 });
  }
}
