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

interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  stock: number;
  unit: string;
  imageUrl: string | null;
  isActive: boolean;
  category: { id: string; name: string };
  isAvailableByIngredients?: boolean;
  missingIngredients?: any[];
  maxProducible?: number | null;
  ingredients?: any[];
}

interface PosProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  allProducts: Product[];
  initialQty?: number;
  initialNotes?: string;
  onAddToCart: (product: Product, qty: number, notes: string) => void;
}

interface ParsedVariant {
  product: Product;
  packaging: "Botol" | "Cup" | string;
  size: string;
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
  const [selectedSize, setSelectedSize] = useState<string>("Regular");
  const [qty, setQty] = useState<number>(initialQty);
  const [notes, setNotes] = useState<string>(initialNotes);

  // Group all products belonging to the same base name (e.g. Aren Coffee Milk)
  const familyProducts = useMemo(() => {
    if (!product) return [];
    const base = normalizeProductName(product.name).toLowerCase();
    return allProducts.filter(
      (p) => normalizeProductName(p.name).toLowerCase() === base
    );
  }, [product, allProducts]);

  // Parse each variant in the family for its packaging and size
  const parsedVariants: ParsedVariant[] = useMemo(() => {
    if (familyProducts.length === 0 && product) {
      return [{ product, packaging: product.unit, size: product.unit }];
    }

    return familyProducts.map((p) => {
      const sizeMatch = p.name.match(/\b\d+\s*(ml|l|liter|oz|gram|g|kg)\b/i);
      const size = sizeMatch
        ? sizeMatch[0]
        : p.unit.toLowerCase() === "cup"
        ? "Regular"
        : p.unit;

      let packaging = "Cup";
      if (
        p.unit.toLowerCase() === "botol" ||
        p.name.toLowerCase().includes("botol") ||
        sizeMatch
      ) {
        packaging = "Botol";
      } else if (
        p.unit.toLowerCase() === "cup" ||
        p.name.toLowerCase().includes("cup")
      ) {
        packaging = "Cup";
      } else {
        packaging = p.unit.charAt(0).toUpperCase() + p.unit.slice(1);
      }

      return { product: p, packaging, size };
    });
  }, [familyProducts, product]);

  // Unique packagings and sizes
  const uniquePackagings = useMemo(() => {
    const set = new Set<string>();
    parsedVariants.forEach((v) => set.add(v.packaging));
    return Array.from(set);
  }, [parsedVariants]);

  // Sizes available for currently selected packaging
  const availableSizesForPackaging = useMemo(() => {
    return parsedVariants
      .filter((v) => v.packaging === selectedPackaging)
      .map((v) => v.size);
  }, [parsedVariants, selectedPackaging]);

  // Sync state whenever opened product changes
  useEffect(() => {
    if (!product || !isOpen) return;

    // Detect packaging of the opened product
    const sizeMatch = product.name.match(/\b\d+\s*(ml|l|liter|oz|gram|g|kg)\b/i);
    let defaultPack = "Cup";
    if (
      product.unit.toLowerCase() === "botol" ||
      product.name.toLowerCase().includes("botol") ||
      sizeMatch
    ) {
      defaultPack = "Botol";
    } else if (
      product.unit.toLowerCase() === "cup" ||
      product.name.toLowerCase().includes("cup")
    ) {
      defaultPack = "Cup";
    } else {
      defaultPack = product.unit.charAt(0).toUpperCase() + product.unit.slice(1);
    }

    const defaultSize = sizeMatch
      ? sizeMatch[0]
      : product.unit.toLowerCase() === "cup"
      ? "Regular"
      : product.unit;

    setSelectedPackaging(defaultPack);
    setSelectedSize(defaultSize);
    setQty(initialQty || 1);
    setNotes(initialNotes || "");
  }, [product, isOpen, initialQty, initialNotes]);

  // If user switches packaging, auto-pick first available size for that packaging
  const handleSelectPackaging = (pack: string) => {
    setSelectedPackaging(pack);
    const sizesForThis = parsedVariants
      .filter((v) => v.packaging === pack)
      .map((v) => v.size);
    if (sizesForThis.length > 0 && !sizesForThis.includes(selectedSize)) {
      setSelectedSize(sizesForThis[0]);
    }
  };

  // Find currently active product variant based on selected packaging and size
  const activeProduct: Product | null = useMemo(() => {
    const match = parsedVariants.find(
      (v) => v.packaging === selectedPackaging && v.size === selectedSize
    );
    if (match) return match.product;
    const packMatch = parsedVariants.find((v) => v.packaging === selectedPackaging);
    if (packMatch) return packMatch.product;
    return product || (parsedVariants[0]?.product ?? null);
  }, [parsedVariants, selectedPackaging, selectedSize, product]);

  if (!isOpen || !product || !activeProduct) return null;

  const baseDisplayName = normalizeProductName(product.name);
  const currentPrice = activeProduct.price;
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
    onAddToCart(activeProduct, qty, notes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] border border-slate-200/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-snug">
              {baseDisplayName}
            </h2>
            <div className="text-base font-extrabold text-[#852d2d] mt-0.5">
              {formatRupiah(currentPrice)}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
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
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
                <Package className="h-3.5 w-3.5 text-[#852d2d]" />
                <span>Packaging</span>
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
                      className={`flex flex-col items-center justify-center py-4 px-3 rounded-2xl border-2 transition cursor-pointer ${
                        isSelected
                          ? "border-[#852d2d] bg-[#fbebe9] text-[#852d2d] font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 font-semibold"
                      }`}
                    >
                      {isBotol ? (
                        <FlaskConical className={`h-6 w-6 mb-1.5 ${isSelected ? "text-[#852d2d]" : "text-slate-500"}`} />
                      ) : (
                        <Coffee className={`h-6 w-6 mb-1.5 ${isSelected ? "text-[#852d2d]" : "text-slate-500"}`} />
                      )}
                      <span className="text-xs">{pack}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ukuran (Size) Section */}
          {availableSizesForPackaging.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
                <Tag className="h-3.5 w-3.5 text-[#852d2d]" />
                <span>Ukuran</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {availableSizesForPackaging.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`py-3 px-4 rounded-2xl border-2 text-xs text-center transition cursor-pointer ${
                        isSelected
                          ? "border-[#852d2d] bg-[#fbebe9] text-[#852d2d] font-bold shadow-xs"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 font-medium"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Jumlah Stepper */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
              <Layers className="h-3.5 w-3.5 text-[#852d2d]" />
              <span>Jumlah</span>
            </div>
            <div className="inline-flex items-center border border-slate-200 rounded-xl bg-white p-1 gap-1">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-[#852d2d] hover:bg-slate-100 transition cursor-pointer"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 text-center text-sm font-black text-slate-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQty((prev) => prev + 1)}
                className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center font-bold text-[#852d2d] hover:bg-slate-100 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Catatan (Opsional) */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-2">
              <FileEdit className="h-3.5 w-3.5 text-[#852d2d]" />
              <span>Catatan</span>
              <span className="text-[11px] font-normal text-slate-400">(Opsional)</span>
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
                    className={`text-[10px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      isActive
                        ? "bg-[#fbebe9] border-[#852d2d] text-[#852d2d] font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-300 font-medium"
                    }`}
                  >
                    + {chip}
                  </button>
                );
              })}
            </div>

            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: less sugar, tanpa es, extra shot..."
              className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#852d2d]/20 focus:border-[#852d2d] transition resize-none"
            />
          </div>

          {/* Subtotal Bar */}
          <div className="rounded-2xl bg-[#fbebe8] p-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[#702424]">Subtotal</span>
            <span className="text-base font-black text-[#702424]">
              {formatRupiah(subtotal)}
            </span>
          </div>

          {/* Status Ketersediaan */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-1">
            <div className="text-[11px] font-bold text-slate-800">Status Ketersediaan:</div>
            {!activeProduct.ingredients || activeProduct.ingredients.length === 0 ? (
              <div className="flex items-start gap-2 text-xs text-[#b93838] mt-1">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#b93838] mt-0.5" />
                <span>
                  Resep untuk ukuran <strong>{selectedPackaging} {selectedSize}</strong> belum diinput di halaman Resep.
                </span>
              </div>
            ) : !activeProduct.isAvailableByIngredients ? (
              <div className="flex items-start gap-2 text-xs text-[#b93838] mt-1">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#b93838] mt-0.5" />
                <span>
                  Bahan baku tidak mencukupi:{" "}
                  {Array.isArray(activeProduct.missingIngredients)
                    ? activeProduct.missingIngredients
                        .map((m) => (typeof m === "string" ? m : m.name))
                        .join(", ")
                    : "Stok bahan kurang"}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-xs text-emerald-700 mt-1">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  Bahan baku siap diproduksi ({activeProduct.maxProducible ?? activeProduct.stock} porsi tersedia).
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 rounded-2xl bg-[#f0f5f8] hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex-1 text-center"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="py-3 px-5 rounded-2xl bg-[#9c5959] hover:bg-[#884747] active:scale-[0.98] text-white font-bold text-xs transition cursor-pointer flex-[2] flex items-center justify-center gap-2 shadow-sm"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Tambah ke Keranjang</span>
          </button>
        </div>
      </div>
    </div>
  );
}
