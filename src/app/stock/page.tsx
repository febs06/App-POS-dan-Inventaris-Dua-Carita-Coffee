"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatDate, formatRupiah } from "@/lib/format";
import {
  Boxes,
  AlertTriangle,
  PlusCircle,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Layers,
  X,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  PackagePlus,
  ArrowUpDown,
  Sparkles,
  Zap,
} from "lucide-react";

export default function StockManagementPage() {
  const [activeTab, setActiveTab] = useState<"products" | "raw_materials">("products");

  // ==========================================
  // 1. STATE STOK PRODUK JADI
  // ==========================================
  const [stockData, setStockData] = useState<any>({
    products: [],
    lowStockProducts: [],
    lowStockCount: 0,
    logs: [],
    eventAllocations: [],
  });
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for product logs
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterEvent, setFilterEvent] = useState("all");
  const [filterReason, setFilterReason] = useState("all");

  // Restock Product Modal
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockProductId, setRestockProductId] = useState("");
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockReason, setRestockReason] = useState("restock");
  const [restockEventId, setRestockEventId] = useState("");
  const [submittingRestock, setSubmittingRestock] = useState(false);

  // Allocate Modal
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [allocEventId, setAllocEventId] = useState("");
  const [allocItems, setAllocItems] = useState<{ productId: string; qty: number }[]>([]);
  const [submittingAlloc, setSubmittingAlloc] = useState(false);

  // ==========================================
  // 2. STATE STOK BAHAN BAKU (RAW MATERIALS)
  // ==========================================
  const [rawMaterialsData, setRawMaterialsData] = useState<{
    materials: any[];
    totalCount: number;
    lowStockCount: number;
    totalInventoryValue: number;
  }>({
    materials: [],
    totalCount: 0,
    lowStockCount: 0,
    totalInventoryValue: 0,
  });
  const [rawLogs, setRawLogs] = useState<any[]>([]);
  const [loadingRaw, setLoadingRaw] = useState(false);
  const [rawCategoryFilter, setRawCategoryFilter] = useState("all");
  const [rawStatusFilter, setRawStatusFilter] = useState("all");

  // Modal Tambah / Edit Bahan Baku
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [editingRaw, setEditingRaw] = useState<any>(null);
  const [rawName, setRawName] = useState("");
  const [rawCategory, setRawCategory] = useState("Bahan Minuman");
  const [rawStock, setRawStock] = useState<string>("0");
  const [rawUnit, setRawUnit] = useState("gram");
  const [rawMinStock, setRawMinStock] = useState<string>("10");
  const [rawCostPerUnit, setRawCostPerUnit] = useState<string>("0");
  const [rawSupplier, setRawSupplier] = useState("");
  const [submittingRaw, setSubmittingRaw] = useState(false);
  const [rawError, setRawError] = useState("");

  // Modal Catat Mutasi Bahan Baku
  const [isMutateModalOpen, setIsMutateModalOpen] = useState(false);
  const [mutateRawId, setMutateRawId] = useState("");
  const [mutateQty, setMutateQty] = useState<string>("10");
  const [mutateType, setMutateType] = useState<"restock" | "pemakaian" | "rusak" | "koreksi">("restock");
  const [mutateNotes, setMutateNotes] = useState("");
  const [submittingMutate, setSubmittingMutate] = useState(false);
  const [mutateError, setMutateError] = useState("");

  useEffect(() => {
    loadStock();
    loadEvents();
  }, [filterProduct, filterEvent, filterReason]);

  useEffect(() => {
    if (activeTab === "raw_materials") {
      loadRawMaterials();
      loadRawLogs();
    }
  }, [activeTab, rawCategoryFilter, rawStatusFilter]);

  const loadStock = async () => {
    setLoading(true);
    try {
      let url = `/api/stock?`;
      if (filterProduct !== "all") url += `&productId=${filterProduct}`;
      if (filterEvent !== "all") url += `&eventId=${filterEvent}`;
      if (filterReason !== "all") url += `&reason=${filterReason}`;

      const res = await fetch(url);
      const data = await res.json();
      setStockData(data);
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
      if (Array.isArray(data)) {
        setEvents(data);
        const ongoing = data.find((e: any) => e.status === "ongoing");
        if (ongoing) setAllocEventId(ongoing.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadRawMaterials = async () => {
    setLoadingRaw(true);
    try {
      let url = `/api/raw-materials?`;
      if (rawCategoryFilter !== "all") url += `&category=${rawCategoryFilter}`;
      if (rawStatusFilter !== "all") url += `&status=${rawStatusFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data && Array.isArray(data.materials)) {
        setRawMaterialsData(data);
      }
    } catch (err) {
      console.error("Gagal memuat bahan baku:", err);
    } finally {
      setLoadingRaw(false);
    }
  };

  const loadRawLogs = async () => {
    try {
      const res = await fetch("/api/raw-materials/mutate?limit=50");
      const data = await res.json();
      if (Array.isArray(data)) setRawLogs(data);
    } catch (err) {
      console.error("Gagal memuat log mutasi bahan:", err);
    }
  };

  // Restock Submit (Produk Jadi)
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProductId || restockQty === 0) return;

    setSubmittingRestock(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: restockProductId,
          changeQty: Number(restockQty),
          reason: restockReason,
          eventId: restockEventId || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal memperbarui stok");
      }

      setIsRestockOpen(false);
      loadStock();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingRestock(false);
    }
  };

  // Allocate Submit (Produk Jadi)
  const handleOpenAllocate = () => {
    if (stockData.products) {
      setAllocItems(
        stockData.products.map((p: any) => ({
          productId: p.id,
          qty: 0,
        }))
      );
    }
    setIsAllocateOpen(true);
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocEventId) {
      alert("Pilih event bazaar tujuan");
      return;
    }

    const filtered = allocItems.filter((i) => i.qty > 0);
    if (filtered.length === 0) {
      alert("Tentukan jumlah bawa minimal 1 produk");
      return;
    }

    setSubmittingAlloc(true);
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "allocate_event",
          eventId: allocEventId,
          allocations: filtered,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengalokasikan stok");
      }

      alert("Alokasi stok ke event berhasil dicatat!");
      setIsAllocateOpen(false);
      loadStock();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingAlloc(false);
    }
  };

  // ==========================================
  // HANDLERS BAHAN BAKU
  // ==========================================
  const openAddRawModal = () => {
    setEditingRaw(null);
    setRawName("");
    setRawCategory("Bahan Minuman");
    setRawStock("0");
    setRawUnit("gram");
    setRawMinStock("10");
    setRawCostPerUnit("0");
    setRawSupplier("");
    setRawError("");
    setIsRawModalOpen(true);
  };

  const openEditRawModal = (material: any) => {
    setEditingRaw(material);
    setRawName(material.name);
    setRawCategory(material.category);
    setRawStock(String(material.stock));
    setRawUnit(material.unit);
    setRawMinStock(String(material.minStock));
    setRawCostPerUnit(String(material.costPerUnit));
    setRawSupplier(material.supplier || "");
    setRawError("");
    setIsRawModalOpen(true);
  };

  const handleApplyPreset = (preset: {
    name: string;
    category: string;
    unit: string;
    stock: string;
    minStock: string;
    costPerUnit: string;
  }) => {
    setEditingRaw(null);
    setRawName(preset.name);
    setRawCategory(preset.category);
    setRawStock(preset.stock);
    setRawUnit(preset.unit);
    setRawMinStock(preset.minStock);
    setRawCostPerUnit(preset.costPerUnit);
    setRawSupplier("Supplier Booth");
    setRawError("");
    setIsRawModalOpen(true);
  };

  const handleSaveRaw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRaw(true);
    setRawError("");

    try {
      let res;
      if (editingRaw) {
        res = await fetch("/api/raw-materials", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingRaw.id,
            name: rawName,
            category: rawCategory,
            unit: rawUnit,
            minStock: parseFloat(rawMinStock) || 0,
            costPerUnit: parseFloat(rawCostPerUnit) || 0,
            supplier: rawSupplier,
          }),
        });
      } else {
        res = await fetch("/api/raw-materials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: rawName,
            category: rawCategory,
            stock: parseFloat(rawStock) || 0,
            unit: rawUnit,
            minStock: parseFloat(rawMinStock) || 0,
            costPerUnit: parseFloat(rawCostPerUnit) || 0,
            supplier: rawSupplier,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setRawError(data.error || "Gagal menyimpan bahan baku");
        return;
      }

      setIsRawModalOpen(false);
      loadRawMaterials();
      loadRawLogs();
    } catch (err) {
      setRawError("Gagal menghubungi server");
    } finally {
      setSubmittingRaw(false);
    }
  };

  const handleDeleteRaw = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus bahan baku "${name}"? Riwayat mutasi terkait juga akan terhapus.`)) return;

    try {
      const res = await fetch(`/api/raw-materials?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadRawMaterials();
        loadRawLogs();
      }
    } catch (err) {
      alert("Gagal menghapus bahan baku");
    }
  };

  const openMutateModal = (materialId?: string) => {
    if (materialId) {
      setMutateRawId(materialId);
    } else if (rawMaterialsData.materials.length > 0) {
      setMutateRawId(rawMaterialsData.materials[0].id);
    }
    setMutateQty("10");
    setMutateType("restock");
    setMutateNotes("");
    setMutateError("");
    setIsMutateModalOpen(true);
  };

  const handleMutateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutateRawId || !mutateQty) return;

    setSubmittingMutate(true);
    setMutateError("");

    try {
      const res = await fetch("/api/raw-materials/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawMaterialId: mutateRawId,
          changeQty: parseFloat(mutateQty),
          type: mutateType,
          notes: mutateNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMutateError(data.error || "Gagal mencatat mutasi");
        return;
      }

      setIsMutateModalOpen(false);
      loadRawMaterials();
      loadRawLogs();
    } catch (err) {
      setMutateError("Terjadi kesalahan jaringan");
    } finally {
      setSubmittingMutate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Stok & Inventaris</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola ketersediaan produk jadi siap jual, alokasi event bazaar, dan inventaris bahan baku mentah
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "products" && (
            <>
              <button
                onClick={handleOpenAllocate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition cursor-pointer"
              >
                <Calendar className="h-4 w-4 text-slate-600" />
                Alokasi ke Event
              </button>
              <button
                onClick={() => {
                  if (stockData.products.length > 0) setRestockProductId(stockData.products[0].id);
                  setIsRestockOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 text-slate-600" />
                Restock Produk
              </button>
            </>
          )}

          {activeTab === "raw_materials" && (
            <button
              onClick={() => openMutateModal()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition cursor-pointer"
            >
              <ArrowUpDown className="h-4 w-4 text-slate-600" />
              Catat Mutasi / Pakai
            </button>
          )}

          {/* Prominent "+ Tambah Bahan Baku" button visible everywhere */}
          <button
            onClick={() => {
              setActiveTab("raw_materials");
              openAddRawModal();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
            id="btn-add-raw-material-main"
          >
            <PackagePlus className="h-4 w-4 text-slate-950" />
            <span>+ Tambah Bahan Baku</span>
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === "products"
              ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Stok Produk Jadi ({stockData.products?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("raw_materials")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === "raw_materials"
              ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Stok Bahan Baku & Logistik ({rawMaterialsData.totalCount})</span>
          {rawMaterialsData.lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {rawMaterialsData.lowStockCount} Menipis
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STOK PRODUK JADI */}
      {/* ========================================================================= */}
      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Critical Stock Alert Bar */}
          {stockData.lowStockCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-bold">Peringatan: {stockData.lowStockCount} Produk Stok Menipis!</h2>
                <p className="text-xs text-amber-700 mt-0.5">
                  Segera lakukan restock atau penyesuaian agar tidak kehabisan saat operasional booth bazaar.
                </p>
              </div>
            </div>
          )}

          {/* Current Products Stock Grid */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Status Stok Produk Siap Jual</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stockData.products?.map((prod: any) => {
                const isCritical = prod.stock <= 10;
                return (
                  <div
                    key={prod.id}
                    className={`p-3.5 rounded-2xl border transition flex flex-col justify-between ${
                      isCritical
                        ? "bg-amber-50/60 border-amber-300"
                        : "bg-slate-50/60 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase">
                        {prod.category?.name}
                      </div>
                      <div className="font-bold text-xs text-slate-900 line-clamp-1 mt-0.5">
                        {prod.name}
                      </div>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between">
                      <div className={`text-xl font-black ${isCritical ? "text-amber-700" : "text-slate-900"}`}>
                        {prod.stock}
                        <span className="text-[10px] font-medium text-slate-500 ml-1">{prod.unit}</span>
                      </div>
                      {isCritical && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 text-amber-800">
                          Menipis
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Product Logs History */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900">Riwayat Mutasi Stok Produk</h2>
              <div className="flex flex-wrap gap-2 text-xs">
                <select
                  value={filterReason}
                  onChange={(e) => setFilterReason(e.target.value)}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium"
                >
                  <option value="all">Semua Jenis Mutasi</option>
                  <option value="restock">Restock / Masuk</option>
                  <option value="terjual">Terjual</option>
                  <option value="dibawa ke event">Dibawa ke Event</option>
                  <option value="koreksi">Koreksi Manual</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Waktu</th>
                    <th className="py-3 px-3">Produk</th>
                    <th className="py-3 px-3">Jenis Mutasi</th>
                    <th className="py-3 px-3">Jumlah</th>
                    <th className="py-3 px-3">Event Terkait</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockData.logs?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada riwayat mutasi produk.
                      </td>
                    </tr>
                  ) : (
                    stockData.logs?.map((log: any) => {
                      const isPositive = log.changeQty > 0;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-3 text-slate-500">{formatDateTime(log.createdAt)}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{log.product?.name}</td>
                          <td className="py-3 px-3">
                            <span className="capitalize px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                              {log.reason}
                            </span>
                          </td>
                          <td className={`py-3 px-3 font-black ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                            {isPositive ? `+${log.changeQty}` : log.changeQty} {log.product?.unit}
                          </td>
                          <td className="py-3 px-3 text-slate-600">{log.event?.name || "-"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STOK BAHAN BAKU (RAW MATERIALS) */}
      {/* ========================================================================= */}
      {activeTab === "raw_materials" && (
        <div className="space-y-6">
          {/* Stat Cards Bahan Baku */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Jenis Bahan Baku</span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {rawMaterialsData.totalCount} <span className="text-xs font-normal text-slate-400">item</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Biji kopi, susu, sirup, cup, dll</div>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Bahan Baku Menipis</span>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {rawMaterialsData.lowStockCount} <span className="text-xs font-normal text-slate-400">item</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Di bawah batas stok minimum</div>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Estimasi Nilai Bahan</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {formatRupiah(rawMaterialsData.totalInventoryValue)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Total valuasi inventaris bahan</div>
            </div>
          </div>

          {/* Quick Preset Toolbar for F&B Booth */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-50 border border-amber-200/80 rounded-3xl p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900">
                    Preset Cepat: Tambah Bahan Baku Standar Booth F&B
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Klik salah satu template di bawah untuk membuka form dengan takaran standar terisi otomatis
                  </p>
                </div>
              </div>
              <button
                onClick={openAddRawModal}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline decoration-amber-400 cursor-pointer"
              >
                + Form Manual Kustom
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { name: "Biji Kopi Espresso", category: "Bahan Minuman", unit: "gram", stock: "1000", minStock: "250", costPerUnit: "180" },
                { name: "Susu UHT Fresh Milk", category: "Bahan Minuman", unit: "ml", stock: "5000", minStock: "1000", costPerUnit: "22" },
                { name: "Gula Aren Organik Cair", category: "Sirup & Flavour", unit: "ml", stock: "1000", minStock: "200", costPerUnit: "40" },
                { name: "Sirup Caramel Premium", category: "Sirup & Flavour", unit: "ml", stock: "750", minStock: "150", costPerUnit: "90" },
                { name: "Bubuk Matcha Kyoto", category: "Bahan Minuman", unit: "gram", stock: "500", minStock: "100", costPerUnit: "300" },
                { name: "Cup Dingin 16oz + Tutup", category: "Kemasan & Packaging", unit: "pcs", stock: "100", minStock: "30", costPerUnit: "650" },
                { name: "Sedotan Steril Higienis", category: "Kemasan & Packaging", unit: "pcs", stock: "200", minStock: "50", costPerUnit: "100" },
              ].map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-50 hover:border-amber-400 border border-slate-200 text-slate-800 text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>{p.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({p.unit})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter Bar Bahan Baku */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Kategori Bahan</label>
                <select
                  value={rawCategoryFilter}
                  onChange={(e) => setRawCategoryFilter(e.target.value)}
                  className="text-xs font-bold bg-white text-slate-900 border border-slate-300 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="Kopi">Kopi</option>
                  <option value="Dairy/Susu">Dairy/Susu</option>
                  <option value="Creamer">Creamer</option>
                  <option value="Sweatener/Gula">Sweatener/Gula</option>
                  <option value="Syrup/Flavor">Syrup/Flavor</option>
                  <option value="Powder">Powder</option>
                  <option value="Air">Air</option>
                  <option value="Bahan Minuman">Bahan Minuman</option>
                  <option value="Kemasan & Packaging">Kemasan & Packaging</option>
                  <option value="Topping & Tambahan">Topping & Tambahan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Status Ketersediaan</label>
                <select
                  value={rawStatusFilter}
                  onChange={(e) => setRawStatusFilter(e.target.value)}
                  className="text-xs font-bold bg-white text-slate-900 border border-slate-300 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="critical">Stok Kritis / Menipis</option>
                  <option value="safe">Stok Aman</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                loadRawMaterials();
                loadRawLogs();
              }}
              className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Segarkan Data</span>
            </button>
          </div>

          {/* Table Bahan Baku */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-900">Katalog Bahan Baku & Inventaris Gudang</h2>
              <span className="text-xs text-slate-400">{rawMaterialsData.materials.length} item bahan</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Bahan Baku</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Sisa Stok</th>
                    <th className="py-3 px-4">Batas Min.</th>
                    <th className="py-3 px-4">Biaya / Unit</th>
                    <th className="py-3 px-4">Estimasi Nilai</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingRaw ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Memuat data bahan baku...
                      </td>
                    </tr>
                  ) : rawMaterialsData.materials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Belum ada bahan baku. Klik tombol "Tambah Bahan Baku Baru" untuk memulai.
                      </td>
                    </tr>
                  ) : (
                    rawMaterialsData.materials.map((m) => {
                      const isCritical = m.stock <= m.minStock;
                      const isZero = m.stock <= 0;
                      const val = m.stock * m.costPerUnit;

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{m.name}</div>
                            {m.supplier && (
                              <div className="text-[10px] text-slate-400 font-normal">
                                Supplier: {m.supplier}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {m.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`font-black text-sm ${isCritical ? "text-rose-600" : "text-slate-900"}`}>
                              {m.stock}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-1 font-medium">{m.unit}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {m.minStock} {m.unit}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {formatRupiah(m.costPerUnit)}/{m.unit}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-700">
                            {formatRupiah(val)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isZero
                                  ? "bg-rose-100 text-rose-800"
                                  : isCritical
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {isZero ? "Habis" : isCritical ? "Menipis" : "Aman"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openMutateModal(m.id)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] transition cursor-pointer"
                                title="Catat Mutasi / Pemakaian"
                              >
                                Mutasi
                              </button>
                              <button
                                onClick={() => openEditRawModal(m)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                                title="Edit Bahan Baku"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRaw(m.id, m.name)}
                                className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                                title="Hapus Bahan Baku"
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

          {/* Table Riwayat Mutasi Bahan Baku */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Riwayat Mutasi & Pemakaian Bahan Baku</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Waktu</th>
                    <th className="py-3 px-3">Bahan Baku</th>
                    <th className="py-3 px-3">Jenis Mutasi</th>
                    <th className="py-3 px-3">Jumlah Perubahan</th>
                    <th className="py-3 px-3">Catatan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rawLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada riwayat mutasi bahan baku.
                      </td>
                    </tr>
                  ) : (
                    rawLogs.map((log) => {
                      const isPositive = log.changeQty > 0;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-3 text-slate-500">{formatDateTime(log.createdAt)}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{log.rawMaterial?.name}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`capitalize px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.type === "restock"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : log.type === "pemakaian"
                                  ? "bg-blue-100 text-blue-800"
                                  : log.type === "rusak"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {log.type}
                            </span>
                          </td>
                          <td className={`py-3 px-3 font-black ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                            {isPositive ? `+${log.changeQty}` : log.changeQty} {log.rawMaterial?.unit}
                          </td>
                          <td className="py-3 px-3 text-slate-600 italic">{log.notes || "-"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TAMBAH / EDIT BAHAN BAKU */}
      {/* ========================================================================= */}
      {isRawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-black text-slate-900">
                {editingRaw ? "Edit Bahan Baku" : "Tambah Bahan Baku Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsRawModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRaw} className="p-6 space-y-4">
              {rawError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 border border-rose-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{rawError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Bahan Baku <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rawName}
                  onChange={(e) => setRawName(e.target.value)}
                  placeholder="Contoh: Susu UHT Full Cream"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={rawCategory}
                    onChange={(e) => setRawCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
                  >
                    <option value="Kopi">Kopi</option>
                    <option value="Dairy/Susu">Dairy/Susu</option>
                    <option value="Creamer">Creamer</option>
                    <option value="Sweatener/Gula">Sweatener/Gula</option>
                    <option value="Syrup/Flavor">Syrup/Flavor</option>
                    <option value="Powder">Powder</option>
                    <option value="Air">Air</option>
                    <option value="Bahan Minuman">Bahan Minuman</option>
                    <option value="Kemasan & Packaging">Kemasan & Packaging</option>
                    <option value="Topping & Tambahan">Topping & Tambahan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Satuan Takaran</label>
                  <select
                    value={rawUnit}
                    onChange={(e) => setRawUnit(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
                  >
                    <option value="gram">gram (g)</option>
                    <option value="ml">mililiter (ml)</option>
                    <option value="pcs">pieces (pcs / buah)</option>
                    <option value="kg">kilogram (kg)</option>
                    <option value="liter">liter (L)</option>
                    <option value="botol">botol</option>
                    <option value="pack">pack / dus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {!editingRaw && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Stok Awal</label>
                    <input
                      type="number"
                      step="any"
                      value={rawStock}
                      onChange={(e) => setRawStock(e.target.value)}
                      placeholder="0"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Batas Min. Alert</label>
                  <input
                    type="number"
                    step="any"
                    value={rawMinStock}
                    onChange={(e) => setRawMinStock(e.target.value)}
                    placeholder="10"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Biaya / Unit (Rp)</label>
                  <input
                    type="number"
                    step="any"
                    value={rawCostPerUnit}
                    onChange={(e) => setRawCostPerUnit(e.target.value)}
                    placeholder="0"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Supplier / Vendor</label>
                <input
                  type="text"
                  value={rawSupplier}
                  onChange={(e) => setRawSupplier(e.target.value)}
                  placeholder="Contoh: CV Distributor Mandiri"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRawModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRaw}
                  className="flex-1 py-2.5 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow-sm cursor-pointer disabled:bg-slate-300"
                >
                  {submittingRaw ? "Menyimpan..." : "Simpan Bahan Baku"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CATAT MUTASI BAHAN BAKU */}
      {/* ========================================================================= */}
      {isMutateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-black text-slate-900">Catat Mutasi / Pemakaian Bahan</h3>
              <button
                type="button"
                onClick={() => setIsMutateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMutateSubmit} className="p-6 space-y-4">
              {mutateError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 border border-rose-200">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{mutateError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Bahan Baku</label>
                <select
                  value={mutateRawId}
                  onChange={(e) => setMutateRawId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                >
                  {rawMaterialsData.materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Sisa: {m.stock} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Jenis Mutasi</label>
                <select
                  value={mutateType}
                  onChange={(e: any) => setMutateType(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                >
                  <option value="restock">📥 Pembelian / Restock Masuk (+)</option>
                  <option value="pemakaian">📤 Pemakaian Harian / Event (-)</option>
                  <option value="rusak">⚠️ Rusak / Tumpah / Expired (-)</option>
                  <option value="koreksi">📝 Koreksi Opname Fisik (+/-)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Jumlah Perubahan</label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  value={mutateQty}
                  onChange={(e) => setMutateQty(e.target.value)}
                  placeholder="10"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-black text-slate-900 text-lg"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  value={mutateNotes}
                  onChange={(e) => setMutateNotes(e.target.value)}
                  placeholder="Contoh: Pemakaian bazaar hari ke-1, restock 2 dus"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsMutateModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingMutate}
                  className="flex-1 py-2.5 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow-sm cursor-pointer disabled:bg-slate-300"
                >
                  {submittingMutate ? "Menyimpan..." : "Simpan Mutasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RESTOCK PRODUK JADI (EXISTING) */}
      {/* ========================================================================= */}
      {isRestockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-base text-slate-900">Restock / Koreksi Stok Produk</h3>
              <button
                onClick={() => setIsRestockOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Produk</label>
                <select
                  value={restockProductId}
                  onChange={(e) => setRestockProductId(e.target.value)}
                  className="w-full text-xs font-semibold bg-white text-slate-900 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {stockData.products?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Alasan Penyesuaian</label>
                <select
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  className="w-full text-xs font-semibold bg-white text-slate-900 border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="restock">Restock Masuk (Tambah)</option>
                  <option value="koreksi">Koreksi Opname / Rusak</option>
                  <option value="dibawa ke event">Dibawa ke Event</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Jumlah Perubahan</label>
                <input
                  type="number"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  placeholder="Contoh: 10 atau -5"
                  className="w-full text-xs font-black p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRestockOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRestock}
                  className="px-4 py-2.5 text-xs font-black rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-600 transition shadow-sm cursor-pointer disabled:bg-slate-300"
                >
                  {submittingRestock ? "Menyimpan..." : "Simpan Stok"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ALOKASI KE EVENT (EXISTING) */}
      {/* ========================================================================= */}
      {isAllocateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-base text-slate-900">Alokasi Stok Bawa ke Event Bazaar</h3>
              <button
                onClick={() => setIsAllocateOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Event Bazaar</label>
                <select
                  value={allocEventId}
                  onChange={(e) => setAllocEventId(e.target.value)}
                  className="w-full text-xs font-semibold bg-white text-slate-900 border border-slate-300 rounded-xl p-2.5"
                >
                  <option value="">-- Pilih Event --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {stockData.products?.map((p: any) => {
                  const item = allocItems.find((a) => a.productId === p.id);
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Sisa: {p.stock} {p.unit}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">Bawa:</span>
                        <input
                          type="number"
                          min="0"
                          max={p.stock}
                          value={item?.qty || 0}
                          onChange={(e) =>
                            setAllocItems((prev) =>
                              prev.map((it) =>
                                it.productId === p.id
                                  ? { ...it, qty: Number(e.target.value) }
                                  : it
                              )
                            )
                          }
                          className="w-16 p-1.5 rounded-lg bg-white text-slate-900 border border-slate-300 text-center font-bold text-xs"
                        />
                        <span className="text-[11px] text-slate-600">{p.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAllocateOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingAlloc}
                  className="px-4 py-2.5 text-xs font-black rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-600 transition shadow-sm cursor-pointer disabled:bg-slate-300"
                >
                  {submittingAlloc ? "Menyimpan..." : "Catat Alokasi Stok"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
