"use client";

import { useState, useEffect, useMemo } from "react";
import { formatRupiah, normalizeProductName } from "@/lib/format";
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  Coffee,
  FlaskConical,
  Package,
  Layers,
  Tag,
  FileEdit,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export interface ProductVariant {
  id: string;
  productId: string;
  packaging: string; // "Cup", "Botol"
  size: string; // "Reguler", "Large", "250 ML", "1.000 ML"
  price: number;
  cost: number;
  stock: number;
  isActive: boolean;
  isAvailableByIngredients?: boolean;
  missingIngredients?: string[];
  maxProducible?: number | null;
  calculatedHpp?: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  cost?: number;
  stock: number;
  unit: string;
  imageUrl: string | null;
  isActive: boolean;
  category: { id: string; name: string };
  variants?: ProductVariant[];
  ingredients?: any[];
  isAvailableByIngredients?: boolean;
  missingIngredients?: any[];
  maxProducible?: number | null;
}

interface PosProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  allProducts: Product[];
  initialQty?: number;
  initialNotes?: string;
  onAddToCart: (product: Product, qty: number, notes: string, variant?: ProductVariant | null) => void;
}

const QUICK_NOTES = [
  "Less Sugar",
  "Normal Sugar",
  "Tanpa Es",
  "Extra Shot",
  "Panas / Hot",
  "Pisah Es",
];

export default function PosProductModal({
  isOpen,
  onClose,
  product,
  allProducts,
  initialQty = 1,
  initialNotes = "",
  onAddToCart,
}: PosProductModalProps) {
  const [selectedPackaging, setSelectedPackaging] = useState<string>("Cup");
  const [selectedSize, setSelectedSize] = useState<string>("Reguler");
  const [qty, setQty] = useState<number>(initialQty);
  const [notes, setNotes] = useState<string>(initialNotes);

  // Active variants directly from product relation if available
  const activeVariants = useMemo(() => {
    if (!product) return [];
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.filter((v) => v.isActive);
    }
    // Fallback: create mock variants based on unit
    const unitName = product.unit.toLowerCase() === "botol" ? "Botol" : "Cup";
    return [
      {
        id: "default-reg",
        productId: product.id,
        packaging: unitName,
        size: unitName === "Botol" ? "250 ML" : "Reguler",
        price: product.price,
        cost: product.cost || 0,
        stock: product.stock,
        isActive: true,
        isAvailableByIngredients: product.isAvailableByIngredients,
        missingIngredients: product.missingIngredients,
        maxProducible: product.maxProducible,
      },
    ];
  }, [product]);

  // Unique packagings (e.g. ["Cup", "Botol"])
  const uniquePackagings = useMemo(() => {
    const set = new Set<string>();
    activeVariants.forEach((v) => set.add(v.packaging));
    return Array.from(set);
  }, [activeVariants]);

  // Variants available under the currently selected packaging
  const availableVariantsForPackaging = useMemo(() => {
    return activeVariants.filter((v) => v.packaging === selectedPackaging);
  }, [activeVariants, selectedPackaging]);

  // Sync state whenever opened product changes
  useEffect(() => {
    if (!product || !isOpen) return;

    const firstPackaging = uniquePackagings[0] || "Cup";
    setSelectedPackaging(firstPackaging);

    const firstVariantForPack = activeVariants.find((v) => v.packaging === firstPackaging);
    setSelectedSize(firstVariantForPack ? firstVariantForPack.size : "Reguler");

    setQty(initialQty || 1);
    setNotes(initialNotes || "");
  }, [product, isOpen, initialQty, initialNotes, uniquePackagings, activeVariants]);

  // If user switches packaging, pick the first available variant under that packaging
  const handleSelectPackaging = (pack: string) => {
    setSelectedPackaging(pack);
    const variantsForThis = activeVariants.filter((v) => v.packaging === pack);
    if (variantsForThis.length > 0) {
      const currentStillValid = variantsForThis.some((v) => v.size === selectedSize);
      if (!currentStillValid) {
        setSelectedSize(variantsForThis[0].size);
      }
    }
  };

  // Find the exact active variant
  const currentVariant: ProductVariant | null = useMemo(() => {
    const match = availableVariantsForPackaging.find((v) => v.size === selectedSize);
    if (match) return match;
    return availableVariantsForPackaging[0] || activeVariants[0] || null;
  }, [availableVariantsForPackaging, selectedSize, activeVariants]);

  const isCurrentVariantOutOfStock = Boolean(
    currentVariant &&
      (currentVariant.isAvailableByIngredients === false ||
        (currentVariant.maxProducible !== null &&
          currentVariant.maxProducible !== undefined &&
          currentVariant.maxProducible <= 0))
  );

  if (!isOpen || !product) return null;

  const baseDisplayName = normalizeProductName(product.name);
  const currentPrice = currentVariant ? currentVariant.price : product.price;
  const subtotal = currentPrice * qty;

  const handleToggleNoteChip = (chip: string) => {
    if (!notes.trim()) {
      setNotes(chip);
      return;
    }
    const currentNotes = notes.split(",").map((s) => s.trim());
    if (currentNotes.includes(chip)) {
      const filtered = currentNotes.filter((s) => s !== chip);
      setNotes(filtered.join(", "));
    } else {
      setNotes([...currentNotes, chip].join(", "));
    }
  };

  const handleSubmit = () => {
    if (qty <= 0) return;
    if (isCurrentVariantOutOfStock) {
      alert(
        `Varian "${currentVariant?.packaging} ${currentVariant?.size}" tidak dapat dipesan karena bahan baku habis di gudang.`
      );
      return;
    }
    onAddToCart(product, qty, notes.trim(), currentVariant);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] border border-[#e7ded5] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-[#f0e8df] flex items-start justify-between gap-3 bg-[#faf8f5]">
          <div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight leading-snug">
              {baseDisplayName}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-black text-[#5c3826] tabular-nums">
                {formatRupiah(currentPrice)}
              </span>
              {currentVariant && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#f3eae0] text-[#5c3826] border border-[#dccdc0]">
                  {currentVariant.packaging} {currentVariant.size}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-[#ede5dc] transition cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          {/* Packaging Section (Botol / Cup) */}
          {uniquePackagings.length > 1 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 mb-2">
                <Package className="h-4 w-4 text-[#5c3826]" />
                <span>Pilihan Kemasan</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {uniquePackagings.map((pack) => {
                  const isSelected = selectedPackaging === pack;
                  const isBotol = pack.toLowerCase().includes("botol");

                  return (
                    <button
                      key={pack}
                      type="button"
                      onClick={() => handleSelectPackaging(pack)}
                      className={`flex flex-col items-center justify-center py-3.5 px-3 rounded-2xl border-2 transition cursor-pointer ${
                        isSelected
                          ? "border-[#5c3826] bg-[#fbf5ee] text-[#5c3826] font-bold shadow-xs"
                          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 font-semibold"
                      }`}
                    >
                      {isBotol ? (
                        <FlaskConical className={`h-6 w-6 mb-1.5 ${isSelected ? "text-[#5c3826]" : "text-stone-500"}`} />
                      ) : (
                        <Coffee className={`h-6 w-6 mb-1.5 ${isSelected ? "text-[#5c3826]" : "text-stone-500"}`} />
                      )}
                      <span className="text-sm font-bold">{pack}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ukuran (Size) Section */}
          {availableVariantsForPackaging.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 mb-2">
                <Tag className="h-4 w-4 text-[#5c3826]" />
                <span>Pilihan Ukuran ({selectedPackaging})</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {availableVariantsForPackaging.map((v) => {
                  const isSelected = selectedSize === v.size;
                  const isOutOfStock =
                    v.isAvailableByIngredients === false ||
                    (v.maxProducible !== null && v.maxProducible !== undefined && v.maxProducible <= 0);

                  return (
                    <button
                      key={v.id || v.size}
                      type="button"
                      onClick={() => setSelectedSize(v.size)}
                      className={`py-3 px-3.5 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? isOutOfStock
                            ? "border-rose-400 bg-rose-50/70 shadow-xs ring-1 ring-rose-400"
                            : "border-[#5c3826] bg-[#fbf5ee] shadow-xs"
                          : isOutOfStock
                          ? "border-rose-200 bg-rose-50/30 hover:border-rose-300"
                          : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-sm font-bold ${isSelected ? (isOutOfStock ? "text-rose-900" : "text-[#5c3826]") : "text-stone-800"}`}>
                          {v.size}
                        </span>
                        {/* Real-time readiness badge */}
                        {isOutOfStock ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300">
                            Bahan Habis
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ✓ {v.maxProducible !== null && v.maxProducible !== undefined ? `${v.maxProducible} Porsi` : "Tersedia"}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs tabular-nums font-bold ${isSelected ? (isOutOfStock ? "text-rose-700" : "text-[#5c3826]") : "text-stone-500"}`}>
                        {formatRupiah(v.price)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Alert if current selected variant is out of stock */}
              {isCurrentVariantOutOfStock && (
                <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Bahan Baku Tidak Cukup di Gudang</div>
                    <div className="text-xs text-rose-700 mt-0.5">
                      Varian <strong>{currentVariant?.packaging} {currentVariant?.size}</strong> tidak dapat diproses kasir karena bahan baku habis:{" "}
                      <span className="font-semibold">
                        {currentVariant?.missingIngredients && currentVariant.missingIngredients.length > 0
                          ? currentVariant.missingIngredients.join(", ")
                          : "Stok bahan kurang"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Jumlah Stepper */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 mb-2">
              <Layers className="h-4 w-4 text-[#5c3826]" />
              <span>Jumlah Pesanan</span>
            </div>
            <div className="inline-flex items-center border border-stone-200 rounded-2xl bg-white p-1 gap-1">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="h-9 w-9 rounded-xl border border-stone-200 flex items-center justify-center font-bold text-[#5c3826] hover:bg-[#fbf5ee] transition cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 text-center text-base font-black text-stone-900 tabular-nums focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQty((prev) => prev + 1)}
                className="h-9 w-9 rounded-xl border border-stone-200 flex items-center justify-center font-bold text-[#5c3826] hover:bg-[#fbf5ee] transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Catatan (Opsional) */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 mb-2">
              <FileEdit className="h-4 w-4 text-[#5c3826]" />
              <span>Catatan Khusus</span>
              <span className="text-xs font-normal text-stone-500">(Opsional)</span>
            </div>

            {/* Quick chips suggestions */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_NOTES.map((chip) => {
                const isActive = notes.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleToggleNoteChip(chip)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                      isActive
                        ? "bg-[#fbf5ee] border-[#5c3826] text-[#5c3826] font-bold"
                        : "bg-[#faf8f5] border-stone-200 text-stone-700 hover:bg-[#ede5dc] hover:border-stone-300 font-medium"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Manis sedang, jangan terlalu banyak es, dll."
              className="w-full text-sm p-3 rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#5c3826]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#f0e8df] bg-[#faf8f5] flex items-center justify-between gap-3">
          <div>
            <span className="text-xs text-stone-500 font-medium block">Total ({qty} item)</span>
            <span className="text-2xl font-black text-[#5c3826] tabular-nums">{formatRupiah(subtotal)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isCurrentVariantOutOfStock}
              onClick={handleSubmit}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                isCurrentVariantOutOfStock
                  ? "bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed opacity-90"
                  : "bg-[#5c3826] text-white hover:bg-[#46291a] shadow-md shadow-[#5c3826]/20 cursor-pointer"
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>{isCurrentVariantOutOfStock ? "Bahan Habis" : "Tambah Pesanan"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
