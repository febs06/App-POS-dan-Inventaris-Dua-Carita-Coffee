"use client";

import { useEffect, useState } from "react";
import { formatRupiah, formatDateTime } from "@/lib/format";
import {
  Users,
  PlusCircle,
  Search,
  MessageCircle,
  Pencil,
  Trash2,
  X,
  Phone,
  Clock,
  FileText,
} from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingCustomer(null);
    setName("");
    setPhoneNumber("");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhoneNumber(c.phoneNumber);
    setNotes(c.notes || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";
      const payload = {
        ...(editingCustomer && { id: editingCustomer.id }),
        name,
        phoneNumber,
        notes,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan customer");
      }

      setIsModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data pelanggan ini?")) return;
    try {
      const res = await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
      if (res.ok) loadCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  const getWhatsAppLink = (phone: string, custName: string) => {
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.slice(1);
    const text = encodeURIComponent(`Halo Kak ${custName}, kami dari Dua Carita Coffee 😊 Ada pesanan pre-order yang bisa kami siapkan?`);
    return `https://wa.me/${clean}?text=${text}`;
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phoneNumber.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pelanggan Pre-Order (PO)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Database kontak pelanggan yang memesan via WhatsApp atau personal
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
        >
          <PlusCircle className="h-4 w-4" />
          Tambah Pelanggan Baru
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama / nomor WhatsApp..."
            className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold hidden sm:block">
          Total: {filteredCustomers.length} pelanggan
        </div>
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Memuat data pelanggan...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          Tidak ada pelanggan yang cocok dengan pencarian.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{c.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mt-0.5">
                      <Phone className="h-3 w-3" />
                      <span>{c.phoneNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title="Edit Pelanggan"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Hapus Pelanggan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {c.notes && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 italic">
                    {c.notes}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-[10px] text-slate-500 block">Total PO</span>
                    <span className="font-bold text-slate-900">{c.totalOrders || 0} order</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-[10px] text-slate-500 block">Terakhir PO</span>
                    <span className="font-bold text-slate-900 truncate block">
                      {c.lastOrder ? formatDateTime(c.lastOrder.createdAt).slice(0, 10) : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100">
                <a
                  href={getWhatsAppLink(c.phoneNumber, c.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                  Chat di WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Tambah / Edit Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingCustomer ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nomor WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Catatan / Preferensi</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Suka less sugar, kantor dekat booth..."
                  className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  {submitting ? "Menyimpan..." : "Simpan Kontak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
