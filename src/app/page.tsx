"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRupiah, formatDateTime, formatDate, getStatusBadge, getPaymentBadge } from "@/lib/format";
import {
  Store,
  DollarSign,
  ShoppingCart,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  Calendar,
  CheckCircle,
  TrendingUp,
  MapPin,
  ChevronRight,
  Boxes,
} from "lucide-react";
import ReceiptModal from "@/components/ReceiptModal";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [ongoingEvent, setOngoingEvent] = useState<any>(null);
  const [upcomingEvent, setUpcomingEvent] = useState<any>(null);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);
  const [pendingPO, setPendingPO] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Events
      const evRes = await fetch("/api/events");
      const evData = await evRes.json();
      if (Array.isArray(evData)) {
        setOngoingEvent(evData.find((e: any) => e.status === "ongoing") || null);
        setUpcomingEvent(evData.find((e: any) => e.status === "upcoming") || null);
      }

      // 2. Fetch Orders
      const ordRes = await fetch("/api/orders");
      const ordData = await ordRes.json();
      if (Array.isArray(ordData)) {
        const todayStr = new Date().toISOString().split("T")[0];
        const activeOrders = ordData.filter((o: any) => !o.isVoided);

        // Filter order hari ini
        const todayOrders = activeOrders.filter((o: any) => {
          const ordDate = new Date(o.createdAt).toISOString().split("T")[0];
          return ordDate === todayStr;
        });

        const rev = todayOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
        setTodayRevenue(rev);
        setTodayOrdersCount(todayOrders.length);

        // Filter PO yang belum selesai (pending, diproses, siap diambil)
        const unfulfilledPO = activeOrders.filter(
          (o: any) => o.orderSource === "PO" && o.status !== "selesai" && o.status !== "dibatalkan"
        );
        setPendingPO(unfulfilledPO.slice(0, 5));
        setRecentOrders(activeOrders.slice(0, 6));
      }

      // 3. Fetch Stock
      const stockRes = await fetch("/api/stock");
      const stockData = await stockRes.json();
      if (stockData.lowStockProducts) {
        setLowStockProducts(stockData.lowStockProducts);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard Booth</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan operasional bazaar event dan pesanan Pre-Order hari ini
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/stock"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs transition"
          >
            <Boxes className="h-4 w-4 text-slate-500" />
            Alokasi Stok
          </Link>
          <Link
            href="/po"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 shadow-xs transition"
          >
            <PlusCircle className="h-4 w-4" />
            Buat PO Baru
          </Link>
          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-600 shadow-xs transition"
          >
            <ShoppingCart className="h-4 w-4" />
            Buka Kasir POS
          </Link>
        </div>
      </div>

      {/* Ongoing Event Hero Banner */}
      {ongoingEvent ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-emerald-100 mb-2">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                EVENT BAZAAR AKTIF SEKARANG
              </div>
              <h2 className="text-xl md:text-2xl font-black">{ongoingEvent.name}</h2>
              <div className="flex items-center gap-2 text-xs text-emerald-100 mt-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>{ongoingEvent.location}</span>
                <span>•</span>
                <span>{formatDate(ongoingEvent.startDate)} - {formatDate(ongoingEvent.endDate)}</span>
              </div>
              {ongoingEvent.notes && (
                <p className="text-xs text-emerald-100/90 mt-2 italic bg-black/10 p-2 rounded-lg inline-block">
                  Catatan: {ongoingEvent.notes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/pos"
                className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-xs hover:bg-emerald-50 transition shadow-md flex items-center gap-1.5"
              >
                <ShoppingCart className="h-4 w-4" />
                Mulai Transaksi di Booth
              </Link>
              <Link
                href="/events"
                className="px-3 py-2.5 rounded-xl bg-emerald-800/60 text-white text-xs font-semibold hover:bg-emerald-800 transition"
              >
                Detail Event
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800">Tidak ada event bazaar yang sedang berjalan</h3>
              <p className="text-xs text-slate-500">
                {upcomingEvent
                  ? `Event berikutnya: ${upcomingEvent.name} (${formatDate(upcomingEvent.startDate)})`
                  : "Tambahkan event bazaar baru untuk mulai alokasi stok dan penjualan booth."}
              </p>
            </div>
          </div>
          <Link
            href="/events"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            Kelola Event <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Hari Ini */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Omzet Hari Ini
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {formatRupiah(todayRevenue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {todayOrdersCount} transaksi tercatat hari ini
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* PO Belum Diambil / Siap */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              PO Belum Diambil
            </span>
            <div className="text-2xl font-black text-violet-600 mt-1">
              {pendingPO.length} <span className="text-sm font-medium text-slate-500">pesanan</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Perlu disiapkan / siap pickup
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Alert Stok Menipis */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Alert Stok Menipis
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {lowStockProducts.length} <span className="text-sm font-medium text-slate-500">menu</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Stok tersisa ≤ 10 unit
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Total Event Berjalan */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Status Booth
            </span>
            <div className="text-lg font-black text-slate-900 mt-1 truncate max-w-[150px]">
              {ongoingEvent ? ongoingEvent.name : "Non-Event"}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              ● POS Siap Beroperasi
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Store className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Pending POs & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pre-Orders Pending Pickup */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900">Pre-Order (PO) yang Harus Dipantau</h2>
              <p className="text-xs text-slate-500">Pesanan masuk lewat WhatsApp yang perlu disiapkan atau diambil</p>
            </div>
            <Link
              href="/po"
              className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              Lihat Semua PO <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {pendingPO.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Tidak ada antrean pesanan PO saat ini.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPO.map((order) => {
                const statusBadge = getStatusBadge(order.status);
                const paymentBadge = getPaymentBadge(order.paymentStatus);

                return (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 hover:border-violet-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{order.orderNumber}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${paymentBadge.bg}`}>
                          {paymentBadge.label}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 mt-1 font-medium">
                        Pelanggan: <strong className="text-slate-900">{order.customer?.name || "Customer"}</strong> (
                        {order.customer?.phoneNumber})
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Ambil: {formatDate(order.pickupDate)}</span>
                        <span>•</span>
                        <span className="capitalize">{order.pickupMethod || "Event / COD"}</span>
                        <span>•</span>
                        <span>{order.items?.length || 0} item</span>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                      <div className="text-sm font-bold text-slate-900">
                        {formatRupiah(order.totalAmount)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          Invoice / WA
                        </button>
                        <Link
                          href="/po"
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700"
                        >
                          Kelola
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Alert Stok Menipis & Quick Info */}
        <div className="space-y-6">
          {/* Low Stock Widget */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="font-bold text-sm text-slate-900">Stok Menipis</h3>
              </div>
              <Link href="/stock" className="text-xs font-semibold text-amber-600 hover:underline">
                Kelola
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Semua stok produk dalam kondisi aman (di atas 10 unit).
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.category?.name}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-700 text-sm">{p.stock}</span>{" "}
                      <span className="text-[11px] text-slate-500">{p.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
            <h3 className="font-bold text-sm mb-1">Akses Cepat Kasir Booth</h3>
            <p className="text-xs text-slate-300 mb-4">
              Langsung layani pembeli di booth bazaar dengan sistem kasir cepat.
            </p>
            <Link
              href="/pos"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
            >
              <ShoppingCart className="h-4 w-4" />
              Buka Layar Kasir (POS)
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-base text-slate-900">Transaksi Terbaru</h2>
            <p className="text-xs text-slate-500">Riwayat transaksi kasir dan pesanan Pre-Order terakhir</p>
          </div>
          <Link
            href="/reports"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            Semua Laporan <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No. Order</th>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Sumber</th>
                <th className="py-2.5 px-3">Event / Customer</th>
                <th className="py-2.5 px-3">Total</th>
                <th className="py-2.5 px-3">Status Bayar</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrders.map((order) => {
                const paymentBadge = getPaymentBadge(order.paymentStatus);
                return (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">{order.orderNumber}</td>
                    <td className="py-3 px-3 text-slate-500">{formatDateTime(order.createdAt)}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.orderSource === "PO"
                            ? "bg-violet-100 text-violet-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.orderSource}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {order.orderSource === "PO" ? order.customer?.name || "Customer" : order.event?.name || "Kasir Booth"}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {formatRupiah(order.totalAmount)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${paymentBadge.bg}`}>
                        {paymentBadge.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedReceiptOrder(order)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        Struk
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Struk Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
}
