"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ShoppingBag,
  RefreshCw,
  Plus,
  Store,
  Sparkles,
  Check,
  ChevronRight,
  Receipt,
  User,
  Banknote,
  QrCode,
  ArrowRight,
} from "lucide-react";
import { formatRupiah, formatDateTime, getStatusBadge, getPaymentBadge } from "@/lib/format";
import ReceiptModal from "@/components/ReceiptModal";

export default function BazaarOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("ongoing");
  const [statusTab, setStatusTab] = useState<"all" | "diproses" | "selesai">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000); // Polling auto-refresh every 15s during busy bazaar
    return () => clearInterval(interval);
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvents(data);
        const ongoing = data.find((e: any) => e.status === "ongoing");
        if (ongoing) {
          setSelectedEventId(ongoing.id);
        } else if (data.length > 0) {
          setSelectedEventId(data[0].id);
        } else {
          setSelectedEventId("all");
        }
      }
    } catch (err) {
      console.error("Gagal memuat event:", err);
    }
  };

  const loadOrders = async () => {
    try {
      let url = "/api/orders?sort=desc";
      if (selectedEventId && selectedEventId !== "all" && selectedEventId !== "ongoing") {
        url += `&eventId=${selectedEventId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Gagal memuat pesanan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          status: "selesai",
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "selesai" } : o))
        );
      } else {
        alert("Gagal memperbarui status pesanan");
      }
    } catch {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setUpdatingId(null);
    }
  };

  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId);
  }, [events, selectedEventId]);

  // Filter orders by event, tab, and search
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Event filter
      if (selectedEventId && selectedEventId !== "all" && selectedEventId !== "ongoing") {
        if (o.eventId !== selectedEventId) return false;
      }

      // Status tab
      if (statusTab === "diproses" && o.status !== "diproses") return false;
      if (statusTab === "selesai" && o.status !== "selesai") return false;

      // Exclude voided orders from live queue
      if (o.isVoided) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = o.orderNumber?.toLowerCase().includes(q);
        const matchCust = (o.customerName || o.customer?.name || "")
          .toLowerCase()
          .includes(q);
        const matchItems = o.items?.some((it: any) =>
          it.product?.name?.toLowerCase().includes(q)
        );
        return matchNumber || matchCust || matchItems;
      }

      return true;
    });
  }, [orders, selectedEventId, statusTab, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const relevant = orders.filter((o) => {
      if (selectedEventId && selectedEventId !== "all" && selectedEventId !== "ongoing") {
        return o.eventId === selectedEventId && !o.isVoided;
      }
      return !o.isVoided;
    });

    const totalRevenue = relevant.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalItems = relevant.reduce(
      (sum, o) => sum + (o.items?.reduce((s: number, it: any) => s + it.qty, 0) || 0),
      0
    );
    const processingCount = relevant.filter((o) => o.status === "diproses").length;
    const completedCount = relevant.filter((o) => o.status === "selesai").length;

    return { totalRevenue, totalItems, processingCount, completedCount, totalOrders: relevant.length };
  }, [orders, selectedEventId]);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-700 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Bazaar Feed
            </span>
            <span className="text-xs text-slate-400">&bull; Auto-refresh aktif</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="h-6 w-6 text-amber-600" />
            <span>Pesanan Bazaar Hari Ini</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Antrean pesanan booth live, status penyajian barista, dan cetak ulang struk tanpa tercampur histori pembukuan umum
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Event Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs">
            <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Lokasi Event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} {ev.status === "ongoing" ? "🟢 (Ongoing)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Quick POS Button */}
          <Link
            href="/pos"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>+ Input Pesanan (POS)</span>
          </Link>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Omzet Bazaar Ini</div>
          <div className="text-lg sm:text-xl font-black text-amber-600 mt-1 font-mono">
            {formatRupiah(stats.totalRevenue)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{stats.totalOrders} total transaksi</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item / Cup Terjual</div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-1 font-mono">
            {stats.totalItems} <span className="text-xs font-semibold text-slate-500">cup</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Produk booth bazaar</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Sedang Diracik</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-600 mt-1 font-mono">
            {stats.processingCount} <span className="text-xs font-semibold text-amber-600">antrean</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Menunggu penyajian</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Selesai / Diambil</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-700 mt-1 font-mono">
            {stats.completedCount} <span className="text-xs font-semibold text-emerald-600">pesanan</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sudah diserahkan</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setStatusTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusTab === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua ({stats.totalOrders})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("diproses")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusTab === "diproses"
                ? "bg-amber-500 text-slate-950 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🟡 Sedang Diracik ({stats.processingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusTab("selesai")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusTab === "selesai"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🟢 Selesai ({stats.completedCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pembeli, no struk, menu..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Orders List / Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200/80">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-500 mb-2" />
          <span>Memuat antrean pesanan bazaar...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Belum ada pesanan bazaar yang sesuai</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Pesanan yang diinput melalui kasir direct saat event bazaar akan otomatis tampil di sini secara live.
            </p>
          </div>
          <Link
            href="/pos"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Buka Kasir & Buat Pesanan Baru</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isProcessing = order.status === "diproses";
            const custName = order.customerName || order.customer?.name || "Pelanggan Booth";
            const payment = order.payments?.[0];
            const methodLabel = payment?.method === "qris" ? "QRIS" : payment?.method === "transfer" ? "Transfer" : "Tunai";

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl border transition shadow-xs flex flex-col justify-between overflow-hidden ${
                  isProcessing
                    ? "border-amber-400/80 shadow-amber-500/5 ring-1 ring-amber-400/40"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                {/* Order Card Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-xs text-slate-900">
                        {order.orderNumber}
                      </span>
                      {order.orderSource === "PO" && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                          Pre-Order
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{formatDateTime(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    {isProcessing ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-2xs animate-pulse">
                        🟡 Sedang Diracik
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        <Check className="h-3 w-3" />
                        <span>Selesai</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Info & Order Items */}
                <div className="p-4 space-y-3 flex-1">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 truncate">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{custName}</span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-500">
                      {order.event?.name || "Booth Mandiri"}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {order.items?.map((it: any) => (
                      <div key={it.id} className="text-xs flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <span className="font-bold text-slate-900">{it.qty}x </span>
                          <span className="text-slate-800 font-medium">{it.product?.name}</span>
                          {it.notes && (
                            <div className="text-[10px] text-amber-700 font-medium italic mt-0.5">
                              Catatan: {it.notes}
                            </div>
                          )}
                        </div>
                        <span className="text-slate-600 font-mono text-[11px] shrink-0">
                          {formatRupiah(it.price * it.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Total, Payment & Actions */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Bayar</span>
                      <span className="text-base font-black text-amber-600 font-mono">
                        {formatRupiah(order.totalAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Metode</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        {methodLabel === "QRIS" ? (
                          <QrCode className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Banknote className="h-3 w-3 text-amber-600" />
                        )}
                        <span>{methodLabel}</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    {isProcessing && (
                      <button
                        type="button"
                        disabled={updatingId === order.id}
                        onClick={() => handleMarkComplete(order.id)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        <span>{updatingId === order.id ? "Menyimpan..." : "Tandai Selesai"}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedReceiptOrder(order)}
                      className={`py-2 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                        !isProcessing ? "flex-1" : ""
                      }`}
                      title="Cetak Ulang Struk"
                    >
                      <Printer className="h-3.5 w-3.5 text-slate-600" />
                      <span>Struk</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Thermal Receipt Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
}
