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
  Calculator,
  PieChart,
  ClipboardList,
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

interface RabItem {
  id: string;
  month: string;
  year: number;
  seqNo: number | null;
  name: string;
  qty: number;
  unit: string | null;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  fundedBy: string | null;
  status: string;
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

const RAB_MONTH_TABS = [
  { label: "Semua Bulan", value: "all" },
  { label: "Mei 2026", value: "MEI 2026" },
  { label: "Juni 2026 (Estimasi)", value: "JUNI 2026" },
  { label: "Juli 2026", value: "JULI 2026" },
  { label: "Agustus 2026", value: "AGUSTUS 2026" },
];

export default function FinancePage() {
  // Mode View: "ledger" (Arus Kas Cash & QRIS) vs "rab" (Rencana Anggaran Biaya)
  const [activeMode, setActiveMode] = useState<"ledger" | "rab">("ledger");

  // --- ARUS KAS STATE ---
  const [records, setRecords] = useState<CashRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<"all" | "CASH" | "QRIS">("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Kas State
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

  // --- RAB STATE ---
  const [rabItems, setRabItems] = useState<RabItem[]>([]);
  const [rabSummary, setRabSummary] = useState<any>(null);
  const [loadingRab, setLoadingRab] = useState(true);
  const [selectedRabMonth, setSelectedRabMonth] = useState("all");
  const [selectedFunder, setSelectedFunder] = useState("all");
  const [rabSearchQuery, setRabSearchQuery] = useState("");

  // Modal RAB State
  const [isRabModalOpen, setIsRabModalOpen] = useState(false);
  const [formRabMonth, setFormRabMonth] = useState("AGUSTUS 2026");
  const [formRabName, setFormRabName] = useState("");
  const [formRabQty, setFormRabQty] = useState("1");
  const [formRabUnit, setFormRabUnit] = useState("Pcs");
  const [formRabUnitPrice, setFormRabUnitPrice] = useState("");
  const [formRabFundedBy, setFormRabFundedBy] = useState("DCC");
  const [formRabNotes, setFormRabNotes] = useState("");
  const [submittingRab, setSubmittingRab] = useState(false);

  // Load cashflow records
  const fetchRecords = async () => {
    try {
      setLoadingRecords(true);
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
      setLoadingRecords(false);
    }
  };

  // Load RAB items
  const fetchRabItems = async () => {
    try {
      setLoadingRab(true);
      const params = new URLSearchParams();
      if (selectedRabMonth !== "all") params.append("month", selectedRabMonth);
      if (selectedFunder !== "all") params.append("fundedBy", selectedFunder);
      if (rabSearchQuery.trim()) params.append("search", rabSearchQuery.trim());

      const res = await fetch(`/api/rab?${params.toString()}`);
      const data = await res.json();
      if (data && data.items) {
        setRabItems(data.items);
        setRabSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load RAB items:", err);
    } finally {
      setLoadingRab(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedAccount, selectedMonth, selectedType, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchRabItems();
  }, [selectedRabMonth, selectedFunder, rabSearchQuery]);

  // Handle Submit Form Kas
  const handleSubmitKas = async (e: React.FormEvent) => {
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

  // Handle Submit Form RAB
  const handleSubmitRab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRabName.trim() || !formRabUnitPrice) {
      alert("Nama barang dan harga satuan wajib diisi!");
      return;
    }

    try {
      setSubmittingRab(true);
      const res = await fetch("/api/rab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: formRabMonth,
          name: formRabName.trim(),
          qty: parseFloat(formRabQty) || 1,
          unit: formRabUnit.trim(),
          unitPrice: parseFloat(formRabUnitPrice) || 0,
          fundedBy: formRabFundedBy.trim(),
          notes: formRabNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan item RAB");
      }

      setFormRabName("");
      setFormRabUnitPrice("");
      setFormRabNotes("");
      setIsRabModalOpen(false);
      fetchRabItems();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingRab(false);
    }
  };

  // Handle Delete Kas
  const handleDeleteKas = async (id: string, name: string) => {
    if (!confirm(`Hapus catatan: "${name}"?`)) return;
    try {
      const res = await fetch(`/api/cashflow?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchRecords();
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete RAB
  const handleDeleteRab = async (id: string, name: string) => {
    if (!confirm(`Hapus item RAB: "${name}"?`)) return;
    try {
      const res = await fetch(`/api/rab?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchRabItems();
    } catch (err) {
      console.error(err);
    }
  };

  // Export Kas to CSV
  const handleExportKasCSV = () => {
    if (!records.length) return alert("Tidak ada data untuk diekspor");
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
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    const accountName = selectedAccount === "CASH" ? "Kas_Tunai" : selectedAccount === "QRIS" ? "Saldo_QRIS" : "Semua_Akun";
    link.setAttribute("download", `Buku_Keuangan_${accountName}_${selectedMonth !== "all" ? `Bulan_${selectedMonth}` : "Lengkap"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export RAB to CSV
  const handleExportRabCSV = () => {
    if (!rabItems.length) return alert("Tidak ada data RAB untuk diekspor");
    const headers = ["No", "Bulan", "Nama Barang / Kebutuhan", "Qty", "Satuan", "Harga Satuan", "Jumlah Total", "Sumber Dana / Uang", "Keterangan"];
    const rows = rabItems.map((r) => [
      r.seqNo || "-",
      r.month,
      `"${r.name.replace(/"/g, '""')}"`,
      r.qty,
      r.unit || "-",
      r.unitPrice,
      r.totalPrice,
      r.fundedBy || "DCC",
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `RAB_Dua_Carita_${selectedRabMonth !== "all" ? selectedRabMonth.replace(/\s+/g, '_') : "Lengkap"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Month-filtered subtotal calculations for Cash/QRIS
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
      {/* Header & Main Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Buku Keuangan & Anggaran
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Sistem Terintegrasi
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Pencatatan mutasi kas tunai & QRIS, serta Rencana Anggaran Biaya (RAB) Dua Carita Coffee.
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setActiveMode("ledger")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeMode === "ledger"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Coins className="h-4 w-4" />
            <span>Arus Kas (Cash & QRIS)</span>
          </button>
          <button
            onClick={() => setActiveMode("rab")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeMode === "rab"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calculator className="h-4 w-4" />
            <span>Rencana Anggaran (RAB)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: ARUS KAS (DUAL LEDGER: CASH & QRIS) */}
      {/* ========================================================================= */}
      {activeMode === "ledger" && (
        <>
          {/* Action Row */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleExportKasCSV}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Ekspor CSV Kas</span>
            </button>
            <button
              onClick={() => {
                setFormAccount(selectedAccount === "QRIS" ? "QRIS" : "CASH");
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/20 transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>+ Catat Mutasi Kas</span>
            </button>
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

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="all">Semua Tipe (Masuk/Keluar)</option>
                <option value="MASUK">Pemasukan (Masuk)</option>
                <option value="KELUAR">Pengeluaran (Keluar)</option>
              </select>

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

          {/* Main Table Cash & QRIS */}
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
                  {loadingRecords ? (
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
                      </td>
                    </tr>
                  ) : (
                    records.map((r, index) => {
                      const cat = CATEGORY_LABELS[r.category] || CATEGORY_LABELS.LAINNYA;
                      const isMasuk = r.type === "MASUK";

                      return (
                        <tr key={r.id} className="hover:bg-slate-800/40 transition group">
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
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cat.bg} ${cat.text} ${cat.border}`}>
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
                              {r.notes && <span className="text-slate-400 italic">{r.notes}</span>}
                              {!r.cashier && !r.notes && <span className="text-slate-600">-</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleDeleteKas(r.id, r.name)}
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

            {!loadingRecords && records.length > 0 && (
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
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: RENCANA ANGGARAN BIAYA (RAB) */}
      {/* ========================================================================= */}
      {activeMode === "rab" && (
        <>
          {/* Action Row */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calculator className="h-5 w-5 text-amber-400" />
                Rencana Anggaran Biaya (RAB)
              </h2>
              <p className="text-xs text-slate-400">
                Alokasi rencana belanja bahan baku, operasional, dan perlengkapan Dua Carita Coffee.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportRabCSV}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition shadow-sm cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                <span>Ekspor CSV RAB</span>
              </button>
              <button
                onClick={() => setIsRabModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/20 transition cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>+ Tambah Item RAB</span>
              </button>
            </div>
          </div>

          {/* KPI Cards RAB */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-amber-500/40 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {selectedRabMonth === "all" ? "Grand Total RAB" : `Total RAB ${selectedRabMonth}`}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Rencana
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-amber-400 tracking-tight">
                  {formatRupiah(rabSummary?.filteredTotal || 0)}
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedRabMonth === "all" ? "Total seluruh anggaran Mei - Agustus" : `Anggaran untuk bulan ${selectedRabMonth}`}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">RAB Mei 2026</span>
                <span className="text-xs text-slate-500 font-mono">5 Items</span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {formatRupiah(rabSummary?.monthTotals?.["MEI 2026"] || 391000)}
                </span>
                <p className="text-xs text-slate-400 mt-1">Kemasan & Cup Injection</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">RAB Juni 2026</span>
                <span className="text-xs text-amber-400/80 font-mono">4 Items (Estimasi)</span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {formatRupiah(rabSummary?.monthTotals?.["JUNI 2026"] || 315000)}
                </span>
                <p className="text-xs text-slate-400 mt-1">Kopi, Susu Diamond & Creamer</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">RAB Agustus 2026</span>
                <span className="text-xs text-emerald-400 font-mono">30 Items</span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-white tracking-tight">
                  {formatRupiah(rabSummary?.monthTotals?.["AGUSTUS 2026"] || 2184607)}
                </span>
                <p className="text-xs text-slate-400 mt-1">Bazaar & Perlengkapan Stand</p>
              </div>
            </div>
          </div>

          {/* Agustus 2026 Funding Breakdown (Cards) */}
          {(selectedRabMonth === "AGUSTUS 2026" || selectedRabMonth === "all") && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <PieChart className="h-4 w-4 text-amber-400" />
                  Rincian Penanggung Jawab / Sumber Dana (Agustus 2026)
                </span>
                <span className="text-xs font-mono text-slate-400 font-bold">
                  Total: {formatRupiah(2184607)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div
                  onClick={() => setSelectedFunder(selectedFunder === "DCC" ? "all" : "DCC")}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    selectedFunder === "DCC" ? "bg-slate-800 border-amber-500 shadow-md" : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">🏢 Uang DCC (Internal)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">12 Item</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-amber-400 mt-1 block">
                    {formatRupiah(794107)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Cup, Plastik, Stand, Bar Mate, dll</span>
                </div>

                <div
                  onClick={() => setSelectedFunder(selectedFunder === "Revan" ? "all" : "Revan")}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    selectedFunder === "Revan" ? "bg-slate-800 border-emerald-500 shadow-md" : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">👤 Uang Revan</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">9 Item</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">
                    {formatRupiah(638000)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Susu Diamond, Creamer, Denali, dll</span>
                </div>

                <div
                  onClick={() => setSelectedFunder(selectedFunder === "Febri" ? "all" : "Febri")}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    selectedFunder === "Febri" ? "bg-slate-800 border-cyan-500 shadow-md" : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">👤 Uang Febri</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">5 Item</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-cyan-400 mt-1 block">
                    {formatRupiah(529500)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Kopi Eclipse, Trieste, Taplak, dll</span>
                </div>

                <div
                  onClick={() => setSelectedFunder(selectedFunder === "Raihan" ? "all" : "Raihan")}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    selectedFunder === "Raihan" ? "bg-slate-800 border-purple-500 shadow-md" : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">👤 Uang Raihan</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">4 Item</span>
                  </div>
                  <span className="text-lg font-bold font-mono text-purple-400 mt-1 block">
                    {formatRupiah(223000)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Set Matcha, Iphone XR, Gas, Es</span>
                </div>
              </div>
            </div>
          )}

          {/* Month Tabs Bar for RAB */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
            {RAB_MONTH_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedRabMonth(tab.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedRabMonth === tab.value
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters & Search Toolbar RAB */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari item RAB, keterangan..."
                value={rabSearchQuery}
                onChange={(e) => setRabSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedFunder}
                onChange={(e) => setSelectedFunder(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="all">Semua Sumber Dana</option>
                <option value="DCC">DCC (Kas Internal)</option>
                <option value="Revan">Uang Revan</option>
                <option value="Febri">Uang Febri</option>
                <option value="Raihan">Uang Raihan</option>
              </select>
            </div>
          </div>

          {/* Main Table RAB */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">NO</th>
                    {selectedRabMonth === "all" && <th className="py-3.5 px-3 w-28">BULAN</th>}
                    <th className="py-3.5 px-4">NAMA BARANG / KEBUTUHAN</th>
                    <th className="py-3.5 px-4 text-center w-16">QTY</th>
                    <th className="py-3.5 px-4 text-center w-20">SATUAN</th>
                    <th className="py-3.5 px-4 text-right">HARGA SATUAN</th>
                    <th className="py-3.5 px-4 text-right font-black">JUMLAH TOTAL</th>
                    <th className="py-3.5 px-4 text-center">SUMBER DANA / UANG</th>
                    <th className="py-3.5 px-4">KETERANGAN</th>
                    <th className="py-3.5 px-4 w-14 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {loadingRab ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent mb-2" />
                        <p>Memuat rencana anggaran biaya...</p>
                      </td>
                    </tr>
                  ) : rabItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <p className="font-semibold text-slate-300">Tidak ada item RAB yang sesuai</p>
                      </td>
                    </tr>
                  ) : (
                    rabItems.map((r, index) => (
                      <tr key={r.id} className="hover:bg-slate-800/40 transition group">
                        <td className="py-3 px-4 text-center text-xs font-mono text-slate-400">
                          {r.seqNo ?? index + 1}
                        </td>
                        {selectedRabMonth === "all" && (
                          <td className="py-3 px-3 whitespace-nowrap text-xs font-bold text-slate-300">
                            {r.month}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white group-hover:text-amber-400 transition">
                            {r.name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-300 text-xs">
                          {r.qty}
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-slate-400">
                          {r.unit || "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300 text-xs">
                          {formatRupiah(r.unitPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-400 bg-slate-950/30">
                          {formatRupiah(r.totalPrice)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                              r.fundedBy === "Febri"
                                ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                                : r.fundedBy === "Revan"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : r.fundedBy === "Raihan"
                                ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {r.fundedBy || "DCC"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400 italic">
                          {r.notes || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteRab(r.id, r.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Hapus Item RAB"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loadingRab && rabItems.length > 0 && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-400">
                  Menampilkan <b className="text-white">{rabItems.length}</b> kebutuhan anggaran terpilih
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-500 mr-1">Total Anggaran:</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {formatRupiah(rabItems.reduce((acc, i) => acc + i.totalPrice, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL TAMBAH KAS */}
      {/* ========================================================================= */}
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

            <form onSubmit={handleSubmitKas} className="mt-4 space-y-4">
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

      {/* ========================================================================= */}
      {/* MODAL TAMBAH RAB */}
      {/* ========================================================================= */}
      {isRabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-amber-400" />
                Tambah Rencana Anggaran (RAB)
              </h3>
              <button
                onClick={() => setIsRabModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRab} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Bulan Anggaran</label>
                  <select
                    value={formRabMonth}
                    onChange={(e) => setFormRabMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="MEI 2026">MEI 2026</option>
                    <option value="JUNI 2026">JUNI 2026</option>
                    <option value="JULI 2026">JULI 2026</option>
                    <option value="AGUSTUS 2026">AGUSTUS 2026</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Sumber Dana / Uang</label>
                  <select
                    value={formRabFundedBy}
                    onChange={(e) => setFormRabFundedBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="DCC">DCC (Kas Internal)</option>
                    <option value="Revan">Revan</option>
                    <option value="Febri">Febri</option>
                    <option value="Raihan">Raihan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Nama Barang / Kebutuhan</label>
                <input
                  type="text"
                  placeholder="Misal: Cup Injection, Kopi Eclipse, Stand Akrilik"
                  value={formRabName}
                  onChange={(e) => setFormRabName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Qty (Jumlah)</label>
                  <input
                    type="number"
                    step="any"
                    value={formRabQty}
                    onChange={(e) => setFormRabQty(e.target.value)}
                    required
                    min="0.1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Satuan</label>
                  <input
                    type="text"
                    placeholder="Pcs, Pack, Kg, L, Roll"
                    value={formRabUnit}
                    onChange={(e) => setFormRabUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Harga Satuan (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formRabUnitPrice}
                  onChange={(e) => setFormRabUnitPrice(e.target.value)}
                  required
                  min="1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Keterangan / Spesifikasi</label>
                <input
                  type="text"
                  placeholder="Misal: Per Pack 25 Pcs, Ukuran 120x60x70"
                  value={formRabNotes}
                  onChange={(e) => setFormRabNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRabModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRab}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {submittingRab ? "Menyimpan..." : "Simpan Item RAB"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
