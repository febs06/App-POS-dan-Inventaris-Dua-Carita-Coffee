"use client";

import { useEffect, useState } from "react";
import { formatRupiah, formatDateTime, formatDate, getStatusBadge, getPaymentBadge } from "@/lib/format";
import {
  Clock,
  PlusCircle,
  Search,
  Filter,
  MessageCircle,
  Printer,
  Ban,
  CheckCircle,
  ChevronRight,
  UserPlus,
  Calendar,
  X,
  CreditCard,
  DollarSign,
  Trash2,
} from "lucide-react";
import ReceiptModal from "@/components/ReceiptModal";
import VoidModal from "@/components/VoidModal";
import DeleteOrderModal from "@/components/DeleteOrderModal";


export default function PoManagementPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isNewPoOpen, setIsNewPoOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any>(null);
  const [voidTargetOrder, setVoidTargetOrder] = useState<any>(null);
  const [payTargetOrder, setPayTargetOrder] = useState<any>(null);
  const [deleteTargetOrder, setDeleteTargetOrder] = useState<any>(null);

  // New PO Form state
  const [poCustomerType, setPoCustomerType] = useState<"existing" | "new">("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustNotes, setNewCustNotes] = useState("");
  const [pickupMethod, setPickupMethod] = useState("ambil di event");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupEventId, setPickupEventId] = useState("");
  const [poItems, setPoItems] = useState<{ productId: string; qty: number; notes: string; price: number }[]>([]);
  const [poDiscount, setPoDiscount] = useState(0);
  const [initialPaymentType, setInitialPaymentType] = useState<"none" | "dp" | "lunas">("dp");
  const [dpAmount, setDpAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [submittingPo, setSubmittingPo] = useState(false);

  // Pay Settlement state
  const [settleAmount, setSettleAmount] = useState(0);
  const [settleMethod, setSettleMethod] = useState("transfer");
  const [submittingSettle, setSubmittingSettle] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter, paymentFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      let url = "/api/orders?orderSource=PO";
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (paymentFilter !== "all") url += `&paymentStatus=${paymentFilter}`;

      const [ordRes, custRes, prodRes, evRes] = await Promise.all([
        fetch(url),
        fetch("/api/customers"),
        fetch("/api/products?activeOnly=true"),
        fetch("/api/events"),
      ]);

      const [ords, custs, prods, evs] = await Promise.all([
        ordRes.json(),
        custRes.json(),
        prodRes.json(),
        evRes.json(),
      ]);

      if (Array.isArray(ords)) setOrders(ords);
      if (Array.isArray(custs)) setCustomers(custs);
      if (Array.isArray(prods)) setProducts(prods);
      if (Array.isArray(evs)) {
        setEvents(evs);
        const ongoing = evs.find((e: any) => e.status === "ongoing");
        if (ongoing) setPickupEventId(ongoing.id);
      }
    } catch (err) {
      console.error("Failed to load PO data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add Item to New PO
  const handleAddItem = () => {
    if (products.length === 0) return;
    const first = products[0];
    setPoItems((prev) => [
      ...prev,
      { productId: first.id, qty: 1, notes: "", price: first.price },
    ]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    setPoItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        if (field === "productId") {
          const prod = products.find((p) => p.id === value);
          return { ...it, productId: value, price: prod?.price || 0 };
        }
        return { ...it, [field]: value };
      })
    );
  };

  const handleRemoveItem = (index: number) => {
    setPoItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Subtotal New PO
  const poSubtotal = poItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const poTotal = Math.max(0, poSubtotal - Number(poDiscount || 0));

  // Submit New PO
  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      alert("Pilih minimal 1 item produk untuk PO");
      return;
    }

    for (const it of poItems) {
      const prod = products.find((p) => p.id === it.productId);
      if (prod && prod.isAvailableByIngredients === false) {
        alert(`Menu "${prod.name}" tidak dapat dipesan karena stok bahan baku tidak mencukupi di gudang!`);
        return;
      }
    }

    setSubmittingPo(true);
    try {
      let finalCustId = selectedCustomerId;

      // Jika customer baru, buat customer dulu
      if (poCustomerType === "new") {
        if (!newCustName.trim() || !newCustPhone.trim()) {
          alert("Nama dan No WhatsApp pelanggan wajib diisi");
          setSubmittingPo(false);
          return;
        }

        const custRes = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newCustName,
            phoneNumber: newCustPhone,
            notes: newCustNotes,
          }),
        });
        const createdCust = await custRes.json();
        if (!custRes.ok) throw new Error(createdCust.error || "Gagal membuat data customer");
        finalCustId = createdCust.id;
      }

      if (!finalCustId) {
        alert("Pilih customer untuk pesanan PO");
        setSubmittingPo(false);
        return;
      }

      // Tentukan payment payload
      let paymentPayload = null;
      if (initialPaymentType === "dp" && dpAmount > 0) {
        paymentPayload = {
          method: paymentMethod,
          amount: Number(dpAmount),
          isDownPayment: true,
        };
      } else if (initialPaymentType === "lunas") {
        paymentPayload = {
          method: paymentMethod,
          amount: poTotal,
          isDownPayment: false,
        };
      }

      let cashierName = "Admin PO";
      try {
        const saved = localStorage.getItem("active_cashier");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name) cashierName = parsed.name;
        }
      } catch (e) {}

      const payload = {
        orderSource: "PO",
        customerId: finalCustId,
        cashierName,
        eventId: pickupMethod === "ambil di event" ? pickupEventId || null : null,
        pickupMethod,
        pickupDate: pickupDate ? new Date(pickupDate) : null,
        items: poItems,
        discountAmount: Number(poDiscount || 0),
        payment: paymentPayload,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal membuat order PO");
      }

      const createdOrder = await res.json();
      setIsNewPoOpen(false);
      // Reset form
      setPoItems([]);
      setNewCustName("");
      setNewCustPhone("");
      setNewCustNotes("");
      setPoDiscount(0);
      setDpAmount(0);
      // Reload orders
      loadData();
      // Buka receipt/invoice modal
      setSelectedReceiptOrder(createdOrder);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingPo(false);
    }
  };

  // Update Status Order PO
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Pelunasan DP
  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTargetOrder || settleAmount <= 0) return;

    setSubmittingSettle(true);
    try {
      const res = await fetch(`/api/orders/${payTargetOrder.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: settleMethod,
          amount: settleAmount,
          isDownPayment: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mencatat pelunasan");
      }

      setPayTargetOrder(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingSettle(false);
    }
  };

  // Filter Search
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchNumber = o.orderNumber?.toLowerCase().includes(q);
    const matchCust = o.customer?.name?.toLowerCase().includes(q);
    const matchPhone = o.customer?.phoneNumber?.includes(q);
    return matchNumber || matchCust || matchPhone;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kelola Pre-Order (PO)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola pesanan pre-order masuk dari WhatsApp, tracking DP, dan jadwal pengambilan
          </p>
        </div>

        <button
          onClick={() => {
            handleAddItem();
            setIsNewPoOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition"
        >
          <PlusCircle className="h-4 w-4" />
          Input Order PO Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold bg-white text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu (Pending)</option>
              <option value="diproses">Diproses</option>
              <option value="siap diambil">Siap Diambil</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>

          {/* Payment filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Pembayaran:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="text-xs font-semibold bg-white text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="all">Semua Pembayaran</option>
              <option value="lunas">Lunas</option>
              <option value="dp">Bayar DP</option>
              <option value="belum_bayar">Belum Bayar</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. order / nama / no WA..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Memuat data pesanan PO...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          Tidak ada order Pre-Order yang sesuai dengan filter.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const statusBadge = getStatusBadge(order.status);
            const paymentBadge = getPaymentBadge(order.paymentStatus);
            const isVoided = order.isVoided;

            return (
              <div
                key={order.id}
                className={`p-4 rounded-2xl bg-white border shadow-xs transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isVoided ? "border-rose-200 bg-rose-50/20 opacity-75" : "border-slate-200/80 hover:border-violet-300"
                }`}
              >
                {/* Order Information */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{order.orderNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadge.bg}`}>
                      {statusBadge.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${paymentBadge.bg}`}>
                      {paymentBadge.label}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      • {formatDateTime(order.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div>
                      Pelanggan: <strong className="text-slate-900">{order.customer?.name}</strong> (
                      {order.customer?.phoneNumber})
                    </div>
                    <div>
                      Metode Ambil: <strong className="text-slate-900 capitalize">{order.pickupMethod || "COD"}</strong>
                    </div>
                    {order.pickupDate && (
                      <div className="text-amber-700 font-semibold">
                        Jadwal: {formatDate(order.pickupDate)}
                      </div>
                    )}
                    {order.event && (
                      <div className="text-emerald-700 font-semibold">
                        📍 {order.event.name}
                      </div>
                    )}
                  </div>

                  {/* Items summary */}
                  <div className="text-xs text-slate-500 flex flex-wrap gap-2 pt-1">
                    {order.items?.map((it: any, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {it.product?.name} x{it.qty}
                        {it.notes ? ` (${it.notes})` : ""}
                      </span>
                    ))}
                  </div>

                  {isVoided && order.voidReason && (
                    <div className="text-xs text-rose-600 italic bg-rose-50 p-2 rounded-lg border border-rose-200">
                      Alasan Dibatalkan: {order.voidReason}
                    </div>
                  )}
                </div>

                {/* Amount & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                  <div className="text-right">
                    <div className="text-base font-black text-slate-900">
                      {formatRupiah(order.totalAmount)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Terbayar: {formatRupiah(order.paidAmount)}
                      {order.remainingAmount > 0 && (
                        <span className="text-amber-700 font-bold ml-1 block">
                          Sisa: {formatRupiah(order.remainingAmount)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Status Workflow select */}
                    {!isVoided && order.status !== "selesai" && (
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="pending">Menunggu</option>
                        <option value="diproses">Diproses</option>
                        <option value="siap diambil">Siap Diambil</option>
                        <option value="selesai">Selesai</option>
                      </select>
                    )}

                    {/* Catat Pelunasan DP */}
                    {!isVoided && order.remainingAmount > 0 && (
                      <button
                        onClick={() => {
                          setPayTargetOrder(order);
                          setSettleAmount(order.remainingAmount);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      >
                        Pelunasan
                      </button>
                    )}

                    {/* Tombol Invoice & Cetak */}
                    <button
                      onClick={() => setSelectedReceiptOrder(order)}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Invoice / WA
                    </button>

                    {/* Void / Batal */}
                    {!isVoided && order.status !== "selesai" && (
                      <button
                        onClick={() => setVoidTargetOrder(order)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Batalkan Order"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    )}

                    {/* Hapus PO Permanen */}
                    <button
                      onClick={() => setDeleteTargetOrder(order)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Hapus Order PO Permanen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Input Order PO Baru */}
      {isNewPoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">Input Order Pre-Order (PO) Baru</h3>
              <button
                onClick={() => setIsNewPoOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4">
              {/* Customer Selection */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Pelanggan (Customer)</label>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPoCustomerType("existing")}
                      className={`font-semibold ${
                        poCustomerType === "existing" ? "text-violet-700 underline" : "text-slate-400"
                      }`}
                    >
                      Pilih dari Kontak
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={() => setPoCustomerType("new")}
                      className={`font-semibold ${
                        poCustomerType === "new" ? "text-violet-700 underline" : "text-slate-400"
                      }`}
                    >
                      + Tambah Baru
                    </button>
                  </div>
                </div>

                {poCustomerType === "existing" ? (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full text-xs font-medium bg-white text-slate-900 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Pilih Customer Terdaftar --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phoneNumber})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      placeholder="Nama Pelanggan *"
                      className="text-xs p-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={newCustPhone}
                      onChange={(e) => setNewCustPhone(e.target.value)}
                      placeholder="No. WhatsApp (08xxx) *"
                      className="text-xs p-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newCustNotes}
                      onChange={(e) => setNewCustNotes(e.target.value)}
                      placeholder="Catatan preferensi (opsional)"
                      className="text-xs p-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg sm:col-span-2 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Pickup details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Metode Pengambilan
                  </label>
                  <select
                    value={pickupMethod}
                    onChange={(e) => setPickupMethod(e.target.value)}
                    className="w-full text-xs bg-white text-slate-900 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  >
                    <option value="ambil di event">Ambil di Booth Event</option>
                    <option value="COD">COD / Diantar</option>
                    <option value="ketemu langsung">Ketemu Langsung</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Tanggal & Waktu Ambil
                  </label>
                  <input
                    type="datetime-local"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full text-xs bg-white text-slate-900 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                  />
                </div>

                {pickupMethod === "ambil di event" && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Pilih Event Booth
                    </label>
                    <select
                      value={pickupEventId}
                      onChange={(e) => setPickupEventId(e.target.value)}
                      className="w-full text-xs bg-white text-slate-900 border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                    >
                      <option value="">-- Tanpa Event --</option>
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Daftar Menu Pesanan</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-violet-700 hover:text-violet-800 flex items-center gap-1"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Tambah Menu
                  </button>
                </div>

                <div className="space-y-2">
                  {poItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
                      <select
                        value={item.productId}
                        onChange={(e) => handleUpdateItem(idx, "productId", e.target.value)}
                        className="flex-1 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      >
                        {products.map((p) => {
                          const isRawMissing = p.isAvailableByIngredients === false;
                          return (
                            <option key={p.id} value={p.id} disabled={isRawMissing}>
                              {p.name} - {formatRupiah(p.price)}{" "}
                              {isRawMissing
                                ? "⚠️ [Bahan Baku Habis]"
                                : `(Sisa Racik: ${p.maxProducible ?? p.stock})`}
                            </option>
                          );
                        })}
                      </select>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <span className="text-xs text-slate-500">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(idx, "qty", Number(e.target.value))}
                          className="w-16 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg p-2 text-center font-bold focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                      </div>

                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => handleUpdateItem(idx, "notes", e.target.value)}
                        placeholder="Catatan..."
                        className="flex-1 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary & Payment Setting */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-bold text-slate-900">{formatRupiah(poSubtotal)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Potongan Diskon (Rp):</span>
                  <input
                    type="number"
                    min="0"
                    value={poDiscount || ""}
                    onChange={(e) => setPoDiscount(Number(e.target.value))}
                    className="w-28 text-xs bg-white text-slate-900 border border-slate-300 rounded-lg p-1.5 text-right font-bold focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Tagihan:</span>
                  <span>{formatRupiah(poTotal)}</span>
                </div>

                {/* DP / Payment Options */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-800 block">Status Pembayaran Awal</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setInitialPaymentType("dp")}
                      className={`p-2 rounded-lg text-xs font-bold border ${
                        initialPaymentType === "dp"
                          ? "bg-amber-500 text-slate-950 border-amber-600"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      Bayar DP Dulu
                    </button>
                    <button
                      type="button"
                      onClick={() => setInitialPaymentType("lunas")}
                      className={`p-2 rounded-lg text-xs font-bold border ${
                        initialPaymentType === "lunas"
                          ? "bg-amber-500 text-slate-950 border-amber-600"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      Langsung Lunas
                    </button>
                    <button
                      type="button"
                      onClick={() => setInitialPaymentType("none")}
                      className={`p-2 rounded-lg text-xs font-bold border ${
                        initialPaymentType === "none"
                          ? "bg-amber-500 text-slate-950 border-amber-600"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      Belum Bayar
                    </button>
                  </div>

                  {initialPaymentType === "dp" && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block">Nominal DP (Rp)</label>
                        <input
                          type="number"
                          min="1000"
                          value={dpAmount || ""}
                          onChange={(e) => setDpAmount(Number(e.target.value))}
                          placeholder="Nominal DP..."
                          className="w-full text-xs p-2 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block">Metode Bayar DP</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full text-xs p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                        >
                          <option value="transfer">Transfer Bank</option>
                          <option value="qris">QRIS</option>
                          <option value="cash">Tunai (Cash)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {initialPaymentType === "lunas" && (
                    <div className="pt-2">
                      <label className="text-[10px] font-bold text-slate-600 block">Metode Pembayaran</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full text-xs p-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                      >
                        <option value="transfer">Transfer Bank</option>
                        <option value="qris">QRIS</option>
                        <option value="cash">Tunai (Cash)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPoOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPo}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition disabled:opacity-50"
                >
                  {submittingPo ? "Menyimpan..." : "Simpan Order PO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Catat Pelunasan DP */}
      {payTargetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">Catat Pelunasan PO</h3>
              <button
                onClick={() => setPayTargetOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSettlePayment} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div>Order: <strong>{payTargetOrder.orderNumber}</strong></div>
                <div>Pelanggan: <strong>{payTargetOrder.customer?.name}</strong></div>
                <div className="text-amber-700 font-bold">
                  Sisa Tagihan: {formatRupiah(payTargetOrder.remainingAmount)}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nominal Pembayaran (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  max={payTargetOrder.remainingAmount}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full text-sm font-bold p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  <option value="transfer">Transfer Bank</option>
                  <option value="qris">QRIS</option>
                  <option value="cash">Tunai (Cash)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayTargetOrder(null)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingSettle}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  {submittingSettle ? "Memproses..." : "Konfirmasi Lunas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
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
          onSuccess={loadData}
        />
      )}

      {/* Delete Order Modal */}
      {deleteTargetOrder && (
        <DeleteOrderModal
          order={deleteTargetOrder}
          isOpen={Boolean(deleteTargetOrder)}
          onClose={() => setDeleteTargetOrder(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

