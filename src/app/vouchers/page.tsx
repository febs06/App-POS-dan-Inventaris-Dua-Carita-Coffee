"use client";

import { useEffect, useState } from "react";
import { formatRupiah, formatDate } from "@/lib/format";
import {
  TicketPercent,
  PlusCircle,
  Pencil,
  Trash2,
  Calendar,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Percent,
} from "lucide-react";

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percentage" | "nominal">("percentage");
  const [value, setValue] = useState<number>(10);
  const [minPurchase, setMinPurchase] = useState<number | "">("");
  const [maxDiscount, setMaxDiscount] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [usageLimit, setUsageLimit] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vouchers");
      const data = await res.json();
      if (Array.isArray(data)) setVouchers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingVoucher(null);
    setCode("");
    setType("percentage");
    setValue(10);
    setMinPurchase("");
    setMaxDiscount("");
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(nextMonth);
    setUsageLimit(50);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: any) => {
    setEditingVoucher(v);
    setCode(v.code);
    setType(v.type);
    setValue(v.value);
    setMinPurchase(v.minPurchase ?? "");
    setMaxDiscount(v.maxDiscount ?? "");
    setStartDate(new Date(v.startDate).toISOString().slice(0, 10));
    setEndDate(new Date(v.endDate).toISOString().slice(0, 10));
    setUsageLimit(v.usageLimit ?? "");
    setIsActive(v.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = "/api/vouchers";
      const method = editingVoucher ? "PUT" : "POST";
      const payload = {
        ...(editingVoucher && { id: editingVoucher.id }),
        code: code.trim().toUpperCase(),
        type,
        value: Number(value),
        minPurchase: minPurchase ? Number(minPurchase) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        usageLimit: usageLimit ? Number(usageLimit) : null,
        isActive,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan voucher");
      }

      setIsModalOpen(false);
      loadVouchers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (v: any) => {
    try {
      const res = await fetch("/api/vouchers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: v.id, isActive: !v.isActive }),
      });
      if (res.ok) loadVouchers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kode voucher ini?")) return;
    try {
      const res = await fetch(`/api/vouchers?id=${id}`, { method: "DELETE" });
      if (res.ok) loadVouchers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Voucher & Diskon Promo</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur kupon promo untuk transaksi kasir booth atau pre-order WhatsApp
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition"
        >
          <PlusCircle className="h-4 w-4" />
          Buat Voucher Baru
        </button>
      </div>

      {/* Vouchers Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Memuat data voucher...</div>
      ) : vouchers.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          Belum ada voucher aktif. Buat voucher diskon untuk memikat pelanggan booth!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vouchers.map((v) => {
            const isExpired = new Date() > new Date(v.endDate);
            const isLimitReached = v.usageLimit && v.usedCount >= v.usageLimit;

            return (
              <div
                key={v.id}
                className={`p-5 rounded-2xl bg-white border flex flex-col justify-between shadow-xs hover:shadow-md transition ${
                  !v.isActive || isExpired
                    ? "border-slate-200 opacity-60 bg-slate-50/50"
                    : "border-slate-200/80"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                        <TicketPercent className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-mono font-black text-base text-slate-900 tracking-wider">
                          {v.code}
                        </span>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">
                          {v.type === "percentage" ? "Potongan Persen" : "Potongan Nominal"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="p-1 text-slate-400 hover:text-slate-700"
                        title="Edit Voucher"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Hapus Voucher"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Value display */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-baseline justify-between">
                    <span className="text-xs text-slate-600">Diskon:</span>
                    <span className="text-lg font-black text-amber-600">
                      {v.type === "percentage" ? `${v.value}% OFF` : formatRupiah(v.value)}
                    </span>
                  </div>

                  {/* Rules summary */}
                  <div className="space-y-1 text-xs text-slate-600">
                    {v.minPurchase && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Min. Belanja:</span>
                        <span className="font-semibold">{formatRupiah(v.minPurchase)}</span>
                      </div>
                    )}
                    {v.maxDiscount && v.type === "percentage" && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Maks. Potongan:</span>
                        <span className="font-semibold">{formatRupiah(v.maxDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Periode:</span>
                      <span className="font-semibold">
                        {formatDate(v.startDate)} s/d {formatDate(v.endDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kuota Terpakai:</span>
                      <span className="font-bold text-slate-900">
                        {v.usedCount} {v.usageLimit ? `/ ${v.usageLimit} kali` : "kali (tanpa batas)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Toggle Active Button */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-semibold">
                    {isExpired ? (
                      <span className="text-rose-600">Kedaluwarsa</span>
                    ) : isLimitReached ? (
                      <span className="text-orange-600">Kuota Habis</span>
                    ) : v.isActive ? (
                      <span className="text-emerald-700">● Aktif Digunakan</span>
                    ) : (
                      <span className="text-slate-400">Dinonaktifkan</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleActive(v)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      v.isActive
                        ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {v.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Tambah / Edit Voucher */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingVoucher ? "Edit Voucher Promo" : "Buat Kode Voucher Baru"}
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
                <label className="text-xs font-bold text-slate-700 block mb-1">Kode Voucher *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: BAZAAR10"
                  className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tipe Diskon *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="nominal">Nominal (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nilai Diskon ({type === "percentage" ? "%" : "Rp"}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={value || ""}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Minimal Pembelian (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Opsional (0 = tanpa min)"
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Maks. Cap Diskon (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={type !== "percentage"}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Khusus tipe persen"
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal Berakhir *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Batas Kuota Pemakaian</label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Kosongkan jika kuota tidak terbatas"
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
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition"
                >
                  {submitting ? "Menyimpan..." : "Simpan Voucher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
