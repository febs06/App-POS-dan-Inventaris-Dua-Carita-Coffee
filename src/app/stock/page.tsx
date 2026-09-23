"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatDate, formatRupiah } from "@/lib/format";
import {
  Boxes,
  AlertTriangle,
  PlusCircle,
  Plus,
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
  Package,
  ArrowUpDown,
  Sparkles,
  Zap,
  Search,
  ClipboardCheck,
  Calculator,
  History,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  HelpCircle,
  Info,
  Percent,
} from "lucide-react";

export default function StockManagementPage() {
  const [activeTab, setActiveTab] = useState<"raw_materials" | "stock_opname" | "products">("raw_materials");

  // ==========================================
  // 1. STATE INVENTORY BAHAN BAKU & VENDOR PRICING
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
  const [rawSearchQuery, setRawSearchQuery] = useState("");

  // Suppliers & Price Fluctuation state
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [restockSupplier, setRestockSupplier] = useState("");
  const [restockPurchasePrice, setRestockPurchasePrice] = useState("");
  const [restockCostMethod, setRestockCostMethod] = useState<"average" | "latest">("average");
  const [restockRecordCash, setRestockRecordCash] = useState(false);

  // Pack Purchasing & Conversion state
  const [restockInputMode, setRestockInputMode] = useState<"pack" | "base">("pack");
  const [restockPackQty, setRestockPackQty] = useState("1");
  const [restockPackPrice, setRestockPackPrice] = useState("");
  const [restockPackSize, setRestockPackSize] = useState("1000");
  const [restockBuyUnit, setRestockBuyUnit] = useState("pack");

  // Price History Modal state
  const [isPriceHistoryOpen, setIsPriceHistoryOpen] = useState(false);
  const [selectedRawForPriceHistory, setSelectedRawForPriceHistory] = useState<any | null>(null);
  const [priceHistories, setPriceHistories] = useState<any[]>([]);
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(false);

  // Form Inline "Input Bahan Baru"
  const [newRawName, setNewRawName] = useState("");
  const [newRawStock, setNewRawStock] = useState("0");
  const [newRawUnit, setNewRawUnit] = useState("gram");
  const [newRawNotes, setNewRawNotes] = useState("");
  const [newRawBuyUnit, setNewRawBuyUnit] = useState("pack");
  const [newRawPackSize, setNewRawPackSize] = useState("1000");
  const [newRawPackPrice, setNewRawPackPrice] = useState("");
  const [submittingNewRaw, setSubmittingNewRaw] = useState(false);

  // Modal "Restok Bahan"
  const [isRestockRawOpen, setIsRestockRawOpen] = useState(false);
  const [selectedRawForRestock, setSelectedRawForRestock] = useState<any | null>(null);
  const [restockRawQty, setRestockRawQty] = useState("10");
  const [restockRawDate, setRestockRawDate] = useState(new Date().toISOString().split("T")[0]);
  const [restockRawNotes, setRestockRawNotes] = useState("");
  const [submittingRestockRaw, setSubmittingRestockRaw] = useState(false);
  const [rawRestockHistory, setRawRestockHistory] = useState<any[]>([]);
  const [loadingRestockHistory, setLoadingRestockHistory] = useState(false);

  // Modal Edit Detail Bahan Baku
  const [isEditRawModalOpen, setIsEditRawModalOpen] = useState(false);
  const [editingRaw, setEditingRaw] = useState<any | null>(null);
  const [editRawName, setEditRawName] = useState("");
  const [editRawCategory, setEditRawCategory] = useState("Bahan Minuman");
  const [editRawUnit, setEditRawUnit] = useState("gram");
  const [editRawMinStock, setEditRawMinStock] = useState("10");
  const [editRawCostPerUnit, setEditRawCostPerUnit] = useState("0");
  const [editRawSupplier, setEditRawSupplier] = useState("");
  const [editRawBuyUnit, setEditRawBuyUnit] = useState("pack");
  const [editRawPackSize, setEditRawPackSize] = useState("1000");
  const [editRawPackPrice, setEditRawPackPrice] = useState("");
  const [submittingEditRaw, setSubmittingEditRaw] = useState(false);

  // ==========================================
  // 2. STATE STOCK OPNAME
  // ==========================================
  const [opnameRawId, setOpnameRawId] = useState("");
  const [opnamePhysicalStock, setOpnamePhysicalStock] = useState("");
  const [opnameDate, setOpnameDate] = useState(new Date().toISOString().split("T")[0]);
  const [opnameNotes, setOpnameNotes] = useState("");
  const [submittingOpname, setSubmittingOpname] = useState(false);
  const [opnameLogs, setOpnameLogs] = useState<any[]>([]);
  const [loadingOpname, setLoadingOpname] = useState(false);

  // ==========================================
  // 3. STATE PRODUK JADI & ALOKASI EVENT
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

  // Load initial data
  useEffect(() => {
    loadRawMaterials();
    loadEvents();
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      if (data && Array.isArray(data.suppliers)) {
        setSuppliersList(data.suppliers);
      }
    } catch (err) {
      console.error("Gagal memuat suppliers:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "products") {
      loadStock();
    } else if (activeTab === "stock_opname") {
      loadOpnameLogs();
    } else if (activeTab === "raw_materials") {
      loadRawMaterials();
      loadRawLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "raw_materials") {
      loadRawMaterials();
    }
  }, [rawSearchQuery]);

  // Load Raw Materials
  const loadRawMaterials = async () => {
    setLoadingRaw(true);
    try {
      const params = new URLSearchParams();
      if (rawSearchQuery.trim()) params.append("search", rawSearchQuery.trim());

      const res = await fetch(`/api/raw-materials?${params.toString()}`);
      const data = await res.json();
      if (data && Array.isArray(data.materials)) {
        setRawMaterialsData(data);
        if (data.materials.length > 0 && !opnameRawId) {
          setOpnameRawId(data.materials[0].id);
        }
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

  const loadOpnameLogs = async () => {
    setLoadingOpname(true);
    try {
      const res = await fetch("/api/raw-materials/opname?limit=50");
      const data = await res.json();
      if (Array.isArray(data)) setOpnameLogs(data);
    } catch (err) {
      console.error("Gagal memuat log stock opname:", err);
    } finally {
      setLoadingOpname(false);
    }
  };

  const loadStock = async () => {
    setLoading(true);
    try {
      let url = `/api/stock?`;
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

  // ==========================================
  // HANDLERS: INPUT BAHAN BARU (INLINE FORM)
  // ==========================================
  const handleCreateNewRaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRawName.trim()) {
      alert("Nama bahan baku wajib diisi");
      return;
    }

    setSubmittingNewRaw(true);
    try {
      const pSize = parseFloat(newRawPackSize) || (newRawUnit === "gram" || newRawUnit === "ml" ? 1000 : 1);
      const pPrice = newRawPackPrice ? parseFloat(newRawPackPrice) : undefined;
      const initialStockPacks = parseFloat(newRawStock) || 0;
      const totalInitialStock = initialStockPacks * pSize;

      const res = await fetch("/api/raw-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRawName.trim(),
          stock: totalInitialStock,
          unit: newRawUnit.trim(),
          supplier: newRawNotes.trim() || undefined,
          category: "Bahan Minuman",
          buyUnit: newRawBuyUnit.trim() || "pack",
          packSize: pSize,
          lastPackPrice: pPrice,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal menambahkan bahan baku");
        return;
      }

      setNewRawName("");
      setNewRawStock("0");
      setNewRawNotes("");
      setNewRawPackPrice("");
      loadRawMaterials();
      loadRawLogs();
      alert("Bahan baku baru berhasil ditambahkan!");
    } catch {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setSubmittingNewRaw(false);
    }
  };

  // ==========================================
  // HANDLERS: MODAL RESTOK BAHAN & HARGA VENDOR
  // ==========================================
  const openRestockModal = async (material: any) => {
    setSelectedRawForRestock(material);
    setRestockInputMode("pack");
    setRestockPackQty("1");
    setRestockBuyUnit(material.buyUnit || "pack");
    const defaultSize = material.packSize || (material.unit === "gram" || material.unit === "ml" ? 1000 : 1);
    setRestockPackSize(String(defaultSize));
    setRestockPackPrice(material.lastPackPrice ? String(material.lastPackPrice) : "");

    // Fallback base values
    setRestockRawQty(String(defaultSize));
    const initialPrice = material.lastPurchasePrice
      ? String(material.lastPurchasePrice)
      : material.costPerUnit > 0
      ? String(material.costPerUnit)
      : "";
    setRestockPurchasePrice(initialPrice);
    setRestockRawDate(new Date().toISOString().split("T")[0]);
    setRestockRawNotes("");
    setRestockSupplier(material.supplier || "");
    setRestockCostMethod("average");
    setRestockRecordCash(false);
    setIsRestockRawOpen(true);
    setLoadingRestockHistory(true);

    try {
      const res = await fetch(`/api/raw-materials/mutate?rawMaterialId=${material.id}&type=restock&limit=15`);
      const data = await res.json();
      if (Array.isArray(data)) setRawRestockHistory(data);
      else setRawRestockHistory([]);
    } catch {
      setRawRestockHistory([]);
    } finally {
      setLoadingRestockHistory(false);
    }
  };

  const handleSaveRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRawForRestock) return;

    setSubmittingRestockRaw(true);
    try {
      const body: any = {
        rawMaterialId: selectedRawForRestock.id,
        type: "restock",
        date: restockRawDate,
        supplierName: restockSupplier.trim() || undefined,
        costMethod: restockCostMethod,
        recordCashExpense: restockRecordCash,
      };

      if (restockInputMode === "pack") {
        const pQty = parseFloat(restockPackQty);
        const pPrice = parseFloat(restockPackPrice);
        const pSize = parseFloat(restockPackSize) || (selectedRawForRestock.unit === "gram" || selectedRawForRestock.unit === "ml" ? 1000 : 1);

        if (isNaN(pQty) || pQty <= 0) {
          alert("Jumlah pack/kemasan harus berupa angka positif lebih dari 0");
          return;
        }
        if (isNaN(pPrice) || pPrice <= 0) {
          alert("Harga beli per pack/kemasan wajib diisi");
          return;
        }

        body.packQty = pQty;
        body.packPrice = pPrice;
        body.packSize = pSize;
        body.buyUnit = restockBuyUnit.trim() || "pack";
        body.notes = restockRawNotes.trim() || `Restok ${pQty} ${restockBuyUnit} @ ${pSize} ${selectedRawForRestock.unit}`;
      } else {
        const qty = parseFloat(restockRawQty);
        if (isNaN(qty) || qty <= 0) {
          alert("Jumlah restok harus berupa angka positif lebih dari 0");
          return;
        }
        body.changeQty = qty;
        body.purchasePrice = restockPurchasePrice ? parseFloat(restockPurchasePrice) : undefined;
        body.notes = restockRawNotes.trim() || `Restok ${selectedRawForRestock.name}`;
      }

      const res = await fetch("/api/raw-materials/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan restok");
        return;
      }

      // Refresh data
      loadRawMaterials();
      loadRawLogs();

      alert(`Restok ${selectedRawForRestock.name} berhasil disimpan!`);
      setIsRestockRawOpen(false);
    } catch {
      alert("Gagal menghubungi server");
    } finally {
      setSubmittingRestockRaw(false);
    }
  };

  // Open dedicated vendor price fluctuation history modal
  const openPriceHistoryModal = async (material: any) => {
    setSelectedRawForPriceHistory(material);
    setIsPriceHistoryOpen(true);
    setLoadingPriceHistory(true);
    try {
      const res = await fetch(`/api/raw-materials/mutate?rawMaterialId=${material.id}&type=restock&limit=50`);
      const data = await res.json();
      if (Array.isArray(data)) setPriceHistories(data);
      else setPriceHistories([]);
    } catch {
      setPriceHistories([]);
    } finally {
      setLoadingPriceHistory(false);
    }
  };

  // ==========================================
  // HANDLERS: EDIT & HAPUS BAHAN BAKU
  // ==========================================
  const openEditModal = (material: any) => {
    setEditingRaw(material);
    setEditRawName(material.name);
    setEditRawCategory(material.category || "Bahan Minuman");
    setEditRawUnit(material.unit);
    setEditRawMinStock(String(material.minStock));
    setEditRawCostPerUnit(String(material.costPerUnit || 0));
    setEditRawSupplier(material.supplier || "");
    setEditRawBuyUnit(material.buyUnit || "pack");
    setEditRawPackSize(String(material.packSize || (material.unit === "gram" || material.unit === "ml" ? 1000 : 1)));
    setEditRawPackPrice(material.lastPackPrice ? String(material.lastPackPrice) : "");
    setIsEditRawModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRaw) return;

    setSubmittingEditRaw(true);
    try {
      const res = await fetch("/api/raw-materials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRaw.id,
          name: editRawName,
          category: editRawCategory,
          unit: editRawUnit,
          minStock: parseFloat(editRawMinStock) || 0,
          costPerUnit: parseFloat(editRawCostPerUnit) || 0,
          supplier: editRawSupplier,
          buyUnit: editRawBuyUnit,
          packSize: parseFloat(editRawPackSize) || 1000,
          lastPackPrice: editRawPackPrice ? parseFloat(editRawPackPrice) : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal memperbarui bahan");
        return;
      }

      setIsEditRawModalOpen(false);
      loadRawMaterials();
      alert("Data bahan baku berhasil diperbarui!");
    } catch {
      alert("Gagal menghubungi server");
    } finally {
      setSubmittingEditRaw(false);
    }
  };

  const handleDeleteRaw = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus bahan baku "${name}"? Semua histori mutasi dan resep terkait bahan ini akan dihapus.`)) return;

    try {
      const res = await fetch(`/api/raw-materials?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadRawMaterials();
        loadRawLogs();
        alert(`Bahan baku "${name}" berhasil dihapus.`);
      } else {
        alert("Gagal menghapus bahan baku");
      }
    } catch {
      alert("Terjadi kesalahan jaringan");
    }
  };

  // ==========================================
  // HANDLERS: STOCK OPNAME FISIK
  // ==========================================
  const selectedOpnameMaterial = rawMaterialsData.materials.find((m) => m.id === opnameRawId);
  const systemStockVal = selectedOpnameMaterial ? selectedOpnameMaterial.stock : 0;
  const physicalStockVal = opnamePhysicalStock !== "" ? parseFloat(opnamePhysicalStock) : null;
  const opnameDifference = physicalStockVal !== null && !isNaN(physicalStockVal) ? physicalStockVal - systemStockVal : null;

  const handleSaveOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opnameRawId) {
      alert("Pilih bahan baku terlebih dahulu");
      return;
    }
    if (opnamePhysicalStock === "" || isNaN(parseFloat(opnamePhysicalStock))) {
      alert("Masukkan hasil hitung fisik yang valid");
      return;
    }

    setSubmittingOpname(true);
    try {
      const res = await fetch("/api/raw-materials/opname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawMaterialId: opnameRawId,
          physicalStock: parseFloat(opnamePhysicalStock),
          notes: opnameNotes,
          opnameDate: opnameDate,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan stock opname");
        return;
      }

      alert("Hasil Stock Opname berhasil disimpan! Stok sistem otomatis dikoreksi.");
      setOpnamePhysicalStock("");
      setOpnameNotes("");
      loadRawMaterials();
      loadOpnameLogs();
    } catch {
      alert("Gagal menghubungi server");
    } finally {
      setSubmittingOpname(false);
    }
  };

  // Restock Produk Jadi Handlers
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

  // Allocate Submit
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

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Stok & Inventaris</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola stok bahan baku booth, lakukan restock, catat stock opname fisik, serta pantau stok produk jadi
          </p>
        </div>

        <div className="flex items-center gap-2">
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
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                Restock Produk Jadi
              </button>
            </>
          )}

          <button
            onClick={() => {
              loadRawMaterials();
              if (activeTab === "stock_opname") loadOpnameLogs();
              if (activeTab === "products") loadStock();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Main Tabs (3 Tabs: Inventory Bahan Baku, Stock Opname, Produk Jadi) */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("raw_materials")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
            activeTab === "raw_materials"
              ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Inventory Bahan Baku ({rawMaterialsData.totalCount})</span>
          {rawMaterialsData.lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">
              {rawMaterialsData.lowStockCount} Menipis
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("stock_opname")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
            activeTab === "stock_opname"
              ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ClipboardCheck className="h-4 w-4" />
          <span>Stock Opname Fisik</span>
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer shrink-0 ${
            activeTab === "products"
              ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Stok Produk Jadi ({stockData.products?.length || 0})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INVENTORY BAHAN BAKU & FORM INPUT BAHAN BARU */}
      {/* ========================================================================= */}
      {activeTab === "raw_materials" && (
        <div className="space-y-6">
          {/* Form "Input Bahan Baru" */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center font-bold">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Input Bahan Baru</h2>
                <p className="text-[11px] text-slate-500">
                  Daftarkan bahan baku mentah atau kemasan baru ke dalam sistem inventaris booth
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateNewRaw} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                <div className="sm:col-span-4">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Bahan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newRawName}
                    onChange={(e) => setNewRawName(e.target.value)}
                    placeholder="Contoh: Susu UHT Diamond / Biji Espresso Blend"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Satuan Resep <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRawUnit}
                    onChange={(e) => setNewRawUnit(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="ml">mililiter (ml)</option>
                    <option value="gram">gram (g)</option>
                    <option value="pcs">pieces (pcs)</option>
                    <option value="cup">cup</option>
                    <option value="botol">botol</option>
                    <option value="pack">pack</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kemasan Beli <span className="text-slate-400 font-normal">(biasa dibeli)</span>
                  </label>
                  <input
                    type="text"
                    value={newRawBuyUnit}
                    onChange={(e) => setNewRawBuyUnit(e.target.value)}
                    placeholder="pack / karton / botol / dus"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Isi per Kemasan ({newRawUnit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newRawPackSize}
                    onChange={(e) => setNewRawPackSize(e.target.value)}
                    placeholder="Contoh: 1000"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Harga Beli per {newRawBuyUnit || "Kemasan"} (Rp)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newRawPackPrice}
                    onChange={(e) => setNewRawPackPrice(e.target.value)}
                    placeholder="Contoh: 19500"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Stok Awal ({newRawBuyUnit || "kemasan"})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newRawStock}
                    onChange={(e) => setNewRawStock(e.target.value)}
                    placeholder="0"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Supplier / Vendor <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={newRawNotes}
                    onChange={(e) => setNewRawNotes(e.target.value)}
                    placeholder="Contoh: CV Kopi Prima / Toko Susu"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={submittingNewRaw}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition flex items-center justify-center cursor-pointer disabled:bg-slate-300"
                  >
                    {submittingNewRaw ? "Menyimpan..." : "+ Tambah Bahan"}
                  </button>
                </div>
              </div>

              {/* Live Auto-Conversion Hint */}
              {parseFloat(newRawPackPrice) > 0 && parseFloat(newRawPackSize) > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">💡 Kalkulasi Otomatis Sistem:</span>
                    <span>
                      Harga <strong>{formatRupiah(parseFloat(newRawPackPrice))}</strong> / {newRawBuyUnit || "pack"} ({newRawPackSize} {newRawUnit}) ➔ HPP Resep:{" "}
                      <strong className="text-emerald-700">
                        {formatRupiah(parseFloat(newRawPackPrice) / parseFloat(newRawPackSize))} / {newRawUnit}
                      </strong>
                    </span>
                  </div>
                  {parseFloat(newRawStock) > 0 && (
                    <div className="text-[11px] font-semibold text-slate-700">
                      Stok awal dikonversi:{" "}
                      <strong className="text-slate-900">
                        {parseFloat(newRawStock) * parseFloat(newRawPackSize)} {newRawUnit}
                      </strong>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Tabel "Daftar Inventory" */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">Daftar Inventory Bahan Baku</h2>
                <p className="text-xs text-slate-500">Daftar bahan yang tersedia di gudang atau booth</p>
              </div>

              {/* Kolom Pencarian Bahan */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari bahan berdasarkan nama..."
                  value={rawSearchQuery}
                  onChange={(e) => setRawSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Bahan</th>
                    <th className="py-3.5 px-4">Jumlah (Stok)</th>
                    <th className="py-3.5 px-4">Satuan</th>
                    <th className="py-3.5 px-4">HPP Satuan</th>
                    <th className="py-3.5 px-4">Harga Beli Terakhir</th>
                    <th className="py-3.5 px-4">Vendor / Supplier</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingRaw ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Memuat data inventory bahan baku...
                      </td>
                    </tr>
                  ) : rawMaterialsData.materials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Belum ada bahan baku terdaftar. Silakan masukkan bahan baru di formulir atas.
                      </td>
                    </tr>
                  ) : (
                    rawMaterialsData.materials.map((m, idx) => {
                      const isLow = m.stock <= m.minStock;
                      const hasLastPrice = m.lastPurchasePrice !== null && m.lastPurchasePrice !== undefined && m.lastPurchasePrice > 0;
                      return (
                        <tr key={m.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4 text-slate-400 text-center font-mono">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{m.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                {m.category || "Bahan Minuman"}
                              </span>
                              {isLow && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                                  Stok Menipis (Batas: {m.minStock} {m.unit})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className={`font-black text-sm ${isLow ? "text-rose-600" : "text-slate-900"}`}>
                              {m.stock} <span className="text-xs font-semibold text-slate-500">{m.unit}</span>
                            </div>
                            {m.packSize && m.packSize > 1 ? (
                              <div className="text-[11px] font-medium text-slate-500">
                                ≈ {(m.stock / m.packSize).toFixed(1)} {m.buyUnit || "pack"}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-semibold">
                            <div>{m.unit}</div>
                            {m.packSize && m.packSize > 1 && (
                              <div className="text-[10px] text-slate-400">
                                1 {m.buyUnit || "pack"} = {m.packSize} {m.unit}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {m.costPerUnit > 0 ? (
                              <div>
                                <span className="text-emerald-700 font-bold">{formatRupiah(m.costPerUnit)}</span>
                                <span className="text-[10px] text-slate-500"> /{m.unit}</span>
                                {m.packSize && m.packSize > 1 && (
                                  <div className="text-[10px] text-slate-500 font-normal">
                                    ≈ {formatRupiah(Math.round(m.costPerUnit * m.packSize))} /{m.buyUnit || "pack"}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal">Belum dihitung</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {m.lastPackPrice ? (
                              <div>
                                <span className="text-amber-800 font-bold">{formatRupiah(m.lastPackPrice)}</span>
                                <span className="text-[10px] text-slate-500"> /{m.buyUnit || "pack"}</span>
                                <div className="text-[10px] text-slate-500 font-normal">
                                  ({formatRupiah(m.lastPurchasePrice || Math.round(m.lastPackPrice / (m.packSize || 1000)))} /{m.unit})
                                </div>
                              </div>
                            ) : hasLastPrice ? (
                              <span className="text-amber-800 font-bold">{formatRupiah(m.lastPurchasePrice)} /{m.unit}</span>
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {m.supplier ? (
                              <div className="flex items-center gap-1 font-medium">
                                <Building2 className="h-3 w-3 text-slate-400" />
                                <span>{m.supplier}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 1. Tombol Tambah Stok / Restock (+) */}
                              <button
                                type="button"
                                onClick={() => openRestockModal(m)}
                                className="h-8 w-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center font-black transition cursor-pointer shadow-xs"
                                title="Tambah Stok / Restock"
                              >
                                <Plus className="h-4 w-4" />
                              </button>

                              {/* 2. Tombol Riwayat Fluktuasi Harga (TrendingUp) */}
                              <button
                                type="button"
                                onClick={() => openPriceHistoryModal(m)}
                                className="h-8 w-8 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 flex items-center justify-center transition cursor-pointer"
                                title="Lihat Riwayat Fluktuasi Harga Vendor"
                              >
                                <TrendingUp className="h-3.5 w-3.5" />
                              </button>

                              {/* 3. Tombol Edit (Pensil) */}
                              <button
                                type="button"
                                onClick={() => openEditModal(m)}
                                className="h-8 w-8 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition cursor-pointer"
                                title="Edit Bahan Baku"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              {/* 4. Tombol Hapus (Tempat Sampah) */}
                              <button
                                type="button"
                                onClick={() => handleDeleteRaw(m.id, m.name)}
                                className="h-8 w-8 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 flex items-center justify-center transition cursor-pointer"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STOCK OPNAME FISIK & REKONSILIASI SELISIH */}
      {/* ========================================================================= */}
      {activeTab === "stock_opname" && (
        <div className="space-y-6">
          {/* Form Hitung Stock Opname */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 flex items-center justify-center font-bold">
                <Calculator className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Pemeriksaan Stock Opname Fisik</h2>
                <p className="text-[11px] text-slate-500">
                  Input hasil hitung fisik berkala untuk mencocokkan stok aktual di booth/gudang dengan stok sistem
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveOpname} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Bahan Baku</label>
                  <select
                    value={opnameRawId}
                    onChange={(e) => setOpnameRawId(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    {rawMaterialsData.materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Stok Tercatat di Sistem</label>
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
                    {systemStockVal} {selectedOpnameMaterial?.unit || ""}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Hasil Hitung Fisik (Aktual) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={opnamePhysicalStock}
                    onChange={(e) => setOpnamePhysicalStock(e.target.value)}
                    placeholder="Masukkan angka fisik..."
                    className="w-full text-xs font-black p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Dynamic Selisih Preview Banner */}
              {opnameDifference !== null && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    opnameDifference === 0
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : opnameDifference > 0
                      ? "bg-blue-50 border-blue-200 text-blue-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Kalkulasi Selisih:</span>
                    <span>
                      Stok Fisik ({physicalStockVal}) - Stok Sistem ({systemStockVal}) =
                    </span>
                    <span className="font-black text-sm">
                      {opnameDifference > 0 ? `+${opnameDifference}` : opnameDifference}{" "}
                      {selectedOpnameMaterial?.unit}
                    </span>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                    {opnameDifference === 0
                      ? "✅ Cocok / Sesuai"
                      : opnameDifference > 0
                      ? "📈 Surplus (+)"
                      : "📉 Susut / Kurang (-)"}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal Pemeriksaan Opname</label>
                  <input
                    type="date"
                    value={opnameDate}
                    onChange={(e) => setOpnameDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Catatan / Alasan Selisih</label>
                  <input
                    type="text"
                    value={opnameNotes}
                    onChange={(e) => setOpnameNotes(e.target.value)}
                    placeholder="Contoh: Audit akhir shift bazaar, tumpah saat operasional"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingOpname}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:bg-slate-300"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  <span>{submittingOpname ? "Menyimpan & Mengoreksi..." : "Simpan Hasil Opname & Koreksi Stok"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Riwayat Stock Opname (Audit Log) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900">Riwayat Stock Opname (Audit Log)</h2>
                <p className="text-xs text-slate-500">Histori hasil perhitungan fisik dan koreksi stok sistem</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">{opnameLogs.length} rekaman</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tanggal Opname</th>
                    <th className="py-3 px-4">Nama Bahan</th>
                    <th className="py-3 px-4">Stok Sistem Saat Itu</th>
                    <th className="py-3 px-4">Stok Fisik Aktual</th>
                    <th className="py-3 px-4">Selisih</th>
                    <th className="py-3 px-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingOpname ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Memuat riwayat stock opname...
                      </td>
                    </tr>
                  ) : opnameLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Belum ada riwayat stock opname yang tersimpan.
                      </td>
                    </tr>
                  ) : (
                    opnameLogs.map((log) => {
                      const diff = log.difference;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 text-slate-500 font-mono">{formatDate(log.opnameDate)}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{log.rawMaterial?.name}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {log.systemStock} {log.rawMaterial?.unit}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {log.physicalStock} {log.rawMaterial?.unit}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded font-black text-[11px] ${
                                diff === 0
                                  ? "bg-slate-100 text-slate-700"
                                  : diff > 0
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {diff > 0 ? `+${diff}` : diff} {log.rawMaterial?.unit}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 italic">{log.notes || "-"}</td>
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
      {/* TAB 3: STOK PRODUK JADI (EXISTING) */}
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
      {/* MODAL RESTOK BAHAN DENGAN FITUR PEMBELIAN PACK & FLUKTUASI HARGA VENDOR */}
      {/* ========================================================================= */}
      {isRestockRawOpen && selectedRawForRestock && (() => {
        const baseUnit = selectedRawForRestock.unit;
        const buyUnit = restockBuyUnit || selectedRawForRestock.buyUnit || "pack";
        const packSize = parseFloat(restockPackSize) || selectedRawForRestock.packSize || (baseUnit === "gram" || baseUnit === "ml" ? 1000 : 1);
        
        const isPackMode = restockInputMode === "pack";
        const pQty = parseFloat(restockPackQty) || 0;
        const pPrice = parseFloat(restockPackPrice) || 0;
        const bQty = parseFloat(restockRawQty) || 0;
        const bPrice = parseFloat(restockPurchasePrice) || 0;

        // Effective quantities in recipe base units
        const effectiveQty = isPackMode ? pQty * packSize : bQty;
        const effectiveUnitPrice = isPackMode ? (packSize > 0 ? pPrice / packSize : 0) : bPrice;
        const totalRestockCost = isPackMode ? Math.round(pQty * pPrice) : Math.round(bQty * bPrice);

        // Previous prices
        const prevUnitPrice = selectedRawForRestock.lastPurchasePrice || (selectedRawForRestock.costPerUnit > 0 ? selectedRawForRestock.costPerUnit : 0);
        const prevPackPrice = selectedRawForRestock.lastPackPrice || (prevUnitPrice > 0 ? Math.round(prevUnitPrice * packSize) : 0);

        // Fluctuation calculation
        const priceDiff = isPackMode
          ? (pPrice > 0 && prevPackPrice > 0 ? pPrice - prevPackPrice : 0)
          : (bPrice > 0 && prevUnitPrice > 0 ? bPrice - prevUnitPrice : 0);
        const priceDiffPercent = isPackMode
          ? (prevPackPrice > 0 ? (priceDiff / prevPackPrice) * 100 : 0)
          : (prevUnitPrice > 0 ? (priceDiff / prevUnitPrice) * 100 : 0);

        // Stock after calculation
        const currentStock = Math.max(0, selectedRawForRestock.stock);
        const totalStockAfter = currentStock + effectiveQty;

        // Simulated Weighted Average Cost (WAC)
        const currentVal = currentStock * (selectedRawForRestock.costPerUnit > 0 ? selectedRawForRestock.costPerUnit : prevUnitPrice);
        const incomingVal = effectiveQty * effectiveUnitPrice;
        const simulatedWAC = totalStockAfter > 0 ? (currentVal + incomingVal) / totalStockAfter : effectiveUnitPrice;
        const simulatedPackWAC = Math.round(simulatedWAC * packSize);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                    <PackagePlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      Restok Bahan & Update Harga
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Beli per kemasan/pack tanpa perlu hitung harga per gram/ml manual
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRestockRawOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                <form onSubmit={handleSaveRestock} className="space-y-4">
                  {/* Bahan Info Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Bahan Baku</div>
                      <div className="text-sm font-black text-slate-900">{selectedRawForRestock.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Kategori: <span className="font-semibold text-slate-700">{selectedRawForRestock.category || "Bahan Minuman"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stok Saat Ini</div>
                      <div className="text-sm font-black text-amber-700">
                        {selectedRawForRestock.stock} <span className="text-xs font-semibold text-slate-600">{selectedRawForRestock.unit}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {selectedRawForRestock.packSize && selectedRawForRestock.packSize > 1 ? (
                          <span>≈ {(selectedRawForRestock.stock / selectedRawForRestock.packSize).toFixed(1)} {selectedRawForRestock.buyUnit || "pack"}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Mode Selector Toggle */}
                  <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setRestockInputMode("pack")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isPackMode
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Package className="h-3.5 w-3.5" />
                      <span>Beli per Kemasan ({buyUnit})</span>
                      <span className="text-[9px] bg-slate-900/10 px-1.5 py-0.5 rounded font-black">Rekomendasi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestockInputMode("base")}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        !isPackMode
                          ? "bg-amber-500 text-slate-950 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>Input per {baseUnit}</span>
                    </button>
                  </div>

                  {/* Vendor / Supplier Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-amber-600" />
                        <span>Vendor / Toko Tempat Beli</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-normal">Pilih atau ketik vendor</span>
                    </div>
                    <input
                      list="supplier-options"
                      type="text"
                      value={restockSupplier}
                      onChange={(e) => setRestockSupplier(e.target.value)}
                      placeholder="Contoh: CV Mitra Kopi / Indogrosir / Toko Susu Lembang"
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                    />
                    <datalist id="supplier-options">
                      {suppliersList.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.code} - {s.name} {s.city ? `(${s.city})` : ""}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  {/* INPUT FIELDS: PACK MODE */}
                  {isPackMode ? (
                    <div className="space-y-3.5 p-4 rounded-2xl bg-amber-50/30 border border-amber-200/70">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Kemasan Pembelian
                          </label>
                          <input
                            type="text"
                            value={restockBuyUnit}
                            onChange={(e) => setRestockBuyUnit(e.target.value)}
                            placeholder="pack / karton / botol"
                            className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Isi per {buyUnit} ({baseUnit})
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            value={restockPackSize}
                            onChange={(e) => setRestockPackSize(e.target.value)}
                            placeholder="1000"
                            className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Jumlah {buyUnit} Dibeli <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            required
                            value={restockPackQty}
                            onChange={(e) => setRestockPackQty(e.target.value)}
                            placeholder="Contoh: 3"
                            className="w-full text-xs font-black p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Harga per {buyUnit} (Rp) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            required
                            value={restockPackPrice}
                            onChange={(e) => setRestockPackPrice(e.target.value)}
                            placeholder={prevPackPrice > 0 ? String(prevPackPrice) : "Contoh: 19500"}
                            className="w-full text-xs font-black p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      {/* Live Auto-Conversion Card */}
                      {pQty > 0 && packSize > 0 && (
                        <div className="p-3 rounded-xl bg-white border border-amber-300 shadow-2xs space-y-1.5">
                          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            <span>Kalkulasi Otomatis Sistem</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-slate-500">Stok Masuk: </span>
                              <strong className="text-slate-900 font-black">
                                +{pQty * packSize} {baseUnit}
                              </strong>
                              <span className="text-[10px] text-slate-400 block font-normal">
                                ({pQty} {buyUnit} × {packSize} {baseUnit})
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500">HPP Satuan Resep: </span>
                              <strong className="text-emerald-700 font-black">
                                {pPrice > 0 ? formatRupiah(pPrice / packSize) : "-"} /{baseUnit}
                              </strong>
                              <span className="text-[10px] text-slate-400 block font-normal">
                                (Rp {pPrice.toLocaleString("id-ID")} ÷ {packSize})
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Fluktuasi Harga Pack Vendor Badge */}
                      {pPrice > 0 && prevPackPrice > 0 && (
                        <div>
                          {priceDiff > 0 ? (
                            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                              <TrendingUp className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                              <div>
                                <div className="font-bold">
                                  🔴 Harga Beli Naik +{formatRupiah(priceDiff)} (+{priceDiffPercent.toFixed(1)}%) per {buyUnit}
                                </div>
                                <p className="text-[11px] text-rose-700 mt-0.5">
                                  Sebelumnya: {formatRupiah(prevPackPrice)} /{buyUnit}. Sistem otomatis menyesuaikan HPP resep di bawah agar keuntungan booth tetap terjaga.
                                </p>
                              </div>
                            </div>
                          ) : priceDiff < 0 ? (
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                              <TrendingDown className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                              <div>
                                <div className="font-bold">
                                  🟢 Harga Beli Turun -{formatRupiah(Math.abs(priceDiff))} ({priceDiffPercent.toFixed(1)}%) per {buyUnit}
                                </div>
                                <p className="text-[11px] text-emerald-700 mt-0.5">
                                  Sebelumnya: {formatRupiah(prevPackPrice)} /{buyUnit}. Lebih hemat! Margin keuntungan per cup akan otomatis meningkat.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                              <span className="font-semibold">⚪ Harga Stabil (Sama persis dengan pembelian terakhir: {formatRupiah(prevPackPrice)} /{buyUnit}).</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* INPUT FIELDS: BASE UNIT MODE */
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Jumlah Restok <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            required
                            value={restockRawQty}
                            onChange={(e) => setRestockRawQty(e.target.value)}
                            placeholder="Contoh: 1000"
                            className="w-full text-xs font-black p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">Satuan</label>
                          <input
                            type="text"
                            readOnly
                            value={baseUnit}
                            className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Harga Beli Satuan (Rp) per {baseUnit}</span>
                          </label>
                          {prevUnitPrice > 0 && (
                            <span className="text-[11px] font-semibold text-slate-500">
                              Harga Terakhir: <strong className="text-slate-800">{formatRupiah(prevUnitPrice)}</strong>
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={restockPurchasePrice}
                          onChange={(e) => setRestockPurchasePrice(e.target.value)}
                          placeholder={prevUnitPrice > 0 ? String(prevUnitPrice) : "Masukkan harga beli"}
                          className="w-full text-xs font-black p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Pilihan Metode Kalkulasi HPP (Solusi Fluktuasi Harga) */}
                  {effectiveUnitPrice > 0 && (
                    <div className="p-3.5 rounded-2xl border border-amber-200/90 bg-amber-50/40 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                        <Calculator className="h-4 w-4 text-amber-600" />
                        <span>Metode Penentuan HPP (Harga Pokok Bahan)</span>
                      </div>

                      <div className="space-y-2">
                        {/* Option 1: Weighted Moving Average Cost */}
                        <label
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                            restockCostMethod === "average"
                              ? "bg-white border-amber-500 shadow-xs"
                              : "bg-transparent border-slate-200 hover:bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="costMethod"
                            value="average"
                            checked={restockCostMethod === "average"}
                            onChange={() => setRestockCostMethod("average")}
                            className="mt-0.5 text-amber-600 focus:ring-amber-500"
                          />
                          <div className="flex-1">
                            <div className="font-bold text-slate-900 flex items-center justify-between">
                              <span>Rata-Rata Bergerak (Weighted Average)</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                Direkomendasikan
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                              Menggabungkan sisa stok lama ({currentStock} {baseUnit} @ {formatRupiah(selectedRawForRestock.costPerUnit || prevUnitPrice)}) dengan stok baru ({effectiveQty} {baseUnit} @ {formatRupiah(effectiveUnitPrice)}).
                            </p>
                            <div className="text-xs font-black text-emerald-700 mt-1">
                              ➔ HPP Resep Baru: {formatRupiah(simulatedWAC)} /{baseUnit}
                              {packSize > 1 ? (
                                <span className="text-[11px] text-slate-600 font-normal ml-1.5">
                                  (≈ {formatRupiah(simulatedPackWAC)} /{buyUnit})
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </label>

                        {/* Option 2: Latest Price */}
                        <label
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                            restockCostMethod === "latest"
                              ? "bg-white border-amber-500 shadow-xs"
                              : "bg-transparent border-slate-200 hover:bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="costMethod"
                            value="latest"
                            checked={restockCostMethod === "latest"}
                            onChange={() => setRestockCostMethod("latest")}
                            className="mt-0.5 text-amber-600 focus:ring-amber-500"
                          />
                          <div className="flex-1">
                            <div className="font-bold text-slate-900">Gunakan Harga Pembelian Terakhir (Latest Price)</div>
                            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                              Langsung mengganti HPP bahan baku mengikuti harga beli vendor saat ini.
                            </p>
                            <div className="text-xs font-black text-amber-700 mt-1">
                              ➔ HPP Baru: {formatRupiah(effectiveUnitPrice)} /{baseUnit}
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Tanggal & Catatan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal Pembelian / Restok</label>
                      <input
                        type="date"
                        required
                        value={restockRawDate}
                        onChange={(e) => setRestockRawDate(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">No Faktur / Catatan (Opsional)</label>
                      <input
                        type="text"
                        value={restockRawNotes}
                        onChange={(e) => setRestockRawNotes(e.target.value)}
                        placeholder="Contoh: Nota #INV-8890, promo grosir"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Total Belanja & Checkbox Catat ke Kas */}
                  {totalRestockCost > 0 && (
                    <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Biaya Belanja Restok</div>
                        <div className="text-lg font-black text-amber-400">{formatRupiah(totalRestockCost)}</div>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200 hover:text-white">
                        <input
                          type="checkbox"
                          checked={restockRecordCash}
                          onChange={(e) => setRestockRecordCash(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-600 text-amber-500 focus:ring-amber-500"
                        />
                        <span>Catat otomatis ke Buku Kas (Pengeluaran)</span>
                      </label>
                    </div>
                  )}

                  {/* Tombol Simpan */}
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRestockRawOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submittingRestockRaw}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer disabled:bg-slate-300 flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{submittingRestockRaw ? "Menyimpan..." : "Simpan Restok"}</span>
                    </button>
                  </div>
                </form>

                {/* Panel Riwayat Restok & Fluktuasi Harga Bahan ini */}
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                      <History className="h-3.5 w-3.5 text-amber-500" />
                      <span>Riwayat Pembelian & Fluktuasi Harga ({selectedRawForRestock.name})</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{rawRestockHistory.length} mutasi</span>
                  </div>

                  {loadingRestockHistory ? (
                    <div className="text-xs text-slate-400 py-4 text-center">Memuat riwayat pembelian...</div>
                  ) : rawRestockHistory.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-xl border border-slate-100">
                      Belum ada riwayat pembelian untuk bahan baku ini.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3 w-8 text-center">No</th>
                            <th className="py-2 px-3">Tanggal</th>
                            <th className="py-2 px-3">Vendor</th>
                            <th className="py-2 px-3 text-right">Qty</th>
                            <th className="py-2 px-3 text-right">Harga Satuan</th>
                            <th className="py-2 px-3 text-center">Status Harga</th>
                            <th className="py-2 px-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {rawRestockHistory.map((item, idx) => {
                            const isNaik = item.priceDiff && item.priceDiff > 0;
                            const isTurun = item.priceDiff && item.priceDiff < 0;
                            return (
                              <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                <td className="py-2 px-3 text-slate-400 text-center">{idx + 1}</td>
                                <td className="py-2 px-3 text-slate-600 font-sans">{formatDate(item.createdAt)}</td>
                                <td className="py-2 px-3 text-slate-800 font-sans font-medium">{item.supplierName || "-"}</td>
                                <td className="py-2 px-3 text-right font-bold text-emerald-600 font-sans">
                                  +{item.changeQty} {selectedRawForRestock.unit}
                                </td>
                                <td className="py-2 px-3 text-right font-semibold text-slate-800 font-sans">
                                  {item.purchasePrice ? formatRupiah(item.purchasePrice) : "-"}
                                </td>
                                <td className="py-2 px-3 text-center font-sans">
                                  {isNaik ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                      ▲ +{item.priceDiffPercent?.toFixed(1)}%
                                    </span>
                                  ) : isTurun ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                      ▼ {item.priceDiffPercent?.toFixed(1)}%
                                    </span>
                                  ) : item.purchasePrice ? (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                                      • Stabil
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right font-bold text-slate-900 font-sans">
                                  {item.totalCost ? formatRupiah(item.totalCost) : "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL KHUSUS: RIWAYAT FLUKTUASI HARGA VENDOR & AUDIT INFLASI BAHAN */}
      {/* ========================================================================= */}
      {isPriceHistoryOpen && selectedRawForPriceHistory && (() => {
        const validPrices = priceHistories
          .map((h) => h.purchasePrice)
          .filter((p): p is number => typeof p === "number" && p > 0);
        const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
        const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : null;
        const avgPrice = validPrices.length > 0 ? Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length) : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-bold shadow-xs">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      Riwayat Fluktuasi Harga Vendor
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Analisis histori perubahan harga beli dari supplier untuk bahan {selectedRawForPriceHistory.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPriceHistoryOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {/* Summary Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HPP Saat Ini</div>
                    <div className="text-sm font-black text-emerald-700 mt-0.5">
                      {selectedRawForPriceHistory.costPerUnit > 0 ? formatRupiah(selectedRawForPriceHistory.costPerUnit) : "-"}
                    </div>
                    <div className="text-[10px] text-slate-500">per {selectedRawForPriceHistory.unit}</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Harga Terakhir</div>
                    <div className="text-sm font-black text-amber-700 mt-0.5">
                      {selectedRawForPriceHistory.lastPurchasePrice ? formatRupiah(selectedRawForPriceHistory.lastPurchasePrice) : "-"}
                    </div>
                    <div className="text-[10px] text-slate-500">pembelian terakhir</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Harga Terendah</div>
                    <div className="text-sm font-black text-blue-700 mt-0.5">
                      {minPrice ? formatRupiah(minPrice) : "-"}
                    </div>
                    <div className="text-[10px] text-slate-500">historis terbaik</div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Harga Tertinggi</div>
                    <div className="text-sm font-black text-rose-700 mt-0.5">
                      {maxPrice ? formatRupiah(maxPrice) : "-"}
                    </div>
                    <div className="text-[10px] text-slate-500">historis termahal</div>
                  </div>
                </div>

                {/* Insight Banner */}
                {minPrice && maxPrice && maxPrice > minPrice && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 text-xs text-indigo-900 flex items-start gap-2.5">
                    <Info className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
                    <div>
                      <span className="font-bold">Insight Fluktuasi Harga:</span> Harga bahan ini berfluktuasi antara{" "}
                      <strong>{formatRupiah(minPrice)}</strong> hingga <strong>{formatRupiah(maxPrice)}</strong> (selisih{" "}
                      {formatRupiah(maxPrice - minPrice)}). Gunakan metode <em>Weighted Average Cost</em> saat restok untuk menjaga kestabilan harga jual menu minuman Anda.
                    </div>
                  </div>
                )}

                {/* History Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900">Histori Transaksi Pembelian</h4>
                    <span className="text-[11px] text-slate-400 font-mono">{priceHistories.length} catatan</span>
                  </div>

                  {loadingPriceHistory ? (
                    <div className="py-10 text-center text-xs text-slate-400">Memuat riwayat fluktuasi harga...</div>
                  ) : priceHistories.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                      Belum ada catatan harga pembelian untuk bahan ini.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-3.5">Tanggal</th>
                            <th className="py-3 px-3.5">Vendor / Supplier</th>
                            <th className="py-3 px-3.5 text-right">Jumlah Masuk</th>
                            <th className="py-3 px-3.5 text-right">Harga Satuan</th>
                            <th className="py-3 px-3.5 text-center">Perubahan</th>
                            <th className="py-3 px-3.5 text-right">Total Belanja</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {priceHistories.map((hist) => {
                            const isNaik = hist.priceDiff && hist.priceDiff > 0;
                            const isTurun = hist.priceDiff && hist.priceDiff < 0;
                            return (
                              <tr key={hist.id} className="hover:bg-slate-50/70 transition">
                                <td className="py-3 px-3.5 text-slate-500 font-mono">{formatDate(hist.createdAt)}</td>
                                <td className="py-3 px-3.5 font-bold text-slate-900">
                                  {hist.supplierName || hist.rawMaterial?.supplier || "-"}
                                </td>
                                <td className="py-3 px-3.5 text-right font-bold text-emerald-600">
                                  +{hist.changeQty} {selectedRawForPriceHistory.unit}
                                  {hist.packQty ? (
                                    <span className="block text-[10px] font-normal text-slate-500">
                                      ({hist.packQty} {hist.buyUnit || "pack"})
                                    </span>
                                  ) : null}
                                </td>
                                <td className="py-3 px-3.5 text-right font-black text-slate-900">
                                  {hist.purchasePrice ? formatRupiah(hist.purchasePrice) : "-"}
                                  {hist.packPrice ? (
                                    <span className="block text-[10px] font-normal text-slate-500">
                                      ({formatRupiah(hist.packPrice)} /{hist.buyUnit || "pack"})
                                    </span>
                                  ) : null}
                                </td>
                                <td className="py-3 px-3.5 text-center">
                                  {isNaik ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                      ▲ +{hist.priceDiffPercent?.toFixed(1)}%
                                    </span>
                                  ) : isTurun ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                      ▼ {hist.priceDiffPercent?.toFixed(1)}%
                                    </span>
                                  ) : hist.purchasePrice ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                                      • Stabil
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="py-3 px-3.5 text-right font-bold text-slate-700">
                                  {hist.totalCost ? formatRupiah(hist.totalCost) : "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPriceHistoryOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL EDIT BAHAN BAKU */}
      {/* ========================================================================= */}
      {isEditRawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-black text-slate-900">Edit Detail Bahan Baku</h3>
              <button
                type="button"
                onClick={() => setIsEditRawModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Bahan</label>
                <input
                  type="text"
                  required
                  value={editRawName}
                  onChange={(e) => setEditRawName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={editRawCategory}
                    onChange={(e) => setEditRawCategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
                  >
                    <option value="Bahan Minuman">Bahan Minuman</option>
                    <option value="Kopi">Kopi</option>
                    <option value="Dairy/Susu">Dairy/Susu</option>
                    <option value="Sirup & Flavour">Sirup & Flavour</option>
                    <option value="Kemasan & Packaging">Kemasan & Packaging</option>
                    <option value="Topping & Tambahan">Topping & Tambahan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Satuan</label>
                  <select
                    value={editRawUnit}
                    onChange={(e) => setEditRawUnit(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900"
                  >
                    <option value="gram">gram (g)</option>
                    <option value="ml">mililiter (ml)</option>
                    <option value="pcs">pieces (pcs)</option>
                    <option value="kg">kilogram (kg)</option>
                    <option value="liter">liter (L)</option>
                    <option value="botol">botol</option>
                    <option value="pack">pack / dus</option>
                    <option value="cup">cup</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Batas Min. Alert ({editRawUnit})</label>
                  <input
                    type="number"
                    step="any"
                    value={editRawMinStock}
                    onChange={(e) => setEditRawMinStock(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">HPP per {editRawUnit} (Rp)</label>
                  <input
                    type="number"
                    step="any"
                    value={editRawCostPerUnit}
                    onChange={(e) => setEditRawCostPerUnit(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Data Kemasan Pembelian */}
              <div className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2.5">
                <div className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-amber-600" />
                  <span>Pengaturan Kemasan Pembelian (Pack/Karton)</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Kemasan Beli</label>
                    <input
                      type="text"
                      value={editRawBuyUnit}
                      onChange={(e) => setEditRawBuyUnit(e.target.value)}
                      placeholder="pack / karton"
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Isi ({editRawUnit})</label>
                    <input
                      type="number"
                      step="any"
                      value={editRawPackSize}
                      onChange={(e) => {
                        const newSize = e.target.value;
                        setEditRawPackSize(newSize);
                        const p = parseFloat(editRawPackPrice);
                        const s = parseFloat(newSize);
                        if (p > 0 && s > 0) {
                          setEditRawCostPerUnit((p / s).toFixed(2));
                        }
                      }}
                      placeholder="1000"
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Harga / {editRawBuyUnit || "pack"}</label>
                    <input
                      type="number"
                      step="any"
                      value={editRawPackPrice}
                      onChange={(e) => {
                        const newPrice = e.target.value;
                        setEditRawPackPrice(newPrice);
                        const p = parseFloat(newPrice);
                        const s = parseFloat(editRawPackSize);
                        if (p > 0 && s > 0) {
                          setEditRawCostPerUnit((p / s).toFixed(2));
                        }
                      }}
                      placeholder="Contoh: 19500"
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold text-slate-900"
                    />
                  </div>
                </div>
                {parseFloat(editRawPackPrice) > 0 && parseFloat(editRawPackSize) > 0 && (
                  <div className="text-[10px] text-amber-800 font-medium">
                    💡 HPP otomatis terhitung: {formatRupiah(parseFloat(editRawPackPrice) / parseFloat(editRawPackSize))} /{editRawUnit}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Keterangan / Supplier</label>
                <input
                  type="text"
                  value={editRawSupplier}
                  onChange={(e) => setEditRawSupplier(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-slate-900"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditRawModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEditRaw}
                  className="flex-1 py-2.5 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-sm disabled:bg-slate-300"
                >
                  {submittingEditRaw ? "Menyimpan..." : "Simpan Perubahan"}
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
