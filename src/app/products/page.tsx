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

interface VariantIngredientItem {
  rawMaterialId: string;
  amount: number;
}

interface VariantFormItem {
  id?: string;
  packaging: string; // "Cup" | "Botol"
  size: string; // "Reguler", "Large", "250 ML", "1.000 ML"
  price: number;
  cost: number;
  stock: number;
  isActive: boolean;
  ingredients: VariantIngredientItem[];
}

const DEFAULT_VARIANTS_TEMPLATE: VariantFormItem[] = [
  { packaging: "Cup", size: "Reguler", price: 13000, cost: 6000, stock: 50, isActive: true, ingredients: [] },
  { packaging: "Cup", size: "Large", price: 16000, cost: 8000, stock: 50, isActive: true, ingredients: [] },
  { packaging: "Botol", size: "250 ML", price: 15000, cost: 7000, stock: 25, isActive: true, ingredients: [] },
  { packaging: "Botol", size: "1.000 ML", price: 55000, cost: 25000, stock: 10, isActive: true, ingredients: [] },
];

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatFilter, setSelectedCatFilter] = useState("all");

  // Raw Materials for Recipe
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [autoCalcCost, setAutoCalcCost] = useState(false);

  // Active Variant Tab Switcher in Recipe Editor
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number>(0);
  const [copySourceIdx, setCopySourceIdx] = useState<number | null>(null);

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
  const [prodVariants, setProdVariants] = useState<VariantFormItem[]>(DEFAULT_VARIANTS_TEMPLATE);
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

  // Per-Variant Recipe Handlers
  const handleAddVariantIngredient = (variantIdx: number) => {
    if (rawMaterials.length === 0) return;
    setProdVariants((prev) =>
      prev.map((v, idx) => {
        if (idx !== variantIdx) return v;
        const currentIngs = v.ingredients || [];
        return {
          ...v,
          ingredients: [
            ...currentIngs,
            { rawMaterialId: rawMaterials[0].id, amount: 1 },
          ],
        };
      })
    );
  };

  const handleRemoveVariantIngredient = (variantIdx: number, ingIdx: number) => {
    setProdVariants((prev) =>
      prev.map((v, idx) => {
        if (idx !== variantIdx) return v;
        return {
          ...v,
          ingredients: (v.ingredients || []).filter((_, i) => i !== ingIdx),
        };
      })
    );
  };

  const handleVariantIngredientChange = (
    variantIdx: number,
    ingIdx: number,
    field: "rawMaterialId" | "amount",
    value: any
  ) => {
    setProdVariants((prev) =>
      prev.map((v, idx) => {
        if (idx !== variantIdx) return v;
        return {
          ...v,
          ingredients: (v.ingredients || []).map((ing, i) =>
            i === ingIdx ? { ...ing, [field]: value } : ing
          ),
        };
      })
    );
  };

  const handleCopyRecipe = (targetIdx: number, sourceIdx: number) => {
    const source = prodVariants[sourceIdx];
    if (!source || !source.ingredients || source.ingredients.length === 0) {
      alert("Varian sumber belum memiliki resep untuk disalin.");
      return;
    }
    const cloned = JSON.parse(JSON.stringify(source.ingredients));
    setProdVariants((prev) =>
      prev.map((v, idx) => (idx === targetIdx ? { ...v, ingredients: cloned } : v))
    );
    setCopySourceIdx(null);
  };

  const calculateVariantHpp = (variant?: VariantFormItem) => {
    if (!variant || !variant.ingredients) return 0;
    return variant.ingredients.reduce((sum, ing) => {
      const raw = rawMaterials.find((r) => r.id === ing.rawMaterialId);
      if (!raw) return sum;
      return sum + (Number(ing.amount) || 0) * (raw.costPerUnit || 0);
    }, 0);
  };

  const handleApplyHppToVariant = (variantIdx: number) => {
    const v = prodVariants[variantIdx];
    if (!v) return;
    const hpp = calculateVariantHpp(v);
    const rounded = Math.round(hpp * 100) / 100;
    updateVariant(variantIdx, "cost", rounded);
    if (variantIdx === 0) {
      setProdCost(rounded);
    }
  };

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
    setProdVariants(
      DEFAULT_VARIANTS_TEMPLATE.map((v) => ({ ...v, ingredients: [] }))
    );
    setSelectedVariantIdx(0);
    setCopySourceIdx(null);
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
    setSelectedVariantIdx(0);
    setCopySourceIdx(null);

    if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
      setProdVariants(
        p.variants.map((v: any) => ({
          id: v.id,
          packaging: v.packaging || "Cup",
          size: v.size,
          price: v.price,
          cost: v.cost,
          stock: v.stock,
          isActive: v.isActive,
          ingredients: Array.isArray(v.ingredients)
            ? v.ingredients.map((ing: any) => ({
                rawMaterialId: ing.rawMaterialId,
                amount: Number(ing.amount) || 0,
              }))
            : [],
        }))
      );
    } else {
      setProdVariants(
        DEFAULT_VARIANTS_TEMPLATE.map((v) => ({ ...v, ingredients: [] }))
      );
    }

    setIsProductModalOpen(true);
  };

  const updateVariant = (index: number, field: keyof VariantFormItem, value: any) => {
    setProdVariants((prev) => {
      const updated = prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item));
      if (index === 0 && field === "price" && (!prodPrice || prodPrice === prev[0].price)) {
        setProdPrice(Number(value));
      }
      if (index === 0 && field === "cost" && (!prodCost || prodCost === prev[0].cost)) {
        setProdCost(Number(value));
      }
      return updated;
    });
  };

  const toggleVariantActive = (index: number) => {
    setProdVariants((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, isActive: !item.isActive } : item))
    );
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProd(true);

    try {
      const primaryVariant = prodVariants.find((v) => v.isActive) || prodVariants[0];
      const effectivePrice = editingProduct
        ? (primaryVariant ? primaryVariant.price : prodPrice)
        : (prodPrice > 0 ? prodPrice : (primaryVariant?.price || 0));
      const effectiveCost = editingProduct
        ? (primaryVariant ? primaryVariant.cost : prodCost)
        : (prodCost > 0 ? prodCost : (primaryVariant?.cost || 0));

      const url = "/api/products";
      const method = editingProduct ? "PUT" : "POST";
      const payload = {
        ...(editingProduct && { id: editingProduct.id }),
        name: prodName,
        categoryId: prodCategoryId,
        price: effectivePrice,
        cost: effectiveCost,
        stock: prodStock,
        unit: prodUnit,
        imageUrl: prodImageUrl,
        isActive: prodIsActive,
        variants: prodVariants.map((v) => ({
          id: v.id,
          packaging: v.packaging,
          size: v.size,
          price: v.price,
          cost: v.cost,
          stock: v.stock,
          isActive: v.isActive,
          ingredients: (v.ingredients || []).filter(
            (ing) => ing.rawMaterialId && Number(ing.amount) > 0
          ),
        })),
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
          <h1 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">Produk & Kategori</h1>
          <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
            Kelola daftar menu makanan, minuman booth, harga jual, HPP/modal, dan kategori
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "products" ? (
            <button
              onClick={handleOpenNewProduct}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs shadow-md transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              Tambah Menu Baru
            </button>
          ) : (
            <button
              onClick={handleOpenNewCategory}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5c3826] hover:bg-[#46291a] text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              Tambah Kategori
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-stone-300 dark:border-stone-700 pb-2">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "products"
              ? "bg-[#5c3826] text-white shadow-xs"
              : "text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800"
          }`}
        >
          <UtensilsCrossed className="h-3.5 w-3.5" />
          Daftar Menu ({products.length})
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === "categories"
              ? "bg-[#5c3826] text-white shadow-xs"
              : "text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800"
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
          <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-stone-700">Filter Kategori:</span>
              <select
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="text-xs font-bold bg-white text-stone-900 border border-stone-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5c3826]"
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
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama menu..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl bg-white text-stone-900 placeholder:text-stone-400 border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#5c3826]"
              />
            </div>
          </div>

          {/* Product Table - High Contrast White Card */}
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f7efe6] text-stone-800 font-bold border-b border-stone-200">
                  <tr>
                    <th className="py-3.5 px-4 font-black">Menu & Foto</th>
                    <th className="py-3.5 px-3 font-black">Kategori</th>
                    <th className="py-3.5 px-3 font-black">Harga Jual</th>
                    <th className="py-3.5 px-3 font-black">Modal (HPP)</th>
                    <th className="py-3.5 px-3 font-black">Margin Laba</th>
                    <th className="py-3.5 px-3 font-black">Stok Jadi</th>
                    <th className="py-3.5 px-3 font-black">Bahan Baku & Kesiapan</th>
                    <th className="py-3.5 px-3 font-black">Status</th>
                    <th className="py-3.5 px-4 text-right font-black">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {filteredProducts.map((p) => {
                    const profit = p.price - p.cost;
                    const margin = p.price > 0 ? Math.round((profit / p.price) * 100) : 0;

                    return (
                      <tr key={p.id} className="hover:bg-[#faf8f5] transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="h-10 w-10 rounded-lg object-cover bg-stone-100 border border-stone-200"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-[#f3eae0] text-[#5c3826] font-black flex items-center justify-center text-xs border border-[#e2d0bd]">
                                {p.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-black text-sm text-stone-900">{p.name}</div>
                              <div className="text-xs font-semibold text-stone-500">Satuan: {p.unit}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-stone-800 font-bold">
                          {p.category?.name}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-black text-sm text-[#5c3826] tabular-nums">{formatRupiah(p.price)}</div>
                          {p.variants && p.variants.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 max-w-[210px]">
                              {p.variants
                                .filter((v: any) => v.isActive)
                                .map((v: any) => (
                                  <span
                                    key={v.id || `${v.packaging}-${v.size}`}
                                    className="inline-flex items-center text-xs font-bold bg-[#fdf6ee] text-[#5c3826] border border-[#e8d5c4] px-2 py-0.5 rounded-md shadow-2xs tabular-nums"
                                    title={`${v.packaging} ${v.size}: Jual ${formatRupiah(v.price)} | Modal ${formatRupiah(v.cost)}`}
                                  >
                                    <span className="font-black text-stone-900 mr-1">{v.size}</span>
                                    <span className="text-xs text-[#5c3826] font-bold">{formatRupiah(v.price)}</span>
                                  </span>
                                ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-black text-sm text-stone-900 tabular-nums">{formatRupiah(p.cost)}</div>
                          {p.variants && p.variants.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 max-w-[210px]">
                              {p.variants
                                .filter((v: any) => v.isActive)
                                .map((v: any) => (
                                  <span
                                    key={v.id || `${v.packaging}-${v.size}`}
                                    className="inline-flex items-center text-xs font-bold bg-emerald-50 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-md shadow-2xs tabular-nums"
                                    title={`${v.packaging} ${v.size}: Modal ${formatRupiah(v.cost)} (Hitung: ${formatRupiah(v.calculatedHpp ?? v.cost)})`}
                                  >
                                    <span className="font-black text-emerald-950 mr-1">{v.size}:</span>
                                    <span className="text-xs text-emerald-800 font-bold">{formatRupiah(v.cost)}</span>
                                  </span>
                                ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-emerald-800 tabular-nums">
                              {formatRupiah(profit)}
                            </span>
                            <span className="text-xs text-emerald-900 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded-md font-black tabular-nums">
                              +{margin}%
                            </span>
                          </div>
                          {p.variants && p.variants.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 max-w-[260px]">
                              {p.variants
                                .filter((v: any) => v.isActive)
                                .map((v: any) => {
                                  const varProfit = v.price - v.cost;
                                  const varMargin = v.price > 0 ? Math.round((varProfit / v.price) * 100) : 0;
                                  return (
                                    <span
                                      key={v.id || `${v.packaging}-${v.size}`}
                                      className="inline-flex items-center text-xs font-bold bg-emerald-50 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-md shadow-2xs tabular-nums"
                                      title={`${v.packaging} ${v.size}: Margin ${formatRupiah(varProfit)} (${varMargin}%)`}
                                    >
                                      <span className="font-black text-emerald-950 mr-1">{v.size}:</span>
                                      <span className="text-xs text-emerald-800 font-bold">
                                        {formatRupiah(varProfit)} ({varMargin}%)
                                      </span>
                                    </span>
                                  );
                                })}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`font-black text-xs px-2.5 py-1 rounded-lg border tabular-nums ${
                              p.stock <= 0
                                ? "bg-rose-100 text-rose-900 border-rose-300"
                                : p.stock <= 10
                                ? "bg-amber-100 text-amber-950 border-amber-300"
                                : "bg-stone-100 text-stone-900 border-stone-200"
                            }`}
                          >
                            {p.stock} {p.unit}
                          </span>
                        </td>

                        {/* Status Bahan Baku & Kesiapan per Varian */}
                        <td className="py-3 px-3">
                          {(() => {
                            const variants = p.variants || [];
                            const activeVariants = variants.filter((v: any) => v.isActive);
                            const hasVariantRecipes = activeVariants.some(
                              (v: any) => v.ingredients && v.ingredients.length > 0
                            );

                            if (!hasVariantRecipes) {
                              return (
                                <span className="text-xs text-stone-500 font-semibold italic">
                                  Stok Siap Jual
                                </span>
                              );
                            }

                            const availableVariants = activeVariants.filter(
                              (v: any) =>
                                v.isAvailableByIngredients !== false &&
                                (v.maxProducible === null || v.maxProducible === undefined || v.maxProducible > 0)
                            );
                            const isAllReady = activeVariants.length > 0 && availableVariants.length === activeVariants.length;
                            const isPartial = activeVariants.length > 0 && availableVariants.length > 0 && availableVariants.length < activeVariants.length;

                            return (
                              <div className="space-y-1 max-w-[210px]">
                                {isAllReady ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-900 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-md">
                                    ✓ Semua Varian Siap
                                  </span>
                                ) : isPartial ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-black text-amber-950 bg-amber-100 border border-amber-400 px-2.5 py-0.5 rounded-md">
                                    ⚠️ Sebagian Habis ({availableVariants.length}/{activeVariants.length})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-black text-rose-900 bg-rose-100 border border-rose-400 px-2.5 py-0.5 rounded-md">
                                    ⚠️ Bahan Habis
                                  </span>
                                )}

                                {/* Per-variant readiness badges */}
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {activeVariants.map((v: any) => {
                                    const isVarReady =
                                      v.isAvailableByIngredients !== false &&
                                      (v.maxProducible === null || v.maxProducible === undefined || v.maxProducible > 0);
                                    return (
                                      <span
                                        key={v.id || `${v.packaging}-${v.size}`}
                                        className={`text-xs px-2 py-0.5 rounded-md font-bold border tabular-nums ${
                                          isVarReady
                                            ? "bg-stone-50 text-stone-800 border-stone-300"
                                            : "bg-rose-50 text-rose-900 border-rose-300 font-black"
                                        }`}
                                        title={
                                          isVarReady
                                            ? `${v.size}: Siap s.d. ${v.maxProducible ?? "∞"} porsi`
                                            : `${v.size}: Bahan kurang (${(v.missingIngredients || []).join(", ")})`
                                        }
                                      >
                                        {v.size}: {isVarReady ? `${v.maxProducible ?? "∞"}` : "Habis"}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        <td className="py-3 px-3">
                          {p.isActive ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg">
                              <XCircle className="h-3.5 w-3.5 text-stone-400" /> Nonaktif
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                              title="Edit Menu"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
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

              {!editingProduct && (
                <>
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
                        step="any"
                        value={prodCost || ""}
                        onChange={(e) => setProdCost(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Profit preview card */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="text-emerald-800">
                      <span className="font-bold">Estimasi Keuntungan Standar: </span>
                      {formatRupiah(marginNominal)} / {prodUnit}
                    </div>
                    <div className="font-black text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                      Margin: {marginPercent}%
                    </div>
                  </div>
                </>
              )}

              {/* Varian Ukuran & Kemasan */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>📏 Pilihan Kemasan & Ukuran</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-bold">
                        {prodVariants.filter((v) => v.isActive).length} Ukuran Aktif
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Pilihan ukuran ini yang akan muncul di modal saat kasir memilih menu di POS.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {prodVariants.map((v, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border transition ${
                        v.isActive
                          ? "bg-white border-amber-300 shadow-2xs"
                          : "bg-slate-100/70 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={v.isActive}
                            onChange={() => toggleVariantActive(idx)}
                            className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                          />
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900">
                              {v.packaging === "Cup" ? "🥤 Cup" : "🍾 Botol"}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                              {v.size}
                            </span>
                          </div>
                        </label>

                        {v.isActive && v.price > 0 && (
                          <div className="text-[11px] font-semibold text-emerald-700">
                            Margin: {formatRupiah(v.price - v.cost)} ({Math.round(((v.price - v.cost) / v.price) * 100)}%)
                          </div>
                        )}
                      </div>

                      {v.isActive && (
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              Harga Jual (Rp)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={v.price || ""}
                              onChange={(e) => updateVariant(idx, "price", Number(e.target.value))}
                              placeholder="15000"
                              className="w-full text-xs font-bold p-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                              Modal / HPP (Rp)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={v.cost || ""}
                              onChange={(e) => updateVariant(idx, "cost", Number(e.target.value))}
                              placeholder="7000"
                              className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Komposisi & Resep Bahan Baku per Varian (Strict Variant BOM) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      Komposisi & Resep Bahan Baku per Varian (BOM)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Setiap varian ukuran & kemasan memiliki resep bahan baku serta wadah kemasan fisiknya masing-masing.
                    </p>
                  </div>
                </div>

                {/* Interactive Variant Tab Switcher */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {prodVariants.map((v, idx) => {
                    const isSelected = selectedVariantIdx === idx;
                    const vHpp = calculateVariantHpp(v);
                    const ingCount = (v.ingredients || []).length;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedVariantIdx(idx);
                          setCopySourceIdx(null);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 border cursor-pointer ${
                          isSelected
                            ? "bg-[#5c3826] text-white border-[#5c3826] shadow-sm"
                            : v.isActive
                            ? "bg-white text-stone-700 border-stone-300 hover:border-[#5c3826] hover:bg-[#faf8f5]"
                            : "bg-stone-100 text-stone-400 border-stone-200 opacity-60"
                        }`}
                      >
                        <span>{v.packaging === "Cup" ? "🥤" : "🍾"}</span>
                        <span>{v.packaging} {v.size}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold tabular-nums ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {ingCount} bahan
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Variant Recipe Content */}
                {(() => {
                  const currentVariant = prodVariants[selectedVariantIdx] || prodVariants[0];
                  if (!currentVariant) return null;
                  const currentHpp = calculateVariantHpp(currentVariant);
                  const isCostSynced = currentVariant.cost === Math.round(currentHpp * 100) / 100;
                  const otherVariantsWithRecipes = prodVariants
                    .map((v, i) => ({ v, i }))
                    .filter(({ i, v }) => i !== selectedVariantIdx && (v.ingredients || []).length > 0);

                  return (
                    <div className="p-3.5 bg-white rounded-2xl border border-stone-200/90 space-y-3">
                      {/* Variant Sub-header & Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-stone-900">
                            Resep: {currentVariant.packaging === "Cup" ? "🥤" : "🍾"} {currentVariant.packaging} {currentVariant.size}
                          </span>
                          {currentVariant.isActive ? (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              Aktif
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-2.5 py-0.5 rounded-full">
                              Nonaktif
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Salin Resep dari Varian Lain Helper */}
                          {otherVariantsWithRecipes.length > 0 && (
                            <div className="flex items-center gap-1">
                              <select
                                value={copySourceIdx ?? ""}
                                onChange={(e) => {
                                  if (e.target.value !== "") {
                                    handleCopyRecipe(selectedVariantIdx, Number(e.target.value));
                                  }
                                }}
                                className="text-xs font-bold bg-[#fbf5ee] border border-[#d8ccc0] text-[#5c3826] rounded-xl px-2.5 py-1.5 hover:bg-[#f3eae0] transition cursor-pointer"
                              >
                                <option value="">📋 Salin Resep dari Varian Lain...</option>
                                {otherVariantsWithRecipes.map(({ v, i }) => (
                                  <option key={i} value={i}>
                                    Salin dari {v.packaging} {v.size} ({v.ingredients.length} bahan)
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleAddVariantIngredient(selectedVariantIdx)}
                            className="text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-500 px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span>+ Bahan</span>
                          </button>
                        </div>
                      </div>

                      {/* Ingredient list for this variant */}
                      {(!currentVariant.ingredients || currentVariant.ingredients.length === 0) ? (
                        <div className="p-4 rounded-xl bg-stone-50 border border-dashed border-stone-300 text-center text-xs text-stone-500 space-y-1">
                          <div>Belum ada komposisi bahan baku untuk varian <strong>{currentVariant.packaging} {currentVariant.size}</strong>.</div>
                          <div className="text-xs text-stone-400">
                            Klik <strong>"+ Bahan"</strong> untuk menambahkan bahan (cth: susu, bubuk, cup/botol) atau gunakan fitur <strong>Salin Resep</strong>.
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                          {currentVariant.ingredients.map((ing, ingIdx) => {
                            const selectedMat = rawMaterials.find((r) => r.id === ing.rawMaterialId);
                            const itemCost = (Number(ing.amount) || 0) * (selectedMat?.costPerUnit || 0);

                            return (
                              <div
                                key={ingIdx}
                                className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 border border-stone-200 hover:border-stone-300 transition"
                              >
                                <select
                                  value={ing.rawMaterialId}
                                  onChange={(e) =>
                                    handleVariantIngredientChange(selectedVariantIdx, ingIdx, "rawMaterialId", e.target.value)
                                  }
                                  className="flex-1 text-xs font-semibold p-2 rounded-lg border border-stone-300 text-stone-900 bg-white"
                                >
                                  {rawMaterials.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name} (Sisa: {r.stock} {r.unit} | Rp {formatRupiah(r.costPerUnit || 0)}/{r.unit})
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
                                      handleVariantIngredientChange(
                                        selectedVariantIdx,
                                        ingIdx,
                                        "amount",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-18 text-xs font-bold p-2 rounded-lg border border-stone-300 text-center text-stone-900 bg-white tabular-nums"
                                  />
                                  <span className="text-xs text-stone-600 font-semibold w-12 truncate" title={selectedMat?.unit || "unit"}>
                                    {selectedMat?.unit || "unit"}
                                  </span>
                                </div>

                                <div className="text-xs text-stone-700 font-mono font-bold w-20 text-right truncate tabular-nums" title={`Biaya bahan: ${formatRupiah(itemCost)}`}>
                                  {formatRupiah(itemCost)}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariantIngredient(selectedVariantIdx, ingIdx)}
                                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                  title="Hapus baris bahan"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Variant HPP Summary & Apply Button */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 text-xs border-t border-stone-200">
                        <div className="flex items-center gap-2">
                          <span className="text-stone-600">
                            HPP Terhitung:{" "}
                            <strong className="text-stone-900 font-black tabular-nums">{formatRupiah(currentHpp)}</strong>
                          </span>
                          <span className="text-xs text-stone-500">
                            (Modal: <strong className="tabular-nums">{formatRupiah(currentVariant.cost)}</strong>)
                          </span>
                          {isCostSynced && currentHpp > 0 && (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              ✓ Sinkron
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyHppToVariant(selectedVariantIdx)}
                          className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>Terapkan ke Modal Varian</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
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
