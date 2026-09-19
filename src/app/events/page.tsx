"use client";

import { useEffect, useState } from "react";
import { formatRupiah, formatDate, getStatusBadge } from "@/lib/format";
import {
  CalendarDays,
  PlusCircle,
  MapPin,
  Clock,
  Boxes,
  DollarSign,
  ShoppingCart,
  Pencil,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedEventForStock, setSelectedEventForStock] = useState<any>(null);

  // Event Form State
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [submitting, setSubmitting] = useState(false);

  // Stock Allocation State
  const [allocations, setAllocations] = useState<{ productId: string; qty: number }[]>([]);
  const [submittingAlloc, setSubmittingAlloc] = useState(false);

  useEffect(() => {
    loadEvents();
    loadProducts();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (Array.isArray(data)) setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/products?activeOnly=true");
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenNewEvent = () => {
    setEditingEvent(null);
    setName("");
    setLocation("");
    setStartDate("");
    setEndDate("");
    setNotes("");
    setStatus("upcoming");
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (ev: any) => {
    setEditingEvent(ev);
    setName(ev.name);
    setLocation(ev.location);
    setStartDate(new Date(ev.startDate).toISOString().slice(0, 10));
    setEndDate(new Date(ev.endDate).toISOString().slice(0, 10));
    setNotes(ev.notes || "");
    setStatus(ev.status);
    setIsEventModalOpen(true);
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = "/api/events";
      const method = editingEvent ? "PUT" : "POST";
      const payload = {
        ...(editingEvent && { id: editingEvent.id }),
        name,
        location,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        notes,
        status,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan event");
      }

      setIsEventModalOpen(false);
      loadEvents();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("event-updated"));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus event bazaar ini?")) return;

    try {
      const res = await fetch(`/api/events?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadEvents();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("event-updated"));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Stock Allocation to Event
  const handleOpenAllocation = (ev: any) => {
    setSelectedEventForStock(ev);
    // Inisialisasi daftar item alokasi dari produk yang ada
    const initialItems = products.map((p) => ({
      productId: p.id,
      qty: 0,
    }));
    setAllocations(initialItems);
    setIsAllocateModalOpen(true);
  };

  const handleUpdateAllocationQty = (productId: string, qty: number) => {
    setAllocations((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, qty: Math.max(0, qty) } : item
      )
    );
  };

  const handleSubmitAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForStock) return;

    const filtered = allocations.filter((a) => a.qty > 0);
    if (filtered.length === 0) {
      alert("Masukkan minimal 1 produk dengan jumlah lebih dari 0");
      return;
    }

    setSubmittingAlloc(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "allocate_event",
          eventId: selectedEventForStock.id,
          allocations: filtered,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mencatat alokasi stok");
      }

      alert("Alokasi stok berhasil dicatat ke dalam log!");
      setIsAllocateModalOpen(false);
      loadProducts();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingAlloc(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Event & Bazaar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar event bazaar yang diikuti booth, evaluasi omzet, dan alokasi stok barang
          </p>
        </div>

        <button
          onClick={handleOpenNewEvent}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
        >
          <PlusCircle className="h-4 w-4" />
          Tambah Event Baru
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Memuat data event...</div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          Belum ada data event bazaar. Klik Tambah Event Baru untuk memulai.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((ev) => {
            const statusBadge = getStatusBadge(ev.status);
            const isOngoing = ev.status === "ongoing";

            return (
              <div
                key={ev.id}
                className={`p-5 rounded-2xl bg-white border flex flex-col justify-between shadow-xs transition hover:shadow-md ${
                  isOngoing ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-slate-200/80"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${statusBadge.bg}`}>
                      {statusBadge.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditEvent(ev)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                        title="Edit Event"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                        title="Hapus Event"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900">{ev.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{ev.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        {formatDate(ev.startDate)} s/d {formatDate(ev.endDate)}
                      </span>
                    </div>
                  </div>

                  {ev.notes && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                      {ev.notes}
                    </div>
                  )}

                  {/* Revenue & Stats per Event */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Omzet</div>
                      <div className="text-sm font-black text-emerald-700 mt-0.5">
                        {formatRupiah(ev.totalRevenue || 0)}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Transaksi</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {ev.orderCount || 0} order
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Actions */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => handleOpenAllocation(ev)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition"
                  >
                    <Boxes className="h-3.5 w-3.5 text-amber-600" />
                    Alokasi Stok
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Tambah / Edit Event */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingEvent ? "Edit Event Bazaar" : "Tambah Event Baru"}
              </h3>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Event / Bazaar *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Bazaar Kuliner GBK Senayan"
                  className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Lokasi Booth *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Parkir Timur GBK, Booth A-12"
                  className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal Selesai *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Status Event</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="upcoming">Akan Datang (Upcoming)</option>
                  <option value="ongoing">Sedang Berjalan (Ongoing)</option>
                  <option value="selesai">Selesai</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Info tenant, jam operasional, PIC bazaar..."
                  className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  {submitting ? "Menyimpan..." : "Simpan Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Alokasi Stok ke Event */}
      {isAllocateModalOpen && selectedEventForStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Alokasi Stok Barang ke Event</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Event: <span className="font-bold text-emerald-700">{selectedEventForStock.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsAllocateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAllocation} className="space-y-4">
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {products.map((p) => {
                  const allocItem = allocations.find((a) => a.productId === p.id);

                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Sisa Stok: {p.stock} {p.unit}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">Bawa:</span>
                        <input
                          type="number"
                          min="0"
                          max={p.stock}
                          value={allocItem?.qty || 0}
                          onChange={(e) => handleUpdateAllocationQty(p.id, Number(e.target.value))}
                          className="w-16 p-1.5 rounded-lg bg-white text-slate-900 border border-slate-300 text-center font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-[11px] text-slate-600">{p.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={submittingAlloc}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-600 transition"
                >
                  {submittingAlloc ? "Menyimpan..." : "Simpan Alokasi Stok"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
