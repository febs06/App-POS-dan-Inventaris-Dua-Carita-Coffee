"use client";

import { useEffect, useState, useMemo } from "react";
import { formatRupiah, formatDate } from "@/lib/format";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  PlusCircle,
  Search,
  Filter,
  Download,
  Calendar,
  Layers,
  Sparkles,
  DollarSign,
  Tag,
  User,
  Info,
  CheckCircle2,
  Trash2,
  FileSpreadsheet,
  QrCode,
  Coins,
  CreditCard,
  Building2,
} from "lucide-react";

interface CashRecord {
  id: string;
  seqNo: number | null;
  account: "CASH" | "QRIS";
  date: string;
  name: string;
  type: "MASUK" | "KELUAR";
  category: string;
  amount: number;
  balance: number;
  notes: string | null;
  cashier: string | null;
}

const CATEGORY_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PENJUALAN: { label: "Penjualan", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  BAHAN_BAKU: { label: "Bahan Baku", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  PACKAGING: { label: "Packaging", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  OPERASIONAL: { label: "Operasional", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  PINDAH_SALDO: { label: "Pindah Saldo", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  MODAL: { label: "Modal / Refund", bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
  LAINNYA: { label: "Lainnya", bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" },
};

const MONTH_TABS = [
  { label: "Semua Bulan", value: "all" },
  { label: "April 2026", value: "4" },
  { label: "Mei 2026", value: "5" },
  { label: "Juni 2026", value: "6" },
  { label: "Juli 2026", value: "7" },
  { label: "Agustus 2026", value: "8" },
  { label: "September 2026", value: "9" },
];

export default function FinancePage() {
  const [records, setRecords] = useState<CashRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Account Tab ("all", "CASH", "QRIS")
  const [selectedAccount, setSelectedAccount] = useState<"all" | "CASH" | "QRIS">("all");

  // Filters
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formAccount, setFormAccount] = useState<"CASH" | "QRIS">("CASH");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"MASUK" | "KELUAR">("KELUAR");
  const [formCategory, setFormCategory] = useState("BAHAN_BAKU");
  const [formAmount, setFormAmount] = useState("");
  const [formCashier, setFormCashier] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load records
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedAccount !== "all") params.append("account", selectedAccount);
      if (selectedMonth !== "all") params.append("month", selectedMonth);
      if (selectedType !== "all") params.append("type", selectedType);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/cashflow?${params.toString()}`);
      const data = await res.json();
      if (data && data.records) {
        setRecords(data.records);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load cashflow records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedAccount, selectedMonth, selectedType, selectedCategory, searchQuery]);

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAmount) {
      alert("Nama transaksi dan nominal wajib diisi!");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/cashflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: formAccount,
          date: formDate,
          name: formName.trim(),
          type: formType,
          category: formCategory,
          amount: parseFloat(formAmount),
          cashier: formCashier.trim() || null,
          notes: formNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan transaksi");
      }

      // Reset form & close modal
      setFormName("");
      setFormAmount("");
      setFormNotes("");
      setIsModalOpen(false);
      fetchRecords();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus catatan: "${name}"?`)) return;

    try {
      const res = await fetch(`/api/cashflow?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRecords();
      } else {
        alert("Gagal menghapus catatan");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!records.length) {
      alert("Tidak ada data untuk diekspor");
      return;
    }

    const headers = ["No", "Akun", "Tanggal", "Nama Transaksi", "Kategori", "Kas Masuk", "Kas Keluar", "Saldo Berjalan", "Kasir / PJ", "Keterangan"];
    const rows = records.map((r) => [
      r.seqNo || "-",
      r.account === "CASH" ? "Kas Tunai" : "Saldo QRIS",
      new Date(r.date).toLocaleDateString("id-ID"),
      `"${r.name.replace(/"/g, '""')}"`,
      r.category,
      r.type === "MASUK" ? r.amount : 0,
      r.type === "KELUAR" ? r.amount : 0,
      r.balance,
      `"${(r.cashier || "").replace(/"/g, '""')}"`,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const accountName = selectedAccount === "CASH" ? "Kas_Tunai" : selectedAccount === "QRIS" ? "Saldo_QRIS" : "Semua_Akun";
    link.setAttribute("download", `Buku_Keuangan_${accountName}_${selectedMonth !== "all" ? `Bulan_${selectedMonth}` : "Lengkap"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Month-filtered subtotal calculations
  const filteredSubtotals = useMemo(() => {
    let masuk = 0;
    let keluar = 0;
    for (const r of records) {
      if (r.type === "MASUK") masuk += r.amount;
      if (r.type === "KELUAR") keluar += r.amount;
    }
    return { masuk, keluar, net: masuk - keluar };
  }, [records]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Buku Keuangan & Arus Kas (Cash & QRIS)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Dual Ledger Aktif
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Pencatatan pembukuan kas fisik (Cash) dan rekening digital (QRIS) Dua Carita Coffee.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => {
              setFormAccount(selectedAccount === "QRIS" ? "QRIS" : "CASH");
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/20 transition cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Catat Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* Account Switcher Tabs (All, Cash, QRIS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
        <button
          onClick={() => setSelectedAccount("all")}
          className={`flex items-center justify-between p-3.5 rounded-xl transition cursor-pointer ${
            selectedAccount === "all"
              ? "bg-slate-800 border border-amber-500/50 shadow-lg text-white"
              : "hover:bg-slate-900/60 text-slate-400 border border-transparent"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${selectedAccount === "all" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
              <Building2 className="h-4 w-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold block">Semua Akun (Gabungan)</span>
              <span className="text-[11px] text-slate-400">Kas Tunai + Saldo QRIS</span>
            </div>
          </div>
          <span className="text-sm font-mono font-bold text-amber-400">
            {formatRupiah(summary?.totalLiquidity || 1075216)}
          </span>
        </button>

        <button
          onClick={() => setSelectedAccount("CASH")}
          className={`flex items-center justify-between p-3.5 rounded-xl transition cursor-pointer ${
            selectedAccount === "CASH"
              ? "bg-slate-800 border border-emerald-500/50 shadow-lg text-white"
              : "hover:bg-slate-900/60 text-slate-400 border border-transparent"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${selectedAccount === "CASH" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
              <Coins className="h-4 w-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold block">Kas Tunai (Cash)</span>
              <span className="text-[11px] text-slate-400">Saldo Kas Fisik (14/9)</span>
            </div>
          </div>
          <span className="text-sm font-mono font-bold text-emerald-400">
            {formatRupiah(summary?.cashBalance || 55000)}
          </span>
        </button>

        <button
          onClick={() => setSelectedAccount("QRIS")}
          className={`flex items-center justify-between p-3.5 rounded-xl transition cursor-pointer ${
            selectedAccount === "QRIS"
              ? "bg-slate-800 border border-cyan-500/50 shadow-lg text-white"
              : "hover:bg-slate-900/60 text-slate-400 border border-transparent"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${selectedAccount === "QRIS" ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-400"}`}>
              <QrCode className="h-4 w-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold block">Saldo QRIS (Digital)</span>
              <span className="text-[11px] text-slate-400">Rekening QRIS (15/9)</span>
            </div>
          </div>
          <span className="text-sm font-mono font-bold text-cyan-400">
            {formatRupiah(summary?.qrisBalance || 1020216)}
          </span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Aktif */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-emerald-500/40 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <Wallet className="h-16 w-16 text-emerald-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {selectedAccount === "CASH" ? "Saldo Kas Tunai" : selectedAccount === "QRIS" ? "Saldo QRIS" : "Total Likuiditas"}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {selectedAccount === "CASH" ? "Kas Fisik" : selectedAccount === "QRIS" ? "Rekening" : "Total Kas & Bank"}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-400 tracking-tight">
              {formatRupiah(summary?.currentBalance || 0)}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {selectedAccount === "CASH"
                ? "Posisi kas fisik per 14/9/2026"
                : selectedAccount === "QRIS"
                ? "Posisi saldo QRIS per 15/9/2026"
                : "Total dana cair tunai + saldo QRIS"}
            </p>
          </div>
        </div>

        {/* Total Masuk */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Masuk</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white tracking-tight">
              {formatRupiah(filteredSubtotals.masuk)}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {selectedMonth === "all" ? "Seluruh pemasukan sesuai filter" : `Pemasukan bulan terpilih`}
            </p>
          </div>
        </div>

        {/* Total Keluar */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Keluar</span>
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-rose-400 tracking-tight">
              {formatRupiah(filteredSubtotals.keluar)}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {selectedMonth === "all" ? "Belanja bahan, packaging & biaya" : `Pengeluaran bulan terpilih`}
            </p>
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Jumlah Transaksi</span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-400 tracking-tight">
              {records.length} Baris
            </span>
            <p className="text-xs text-slate-400 mt-1">
              {selectedAccount === "all" ? "126 Cash + 108 QRIS" : `Transaksi akun ${selectedAccount}`}
            </p>
          </div>
        </div>
      </div>

      {/* Month Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {MONTH_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedMonth(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedMonth === tab.value
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi, keterangan, kasir..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Tipe Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Tipe (Masuk/Keluar)</option>
            <option value="MASUK">Pemasukan (Masuk)</option>
            <option value="KELUAR">Pengeluaran (Keluar)</option>
          </select>

          {/* Kategori Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold focus:outline-none focus:border-amber-500"
          >
            <option value="all">Semua Kategori</option>
            <option value="PENJUALAN">Penjualan Minuman</option>
            <option value="BAHAN_BAKU">Bahan Baku</option>
            <option value="PACKAGING">Packaging / Botol / Stiker</option>
            <option value="OPERASIONAL">Operasional / Parkir / Es</option>
            <option value="PINDAH_SALDO">Pindah Saldo</option>
            <option value="MODAL">Modal & Refund</option>
            <option value="LAINNYA">Lainnya / Tip</option>
          </select>
        </div>
      </div>

      {/* Main Table (Matches Excel Sheet "CATATAN KEUANGAN CASH & QRIS") */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">NO</th>
                {selectedAccount === "all" && <th className="py-3.5 px-3 w-20 text-center">AKUN</th>}
                <th className="py-3.5 px-4 w-28">TANGGAL</th>
                <th className="py-3.5 px-4">NAMA / TRANSAKSI</th>
                <th className="py-3.5 px-4">KATEGORI</th>
                <th className="py-3.5 px-4 text-right">MASUK</th>
                <th className="py-3.5 px-4 text-right">KELUAR</th>
                <th className="py-3.5 px-4 text-right font-black">TOTAL (SALDO)</th>
                <th className="py-3.5 px-4">KASIR / KETERANGAN</th>
                <th className="py-3.5 px-4 w-14 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={selectedAccount === "all" ? 10 : 9} className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent mb-2" />
                    <p>Memuat catatan pembukuan...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={selectedAccount === "all" ? 10 : 9} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-300">Tidak ada data transaksi yang sesuai</p>
                    <p className="text-xs text-slate-500 mt-1">Coba ubah filter atau kata kunci pencarian.</p>
                  </td>
                </tr>
              ) : (
                records.map((r, index) => {
                  const cat = CATEGORY_LABELS[r.category] || CATEGORY_LABELS.LAINNYA;
                  const isMasuk = r.type === "MASUK";

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">
                        {r.seqNo ?? index + 1}
                      </td>
                      {selectedAccount === "all" && (
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {r.account === "CASH" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              CASH
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              QRIS
                            </span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-slate-300">
                        {new Date(r.date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white group-hover:text-amber-400 transition">
                          {r.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}
                        >
                          {cat.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-emerald-400 font-semibold">
                        {isMasuk ? formatRupiah(r.amount) : "-"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono text-rose-400 font-semibold">
                        {!isMasuk ? formatRupiah(r.amount) : "-"}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-mono font-bold text-slate-100 bg-slate-950/30">
                        {formatRupiah(r.balance)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-300">
                        <div className="flex flex-col gap-0.5">
                          {r.cashier && (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                              <User className="h-3 w-3" />
                              {r.cashier}
                            </span>
                          )}
                          {r.notes && (
                            <span className="text-slate-400 italic">
                              {r.notes}
                            </span>
                          )}
                          {!r.cashier && !r.notes && <span className="text-slate-600">-</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDelete(r.id, r.name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Hapus Catatan"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Subtotal */}
        {!loading && records.length > 0 && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              Menampilkan <b className="text-white">{records.length}</b> transaksi pada filter terpilih
            </span>
            <div className="flex items-center gap-4 font-mono">
              <div>
                <span className="text-slate-500 mr-1.5">Subtotal Masuk:</span>
                <span className="font-bold text-emerald-400">{formatRupiah(filteredSubtotals.masuk)}</span>
              </div>
              <div className="h-3 w-px bg-slate-800" />
              <div>
                <span className="text-slate-500 mr-1.5">Subtotal Keluar:</span>
                <span className="font-bold text-rose-400">{formatRupiah(filteredSubtotals.keluar)}</span>
              </div>
              <div className="h-3 w-px bg-slate-800" />
              <div>
                <span className="text-slate-500 mr-1.5">Net:</span>
                <span className={`font-bold ${filteredSubtotals.net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {formatRupiah(filteredSubtotals.net)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah Transaksi Kas / QRIS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-amber-400" />
                Catat Transaksi Keuangan
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {/* Pilihan Akun (Cash vs QRIS) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Pilih Akun / Dompet</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormAccount("CASH")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                      formAccount === "CASH"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-md"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    <Coins className="h-4 w-4" />
                    Kas Tunai (Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormAccount("QRIS")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                      formAccount === "QRIS"
                        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-md"
                        : "bg-slate-950 text-slate-400 border-slate-800"
                    }`}
                  >
                    <QrCode className="h-4 w-4" />
                    Saldo QRIS
                  </button>
                </div>
              </div>

              {/* Tipe Transaksi (Toggle MASUK / KELUAR) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Tipe Mutasi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType("MASUK")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                      formType === "MASUK"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <ArrowDownLeft className="h-4 w-4" />
                    Pemasukan (Masuk)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("KELUAR")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                      formType === "KELUAR"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-md shadow-rose-500/10"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Pengeluaran (Keluar)
                  </button>
                </div>
              </div>

              {/* Tanggal & Kategori */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Tanggal</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="PENJUALAN">Penjualan Minuman</option>
                    <option value="BAHAN_BAKU">Bahan Baku</option>
                    <option value="PACKAGING">Packaging & Botol</option>
                    <option value="OPERASIONAL">Operasional</option>
                    <option value="PINDAH_SALDO">Pindah Saldo</option>
                    <option value="MODAL">Modal / Refund</option>
                    <option value="LAINNYA">Lainnya / Tip</option>
                  </select>
                </div>
              </div>

              {/* Nama Transaksi */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Nama Transaksi / Barang</label>
                <input
                  type="text"
                  placeholder="Misal: Susu Diamond, Lets Brew, Pendapatan, dll."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Nominal */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  required
                  min="1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Kasir / PJ */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Kasir / Penanggung Jawab</label>
                <input
                  type="text"
                  placeholder="Misal: Revan, Raihan, Febri"
                  value={formCashier}
                  onChange={(e) => setFormCashier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Keterangan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: MOKAKU 2026, Pindah ke Cash, Restock"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan Mutasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
