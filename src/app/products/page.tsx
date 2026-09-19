"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format";
import {
  UtensilsCrossed,
  Layers,
  PlusCircle,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  X,
  TrendingUp,
  Image as ImageIcon,
  Upload,
  UploadCloud,
  Loader2,
} from "lucide-react";

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("all");

  // Raw Materials for Recipe
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [prodIngredients, setProdIngredients] = useState<{ rawMaterialId: string; amount: number }[]>([]);
  const [autoCalcCost, setAutoCalcCost] = useState(false);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [prodName, setProdName] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodCost, setProdCost] = useState<number>(0);
  const [prodStock, setProdStock] = useState<number>(0);
  const [prodUnit, setProdUnit] = useState("cup");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodIsActive, setProdIsActive] = useState(true);
  const [submittingProd, setSubmittingProd] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ukuran < 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah foto");
      }

      setProdImageUrl(data.url);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Gagal mengunggah foto");
    } finally {
      setUploadingImage(false);
    }
  };

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [catName, setCatName] = useState("");
  const [catDescription, setCatDescription] = useState("");
  const [submittingCat, setSubmittingCat] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, rawRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/raw-materials"),
      ]);
      const [prods, cats, rawData] = await Promise.all([
        prodRes.json(),
        catRes.json(),
        rawRes.json(),
      ]);
      if (Array.isArray(prods)) setProducts(prods);
      if (Array.isArray(cats)) setCategories(cats);
      if (rawData && Array.isArray(rawData.materials)) setRawMaterials(rawData.materials);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Recipe handlers
  const handleAddIngredient = () => {
    if (rawMaterials.length === 0) return;
    setProdIngredients((prev) => [
      ...prev,
      { rawMaterialId: rawMaterials[0].id, amount: 1 },
    ]);
  };

  const handleRemoveIngredient = (index: number) => {
    setProdIngredients((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleIngredientChange = (
    index: number,
    field: "rawMaterialId" | "amount",
    value: any
  ) => {
    setProdIngredients((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const calculatedHpp = prodIngredients.reduce((sum, ing) => {
    const raw = rawMaterials.find((r) => r.id === ing.rawMaterialId);
    if (!raw) return sum;
    return sum + (Number(ing.amount) || 0) * (raw.costPerUnit || 0);
  }, 0);

  // Product Form Open
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setProdName("");
    setProdCategoryId(categories.length > 0 ? categories[0].id : "");
    setProdPrice(0);
    setProdCost(0);
    setProdStock(0);
    setProdUnit("cup");
    setProdImageUrl("");
    setProdIsActive(true);
    setProdIngredients([]);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: any) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCategoryId(p.categoryId);
    setProdPrice(p.price);
    setProdCost(p.cost);
    setProdStock(p.stock);
    setProdUnit(p.unit);
    setProdImageUrl(p.imageUrl || "");
    setProdIsActive(p.isActive);
    if (p.ingredients && Array.isArray(p.ingredients)) {
      setProdIngredients(
        p.ingredients.map((i: any) => ({
          rawMaterialId: i.rawMaterialId,
          amount: i.amount,
        }))
      );
    } else {
      setProdIngredients([]);
    }
    setIsProductModalOpen(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProd(true);

    try {
      const url = "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const payload = {
        ...(editingProduct && { id: editingProduct.id }),
        name: prodName,
        categoryId: prodCategoryId,
        price: prodPrice,
        cost: prodCost,
        stock: prodStock,
        unit: prodUnit,
        imageUrl: prodImageUrl,
        isActive: prodIsActive,
        ingredients: prodIngredients.filter((i) => i.rawMaterialId && i.amount > 0),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan produk");
      }

      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingProd(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Hapus produk menu ini?")) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Category Actions
  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setCatDescription("");
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (c: any) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatDescription(c.description || "");
    setIsCategoryModalOpen(true);
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCat(true);

    try {
      const url = "/api/categories";
      const method = editingCategory ? "PUT" : "POST";
      const payload = {
        ...(editingCategory && { id: editingCategory.id }),
        name: catName,
        description: catDescription,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan kategori");
      }

      setIsCategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Hapus kategori ini? Seluruh produk di dalamnya juga akan terhapus.")) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCatFilter === "all" || p.categoryId === selectedCatFilter;
    const matchSearch =
      !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Calculate margin
  const marginNominal = prodPrice - prodCost;
  const marginPercent = prodPrice > 0 ? Math.round((marginNominal / prodPrice) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Produk & Kategori</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola daftar menu makanan, minuman booth, harga jual, HPP/modal, dan kategori
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "products" ? (
            <button
              onClick={handleOpenNewProduct}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition"
            >
              <PlusCircle className="h-4 w-4" />
              Tambah Menu Baru
            </button>
          ) : (
            <button
              onClick={handleOpenNewCategory}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition"
            >
              <PlusCircle className="h-4 w-4" />
              Tambah Kategori
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "products"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <UtensilsCrossed className="h-3.5 w-3.5" />
          Daftar Menu ({products.length})
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === "categories"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Kategori Menu ({categories.length})
        </button>
      </div>

      {/* Tab 1: Products */}
      {activeTab === "products" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500">Filter Kategori:</span>
              <select
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="text-xs font-semibold bg-white text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama menu..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Menu & Foto</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Harga Jual</th>
                    <th className="py-3 px-3">Modal (HPP)</th>
                    <th className="py-3 px-3">Margin Laba</th>
                    <th className="py-3 px-3">Stok Jadi</th>
                    <th className="py-3 px-3">Bahan Baku & Kesiapan</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const profit = p.price - p.cost;
                    const margin = p.price > 0 ? Math.round((profit / p.price) * 100) : 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="h-10 w-10 rounded-lg object-cover bg-slate-100"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                                {p.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900">{p.name}</div>
                              <div className="text-[10px] text-slate-400">Satuan: {p.unit}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {p.category?.name}
                        </td>

                        <td className="py-3 px-3 font-bold text-slate-900">
                          {formatRupiah(p.price)}
                        </td>

                        <td className="py-3 px-3 text-slate-500 font-medium">
                          {formatRupiah(p.cost)}
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-emerald-700">
                            {formatRupiah(profit)}
                          </span>{" "}
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded font-semibold">
                            +{margin}%
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`font-bold px-2 py-0.5 rounded ${
                              p.stock <= 0
                                ? "bg-rose-100 text-rose-800"
                                : p.stock <= 10
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {p.stock} {p.unit}
                          </span>
                        </td>

                        {/* Status Bahan Baku / Recipe */}
                        <td className="py-3 px-3">
                          {p.ingredients && p.ingredients.length > 0 ? (
                            p.isAvailableByIngredients === false ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                                  ⚠️ Bahan Habis
                                </span>
                                <div
                                  className="text-[10px] text-rose-600 font-semibold truncate max-w-[130px]"
                                  title={`Bahan kurang: ${(p.missingIngredients || [])
                                    .map((m: any) => `${m.name} (kurang ${m.shortage} ${m.unit})`)
                                    .join(", ")}`}
                                >
                                  {(p.missingIngredients || []).map((m: any) => m.name).join(", ")}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  ✓ Bahan Siap
                                </span>
                                <div className="text-[10px] text-slate-500 font-medium">
                                  Maks: <strong>{p.maxProducible ?? "∞"}</strong> {p.unit}
                                </div>
                              </div>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              Stok Siap Jual
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {p.isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              <CheckCircle2 className="h-3 w-3" /> Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              <XCircle className="h-3 w-3" /> Nonaktif
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="Edit Menu"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Hapus Menu"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Categories */}
      {activeTab === "categories" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-base text-slate-900">{c.name}</h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditCategory(c)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-1">
                  {c.description || "Tidak ada deskripsi"}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600 flex justify-between">
                <span>Total Menu Terdaftar:</span>
                <span className="font-bold text-slate-900">{c._count?.products || 0} menu</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Tambah / Edit Produk */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingProduct ? "Edit Menu Produk" : "Tambah Menu Produk Baru"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Produk / Menu *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Contoh: Matcha Oat Latte"
                  className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kategori *</label>
                  <select
                    required
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Satuan Takaran *</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="cup">Cup</option>
                    <option value="pcs">Pcs</option>
                    <option value="porsi">Porsi</option>
                    <option value="box">Box</option>
                    <option value="botol">Botol</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Harga Jual (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodPrice || ""}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Modal / HPP (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={prodCost || ""}
                    onChange={(e) => setProdCost(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Profit preview card */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <div className="text-emerald-800">
                  <span className="font-bold">Estimasi Keuntungan: </span>
                  {formatRupiah(marginNominal)} / {prodUnit}
                </div>
                <div className="font-black text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                  Margin: {marginPercent}%
                </div>
              </div>

              {/* Komposisi & Resep Bahan Baku (BOM) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      Komposisi / Resep Bahan Baku per 1 {prodUnit}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Jika bahan habis di gudang, produk otomatis dinonaktifkan di kasir POS.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="text-xs font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>+ Bahan</span>
                  </button>
                </div>

                {prodIngredients.length === 0 ? (
                  <div className="p-3 rounded-xl bg-white border border-dashed border-slate-300 text-center text-xs text-slate-400">
                    Belum ada resep bahan baku. Klik <strong>"+ Bahan"</strong> untuk mengaitkan stok bahan baku (cth: 18g Biji Kopi, 150ml Susu, 1 pcs Cup).
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {prodIngredients.map((ing, idx) => {
                      const selectedMat = rawMaterials.find((r) => r.id === ing.rawMaterialId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200"
                        >
                          <select
                            value={ing.rawMaterialId}
                            onChange={(e) =>
                              handleIngredientChange(idx, "rawMaterialId", e.target.value)
                            }
                            className="flex-1 text-xs font-semibold p-1.5 rounded-lg border border-slate-300 text-slate-900 bg-white"
                          >
                            {rawMaterials.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} (Sisa: {r.stock} {r.unit})
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              value={ing.amount}
                              onChange={(e) =>
                                handleIngredientChange(
                                  idx,
                                  "amount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-16 text-xs font-bold p-1.5 rounded-lg border border-slate-300 text-center text-slate-900"
                            />
                            <span className="text-[11px] text-slate-500 font-medium w-9 truncate">
                              {selectedMat?.unit || "unit"}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                            title="Hapus baris bahan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {prodIngredients.length > 0 && (
                  <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-200">
                    <span className="text-slate-600">
                      HPP Bahan Baku:{" "}
                      <strong className="text-slate-900">{formatRupiah(calculatedHpp)}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setProdCost(Math.round(calculatedHpp))}
                      className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      Terapkan ke Modal/HPP
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    value={prodStock || ""}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Status Penjualan</label>
                  <select
                    value={prodIsActive ? "active" : "inactive"}
                    onChange={(e) => setProdIsActive(e.target.value === "active")}
                    className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="active">Aktif (Tampil di Kasir)</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              {/* Tambah Gambar Produk (Upload & URL) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Foto Menu Produk</label>
                
                {prodImageUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <img
                      src={prodImageUrl}
                      alt="Preview Foto"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-300 shadow-2xs"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">Foto Produk Terpilih</p>
                      <p className="text-[11px] text-slate-500 truncate">{prodImageUrl}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg transition">
                          <Upload className="h-3 w-3" />
                          Ganti Foto
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setProdImageUrl("")}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition"
                        >
                          <Trash2 className="h-3 w-3" />
                          Hapus Foto
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50/60 hover:bg-amber-50/20 text-center transition">
                    <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                      <div className="p-2.5 rounded-full bg-white shadow-xs border border-slate-200 text-amber-600">
                        {uploadingImage ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <UploadCloud className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-amber-600 hover:underline">
                          {uploadingImage ? "Mengunggah foto..." : "Klik untuk pilih foto dari perangkat"}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Mendukung format JPG, PNG, WebP (maks. 5MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                )}

                {/* Input manual URL alternatif */}
                <div className="pt-1">
                  <details className="group text-[11px] text-slate-500">
                    <summary className="cursor-pointer font-medium hover:text-slate-800 select-none">
                      Opsi: Masukkan tautan URL gambar eksternal
                    </summary>
                    <div className="mt-1.5">
                      <input
                        type="text"
                        value={prodImageUrl}
                        onChange={(e) => setProdImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full text-xs p-2 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </details>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProd}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition"
                >
                  {submittingProd ? "Menyimpan..." : "Simpan Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah / Edit Kategori */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCategory} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Kategori *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Contoh: Artisan Tea"
                  className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Deskripsi kategori..."
                  className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCat}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition"
                >
                  {submittingCat ? "Menyimpan..." : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
