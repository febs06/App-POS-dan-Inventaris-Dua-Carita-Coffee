"use client";

import { useEffect, useState } from "react";
import { formatRupiah, formatDateTime, formatDate, getStatusBadge, getPaymentBadge } from "@/lib/format";
import {
  FileText,
  Filter,
  Search,
  Printer,
  Ban,
  Calendar,
  DollarSign,
  TrendingUp,
  Download,
  AlertCircle,
  Eye,
  Trash2,
} from "lucide-react";
import ReceiptModal from "@/components/ReceiptModal";
import VoidModal from "@/components/VoidModal";
import DeleteOrderModal from "@/components/DeleteOrderModal";


export default function ReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [orderSource, setOrderSource] = useState("all");
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any>(null);
  const [voidTargetOrder, setVoidTargetOrder] = useState<any>(null);
  const [deleteTargetOrder, setDeleteTargetOrder] = useState<any>(null);

  useEffect(() => {
    loadReports();
    loadEvents();
  }, [orderSource, selectedEventId, paymentStatus, statusFilter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      let url = "/api/orders?";
      if (orderSource !== "all") url += `&orderSource=${orderSource}`;
      if (selectedEventId !== "all") url += `&eventId=${selectedEventId}`;
      if (paymentStatus !== "all") url += `&paymentStatus=${paymentStatus}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (Array.isArray(data)) setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        loadReports();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Filter Search
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchNo = o.orderNumber?.toLowerCase().includes(q);
    const matchCust =
      o.customer?.name?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q);
    const matchEvent = o.event?.name?.toLowerCase().includes(q);
    return matchNo || matchCust || matchEvent;
  });

  // Aggregated Summary from filtered orders
  const activeOrders = filteredOrders.filter((o) => !o.isVoided);
  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalDiscount = activeOrders.reduce((sum, o) => sum + o.discountAmount, 0);
  const totalTransactions = activeOrders.length;
  const avgTicket = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;
  const voidCount = filteredOrders.filter((o) => o.isVoided).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Riwayat & Laporan Transaksi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit histori penjualan booth bazaar, status pelunasan PO, dan pembatalan transaksi
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          Cetak Rekap Laporan
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3 no-print">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Sumber Order */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Sumber Order</label>
            <select
              value={orderSource}
              onChange={(e) => setOrderSource(e.target.value)}
              className="w-full text-xs font-semibold bg-white text-slate-900 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">Semua Sumber (PO + Direct)</option>
              <option value="DIRECT">Direct Kasir Booth</option>
              <option value="PO">Pre-Order (PO)</option>
            </select>
          </div>

          {/* Event */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Event Bazaar</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full text-xs font-semibold bg-white text-slate-900 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">Semua Event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Status Pembayaran</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full text-xs font-semibold bg-white text-slate-900 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">Semua Status Bayar</option>
              <option value="lunas">Lunas</option>
              <option value="dp">Bayar DP</option>
              <option value="belum_bayar">Belum Bayar</option>
            </select>
          </div>

          {/* Order Status */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Status Order</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-white text-slate-900 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">Semua Status Order</option>
              <option value="selesai">Selesai</option>
              <option value="siap diambil">Siap Diambil</option>
              <option value="diproses">Diproses</option>
              <option value="pending">Menunggu</option>
              <option value="dibatalkan">Dibatalkan (Void)</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Cari No Order / Nama</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari..."
                className="w-full text-xs pl-8 pr-2.5 py-2 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Container */}
      <div id="printable-report" className="space-y-6">
        {/* Printable Official Header (Only visible on paper print) */}
        <div className="hidden print:block pb-4 border-b-2 border-slate-800">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                DUA CARITA COFFEE - REKAP LAPORAN TRANSAKSI & PENJUALAN
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Audit histori penjualan booth bazaar, status pelunasan PO, dan rekapitulasi omzet
              </p>
            </div>
            <div className="text-right text-xs text-slate-600">
              <div><strong>Waktu Cetak:</strong> {new Date().toLocaleString("id-ID")}</div>
              <div><strong>Total Order:</strong> {filteredOrders.length} Transaksi</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-700 bg-slate-100 p-2 rounded-lg border border-slate-200">
            <span><strong>Sumber:</strong> {orderSource === "all" ? "Semua (PO + Direct)" : orderSource}</span>
            <span><strong>Event:</strong> {selectedEventId === "all" ? "Semua Event" : (events.find((e) => e.id === selectedEventId)?.name || selectedEventId)}</span>
            <span><strong>Status Bayar:</strong> {paymentStatus === "all" ? "Semua" : paymentStatus}</span>
            <span><strong>Status Order:</strong> {statusFilter === "all" ? "Semua" : statusFilter}</span>
            {searchQuery && <span><strong>Pencarian:</strong> &quot;{searchQuery}&quot;</span>}
          </div>
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs print:border-slate-300 print:p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase print:text-[10px]">Total Omzet (Hasil Filter)</span>
            <div className="text-2xl font-black text-emerald-700 mt-1 print:text-lg">
              {formatRupiah(totalRevenue)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 print:text-slate-600">Dari {totalTransactions} order berhasil</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs print:border-slate-300 print:p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase print:text-[10px]">Total Diskon Diberikan</span>
            <div className="text-2xl font-black text-amber-600 mt-1 print:text-lg">
              {formatRupiah(totalDiscount)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 print:text-slate-600">Potongan voucher & diskon manual</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs print:border-slate-300 print:p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase print:text-[10px]">Rata-rata Nilai Order</span>
            <div className="text-2xl font-black text-slate-900 mt-1 print:text-lg">
              {formatRupiah(avgTicket)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 print:text-slate-600">Average ticket per transaksi</div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs print:border-slate-300 print:p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase print:text-[10px]">Transaksi Void / Batal</span>
            <div className="text-2xl font-black text-rose-600 mt-1 print:text-lg">
              {voidCount} <span className="text-xs font-medium text-slate-500">order</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 print:text-slate-600">Stok otomatis dikembalikan</div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Order</th>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Tipe</th>
                  <th className="py-3 px-3">Pelanggan / Event</th>
                  <th className="py-3 px-3">Item Pesanan</th>
                  <th className="py-3 px-3">Total Tagihan</th>
                  <th className="py-3 px-3">Status Bayar</th>
                  <th className="py-3 px-3">Status Order</th>
                  <th className="py-3 px-3 text-right no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Memuat data transaksi...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Tidak ada riwayat transaksi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const statusBadge = getStatusBadge(order.status);
                    const paymentBadge = getPaymentBadge(order.paymentStatus);
                    const isVoided = order.isVoided;

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-slate-50/60 transition ${
                          isVoided ? "bg-rose-50/20 text-slate-400" : ""
                        }`}
                      >
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {order.orderNumber}
                          {isVoided && (
                            <span className="block text-[10px] text-rose-600 font-medium">
                              [VOID: {order.voidReason}]
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-slate-500">
                          {formatDateTime(order.createdAt)}
                        </td>

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

                        <td className="py-3 px-3">
                          {order.orderSource === "PO" ? (
                            <div>
                              <div className="font-semibold text-slate-900">
                                {order.customer?.name || order.customerName || "Customer PO"}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {order.customer?.phoneNumber || "-"}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-semibold text-slate-900">
                                {order.customerName || "Pelanggan Umum"}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {order.event?.name || "Booth Mandiri"}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="text-[11px] text-slate-600 line-clamp-2 max-w-[200px]">
                            {order.items?.map((it: any) => `${it.product?.name} (${it.qty})`).join(", ")}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-bold text-slate-900">
                          {formatRupiah(order.totalAmount)}
                          {order.discountAmount > 0 && (
                            <span className="block text-[10px] text-emerald-600 font-normal">
                              Hemat {formatRupiah(order.discountAmount)}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${paymentBadge.bg}`}>
                            {paymentBadge.label}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadge.bg}`}>
                            {statusBadge.label}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right no-print">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isVoided && order.status === "diproses" && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, "selesai")}
                                className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] rounded-md transition shadow-2xs"
                                title="Tandai pesanan selesai dibuat/diserahkan"
                              >
                                ✓ Selesai
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedReceiptOrder(order)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Lihat Struk / Invoice"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>

                            {!isVoided && order.status !== "selesai" && (
                              <button
                                onClick={() => setVoidTargetOrder(order)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Batalkan / Void"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => setDeleteTargetOrder(order)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Transaksi Permanen"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Struk Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}

      {/* Void Modal */}
      {voidTargetOrder && (
        <VoidModal
          order={voidTargetOrder}
          isOpen={Boolean(voidTargetOrder)}
          onClose={() => setVoidTargetOrder(null)}
          onSuccess={loadReports}
        />
      )}

      {/* Delete Order Modal */}
      {deleteTargetOrder && (
        <DeleteOrderModal
          order={deleteTargetOrder}
          isOpen={Boolean(deleteTargetOrder)}
          onClose={() => setDeleteTargetOrder(null)}
          onSuccess={loadReports}
        />
      )}
    </div>
  );
}

