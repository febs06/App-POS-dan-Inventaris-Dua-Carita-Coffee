"use client";

import { useEffect, useState } from "react";
import { formatRupiah, formatDate } from "@/lib/format";
import {
  Truck,
  PlusCircle,
  Search,
  Phone,
  MapPin,
  ExternalLink,
  Package,
  History,
  TrendingUp,
  TrendingDown,
  Building2,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function SuppliersPage() {
  const [activeTab, setActiveTab] = useState<"suppliers" | "items" | "history">("suppliers");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    suppliers: any[];
    items: any[];
    histories: any[];
  }>({
    suppliers: [],
    items: [],
    histories: [],
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Modal Tambah Supplier
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supCode, setSupCode] = useState("");
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supCity, setSupCity] = useState("Bandung");
  const [supType, setSupType] = useState("Bahan Baku");
  const [supMaps, setSupMaps] = useState("");
  const [supNotes, setSupNotes] = useState("");
  const [submittingSup, setSubmittingSup] = useState(false);

  // Modal Tambah Item
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemSupplierId, setItemSupplierId] = useState("");
  const [itemCategory, setItemCategory] = useState("Bahan Baku");
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemUnit, setItemUnit] = useState("Pcs");
  const [itemPrice, setItemPrice] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [submittingItem, setSubmittingItem] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/suppliers");
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.suppliers?.length > 0 && !itemSupplierId) {
          setItemSupplierId(json.suppliers[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingSup(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_supplier",
          code: supCode,
          name: supName,
          phone: supPhone,
          city: supCity,
          type: supType,
          mapsUrl: supMaps,
          notes: supNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal membuat supplier");
      }

      setIsSupplierModalOpen(false);
      setSupCode("");
      setSupName("");
      setSupPhone("");
      setSupNotes("");
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingSup(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingItem(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_item",
          supplierId: itemSupplierId,
          category: itemCategory,
          name: itemName,
          qty: itemQty,
          unit: itemUnit,
          price: itemPrice,
          notes: itemNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menambah item supplier");
      }

      setIsItemModalOpen(false);
      setItemName("");
      setItemPrice("");
      setItemNotes("");
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingItem(false);
    }
  };

  const formatWaUrl = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, "");
    const formatted = clean.startsWith("0") ? "62" + clean.slice(1) : clean;
    return `https://api.whatsapp.com/send?phone=${formatted}`;
  };

  // Filtered lists
  const filteredSuppliers = data.suppliers.filter((s) => {
    const matchSearch =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = selectedType === "all" || s.type === selectedType;
    return matchSearch && matchType;
  });

  const filteredItems = data.items.filter((item) => {
    const matchSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat =
      selectedCategory === "all" || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const filteredHistories = data.histories.filter((h) => {
    return (
      !searchQuery.trim() ||
      h.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Master Supplier & Pengadaan
              </h1>
              <p className="text-xs text-slate-500">
                Kelola data vendor, katalog harga bahan baku, packaging, dan riwayat fluktuasi harga
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "suppliers" && (
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Tambah Supplier</span>
            </button>
          )}

          {activeTab === "items" && (
            <button
              onClick={() => setIsItemModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Tambah Item Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab("suppliers");
            setSearchQuery("");
          }}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "suppliers"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Master Supplier</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
            {data.suppliers.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("items");
            setSearchQuery("");
          }}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "items"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Katalog Item Supplier</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
            {data.items.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("history");
            setSearchQuery("");
          }}
          className={`pb-3 px-3 text-xs font-bold transition border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "history"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="h-4 w-4" />
          <span>History Harga</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600">
            {data.histories.length}
          </span>
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "suppliers"
                ? "Cari nama atau kode supplier..."
                : activeTab === "items"
                ? "Cari nama barang atau supplier..."
                : "Cari riwayat perubahan harga..."
            }
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {activeTab === "suppliers" && (
          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs font-bold bg-white text-slate-800 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Semua Jenis</option>
              <option value="Bahan Baku">Bahan Baku</option>
              <option value="Packaging">Packaging</option>
            </select>
          </div>
        )}

        {activeTab === "items" && (
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-bold bg-white text-slate-800 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Semua Kategori</option>
              <option value="Kopi">Kopi</option>
              <option value="Syrup/Flavor">Syrup/Flavor</option>
              <option value="Creamer">Creamer</option>
              <option value="Dairy/Susu">Dairy/Susu</option>
              <option value="Powder">Powder</option>
              <option value="Packaging">Packaging</option>
              <option value="Operasional">Operasional</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: MASTER SUPPLIER */}
      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-amber-300 transition"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[10px] font-black text-amber-700">
                      {s.code}
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-1.5">{s.name}</h3>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.type === "Bahan Baku"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {s.type}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                  {s.notes || "Supplier resmi terdaftar"}
                </p>

                {/* Detail kontak & kota */}
                <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{s.city || "Bandung"}</span>
                  </div>

                  {s.phone && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono">{s.phone}</span>
                      </div>
                      <a
                        href={formatWaUrl(s.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline flex items-center gap-1"
                      >
                        Chat WA ↗
                      </a>
                    </div>
                  )}

                  {s.mapsUrl && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-400">Google Maps</span>
                      <a
                        href={s.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                      >
                        Buka Peta ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer info item yang disediakan */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Item Terdaftar:</span>
                <span className="font-black text-slate-900">
                  {s.items?.length || 0} item barang
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: KATALOG ITEM SUPPLIER */}
      {activeTab === "items" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Nama Barang</th>
                  <th className="py-3.5 px-3">Kategori</th>
                  <th className="py-3.5 px-3">Supplier</th>
                  <th className="py-3.5 px-3">Kemasan / Satuan</th>
                  <th className="py-3.5 px-3 text-right">Harga Beli</th>
                  <th className="py-3.5 px-3">Catatan Kemasan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-black text-slate-900">{item.name}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-800">{item.supplier?.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.supplier?.code}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-semibold">
                      {item.qty} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                      {formatRupiah(item.price)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {item.notes ? (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                          {item.notes}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY HARGA */}
      {activeTab === "history" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Tanggal Catat</th>
                  <th className="py-3.5 px-3">Nama Supplier</th>
                  <th className="py-3.5 px-4">Nama Item</th>
                  <th className="py-3.5 px-3">Satuan</th>
                  <th className="py-3.5 px-3 text-right">Harga</th>
                  <th className="py-3.5 px-3 text-center">Perubahan</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistories.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {formatDate(h.date)}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {h.supplier?.name}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">{h.itemName}</td>
                    <td className="py-3 px-3 text-slate-600">
                      {h.qty} {h.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      {formatRupiah(h.price)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {h.priceDiff && h.priceDiff > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          <TrendingUp className="h-3 w-3" /> +{formatRupiah(h.priceDiff)}
                        </span>
                      ) : h.priceDiff && h.priceDiff < 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          <TrendingDown className="h-3 w-3" /> {formatRupiah(h.priceDiff)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {h.notes || "Pembaruan rutin"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH SUPPLIER */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-4">
              Tambah Supplier Baru
            </h3>
            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kode Supplier *
                  </label>
                  <input
                    type="text"
                    required
                    value={supCode}
                    onChange={(e) => setSupCode(e.target.value)}
                    placeholder="Contoh: SPL-008"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Jenis Supplier *
                  </label>
                  <select
                    value={supType}
                    onChange={(e) => setSupType(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Supplier *
                </label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="Contoh: CV Bintang Kopi"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    WhatsApp (No HP)
                  </label>
                  <input
                    type="text"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="0812xxxx"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kota
                  </label>
                  <input
                    type="text"
                    value={supCity}
                    onChange={(e) => setSupCity(e.target.value)}
                    placeholder="Bandung"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Link Google Maps
                </label>
                <input
                  type="text"
                  value={supMaps}
                  onChange={(e) => setSupMaps(e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan
                </label>
                <textarea
                  value={supNotes}
                  onChange={(e) => setSupNotes(e.target.value)}
                  placeholder="Catatan jenis barang atau ketentuan grosir"
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingSup}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition disabled:bg-slate-300"
                >
                  {submittingSup ? "Menyimpan..." : "Simpan Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH ITEM SUPPLIER */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900 mb-4">
              Tambah Item Katalog Supplier
            </h3>
            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pilih Supplier *
                </label>
                <select
                  required
                  value={itemSupplierId}
                  onChange={(e) => setItemSupplierId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  {data.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kategori *
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="Kopi">Kopi</option>
                    <option value="Syrup/Flavor">Syrup/Flavor</option>
                    <option value="Creamer">Creamer</option>
                    <option value="Dairy/Susu">Dairy/Susu</option>
                    <option value="Powder">Powder</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Operasional">Operasional</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Satuan *
                  </label>
                  <select
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  >
                    <option value="Kg">Kg</option>
                    <option value="L">Liter (L)</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Pack">Pack</option>
                    <option value="Karton">Karton</option>
                    <option value="Bal">Bal</option>
                    <option value="Lembar">Lembar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Item / Barang *
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Contoh: Susu UHT Diamond Plain"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Isi / Qty *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value)}
                    placeholder="1"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Harga Beli (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="Contoh: 19500"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Kemasan / Grosir
                </label>
                <input
                  type="text"
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Contoh: Per 12 Pcs, Per 100 Pcs"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-slate-100 text-xs font-bold text-slate-700 hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingItem}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition disabled:bg-slate-300"
                >
                  {submittingItem ? "Menyimpan..." : "Simpan Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
