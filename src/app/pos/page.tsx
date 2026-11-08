"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatRupiah, normalizeProductName } from "@/lib/format";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  TicketPercent,
  CheckCircle2,
  Calendar,
  X,
  CreditCard,
  QrCode,
  Banknote,
  Percent,
  Coffee,
  ShoppingBag,
} from "lucide-react";
import ReceiptModal from "@/components/ReceiptModal";
import PosProductModal from "@/components/PosProductModal";

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
  missingIngredients?: { name: string; required: number; available: number; shortage: number; unit: string }[];
  maxProducible?: number | null;
  ingredients?: any[];
  variants?: any[];
}

interface CartItem {
  product: Product;
  variant?: any;
  sizeLabel?: string;
  price: number;
  qty: number;
  notes: string;
}

export default function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Product Order Modal state (Fast Direct Order Input)
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingCartItemIndex, setEditingCartItemIndex] = useState<number | null>(null);
  const [modalInitialQty, setModalInitialQty] = useState(1);
  const [modalInitialNotes, setModalInitialNotes] = useState("");

  // Discount & Voucher state
  const [discountType, setDiscountType] = useState<"voucher" | "manual">("voucher");
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [manualDiscountType, setManualDiscountType] = useState<"percentage" | "nominal">("nominal");
  const [manualDiscountValue, setManualDiscountValue] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherError, setVoucherError] = useState("");

  // Payment Modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "transfer">("cash");
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>("");
  const [orderStatus, setOrderStatus] = useState<"selesai" | "diproses">("diproses");
  const [processingOrder, setProcessingOrder] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // 1. Render data seketika dari session cache (0ms instant loading)
    try {
      const cachedProds = sessionStorage.getItem("pos_cache_prods");
      const cachedCats = sessionStorage.getItem("pos_cache_cats");
      const cachedEvs = sessionStorage.getItem("pos_cache_evs");
      if (cachedProds && cachedCats) {
        setProducts(JSON.parse(cachedProds));
        setCategories(JSON.parse(cachedCats));
        if (cachedEvs) {
          const parsedEvs = JSON.parse(cachedEvs);
          setEvents(parsedEvs);
          const ongoing = parsedEvs.find((e: any) => e.status === "ongoing");
          if (ongoing) setSelectedEventId(ongoing.id);
          else if (parsedEvs.length > 0) setSelectedEventId(parsedEvs[0].id);
        }
        setLoading(false);
      }
    } catch (e) {}

    // 2. Ambil data terbaru di background tanpa membuat UI macet
    try {
      const [prodRes, catRes, evRes] = await Promise.all([
        fetch("/api/products?activeOnly=true"),
        fetch("/api/categories"),
        fetch("/api/events"),
      ]);

      const [prods, cats, evs] = await Promise.all([
        prodRes.json(),
        catRes.json(),
        evRes.json(),
      ]);

      if (Array.isArray(prods)) {
        setProducts(prods);
        sessionStorage.setItem("pos_cache_prods", JSON.stringify(prods));
      }
      if (Array.isArray(cats)) {
        setCategories(cats);
        sessionStorage.setItem("pos_cache_cats", JSON.stringify(cats));
      }
      if (Array.isArray(evs)) {
        setEvents(evs);
        sessionStorage.setItem("pos_cache_evs", JSON.stringify(evs));
        const ongoing = evs.find((e: any) => e.status === "ongoing");
        if (ongoing) setSelectedEventId(ongoing.id);
        else if (evs.length > 0) setSelectedEventId(evs[0].id);
      }
    } catch (err) {
      console.error("Failed to load POS data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cart Subtotal
  const subtotal = cart.reduce((sum, item) => sum + (item.price || item.product.price) * item.qty, 0);

  // Recalculate discount whenever subtotal or discount rules change
  useEffect(() => {
    if (subtotal === 0) {
      setDiscountAmount(0);
      return;
    }

    if (discountType === "voucher" && appliedVoucher) {
      let disc = 0;
      if (appliedVoucher.type === "percentage") {
        disc = (subtotal * appliedVoucher.value) / 100;
        if (appliedVoucher.maxDiscount && disc > appliedVoucher.maxDiscount) {
          disc = appliedVoucher.maxDiscount;
        }
      } else {
        disc = Math.min(appliedVoucher.value, subtotal);
      }
      setDiscountAmount(disc);
    } else if (discountType === "manual") {
      let disc = 0;
      if (manualDiscountType === "percentage") {
        disc = (subtotal * Number(manualDiscountValue || 0)) / 100;
      } else {
        disc = Math.min(Number(manualDiscountValue || 0), subtotal);
      }
      setDiscountAmount(disc);
    } else {
      setDiscountAmount(0);
    }
  }, [subtotal, discountType, appliedVoucher, manualDiscountType, manualDiscountValue]);

  const totalAmount = Math.max(0, subtotal - discountAmount);

  // Cart & Modal actions
  const handleOpenProductModal = (product: Product) => {
    setModalProduct(product);
    setModalInitialQty(1);
    setModalInitialNotes("");
    setEditingCartItemIndex(null);
    setIsProductModalOpen(true);
  };

  const handleEditCartItem = (item: CartItem, index: number) => {
    setModalProduct(item.product);
    setModalInitialQty(item.qty);
    setModalInitialNotes(item.notes || "");
    setEditingCartItemIndex(index);
    setIsProductModalOpen(true);
  };

  const handleAddToCartFromModal = (product: Product, qty: number, notes: string, variant?: any) => {
    const sizeLabel = variant ? `${variant.packaging} ${variant.size}` : product.unit;
    const effectivePrice = variant ? variant.price : product.price;

    setCart((prev) => {
      // If editing an existing item in cart
      if (
        editingCartItemIndex !== null &&
        editingCartItemIndex >= 0 &&
        editingCartItemIndex < prev.length
      ) {
        const nextCart = [...prev];
        nextCart[editingCartItemIndex] = {
          product,
          variant,
          sizeLabel,
          price: effectivePrice,
          qty,
          notes,
        };
        return nextCart;
      }

      // Check if product with same variant and same notes already exists in cart
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.variant?.id === variant?.id &&
          (item.notes || "") === (notes || "")
      );

      if (existingIndex > -1) {
        const nextCart = [...prev];
        nextCart[existingIndex] = {
          ...nextCart[existingIndex],
          qty: nextCart[existingIndex].qty + qty,
        };
        return nextCart;
      }

      return [
        ...prev,
        {
          product,
          variant,
          sizeLabel,
          price: effectivePrice,
          qty,
          notes,
        },
      ];
    });
    setEditingCartItemIndex(null);
  };

  const updateQty = (index: number, delta: number) => {
    setCart((prev) => {
      const item = prev[index];
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const nextCart = [...prev];
      nextCart[index] = { ...item, qty: newQty };
      return nextCart;
    });
  };

  const updateItemNotes = (index: number, notes: string) => {
    setCart((prev) => {
      const nextCart = [...prev];
      if (nextCart[index]) {
        nextCart[index] = { ...nextCart[index], notes };
      }
      return nextCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedVoucher(null);
    setVoucherCodeInput("");
    setManualDiscountValue(0);
  };

  // Validate Voucher
  const handleApplyVoucher = async () => {
    if (!voucherCodeInput.trim()) return;
    setVoucherError("");

    try {
      const res = await fetch(
        `/api/vouchers?validate=${encodeURIComponent(
          voucherCodeInput.trim()
        )}&amount=${subtotal}`
      );
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setVoucherError(data.message || "Voucher tidak valid");
        setAppliedVoucher(null);
      } else {
        setAppliedVoucher(data.voucher);
        setVoucherError("");
      }
    } catch {
      setVoucherError("Gagal memvalidasi kode voucher");
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchCat =
      selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Group products by base name for fast, clean, organized cashier menu
  const displayProducts = useMemo(() => {
    // Group by base name (e.g. Aren Coffee Milk, Choco Blend Coffee, etc.)
    const groups = new Map<string, Product[]>();
    filteredProducts.forEach((p) => {
      const base = normalizeProductName(p.name);
      if (!groups.has(base)) groups.set(base, []);
      groups.get(base)!.push(p);
    });

    return Array.from(groups.entries()).map(([baseName, variants]) => {
      const sorted = [...variants].sort((a, b) => a.price - b.price);
      const rep = sorted[0];

      // Collect all active ProductVariant across these products
      const allActiveVariants = variants.flatMap((p) =>
        (p.variants || []).filter((v: any) => v.isActive)
      );

      const hasMultipleVariants = allActiveVariants.length > 1;
      const allPrices = hasMultipleVariants
        ? allActiveVariants.map((v: any) => v.price)
        : [rep.price];
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);

      // Merge variants into the representative product so the modal gets everything
      const mergedProduct: Product = {
        ...rep,
        variants: allActiveVariants.length > 0 ? allActiveVariants : rep.variants,
      };

      return {
        ...mergedProduct,
        displayName: baseName,
        isGrouped: hasMultipleVariants,
        variantCount: allActiveVariants.length,
        minPrice,
        maxPrice,
        allVariants: variants,
      };
    });
  }, [filteredProducts]);

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashGiven(totalAmount);
    setIsCheckoutOpen(true);
  };

  // Dynamic Quick Cash Options based on totalAmount (adopsi pola kasir-umkm)
  const quickCashOptions = useMemo(() => {
    if (totalAmount <= 0) return [];
    const candidates = [
      totalAmount, // Uang Pas
      Math.ceil(totalAmount / 5000) * 5000,
      Math.ceil(totalAmount / 10000) * 10000,
      Math.ceil(totalAmount / 20000) * 20000,
      Math.ceil(totalAmount / 50000) * 50000,
      100000,
      200000,
    ];
    return Array.from(new Set(candidates.filter((v) => v >= totalAmount)))
      .sort((a, b) => a - b)
      .slice(0, 5);
  }, [totalAmount]);

  // Touch Numpad Press Handler untuk layar sentuh Booth
  const handleNumpadPress = (key: string) => {
    let currentStr = String(cashGiven || "");
    if (cashGiven === totalAmount) {
      currentStr = "";
    }
    if (key === "hapus") {
      const updated = currentStr.slice(0, -1);
      setCashGiven(updated ? parseInt(updated, 10) : 0);
    } else if (key === "000") {
      if (currentStr && currentStr.length < 9) {
        setCashGiven(parseInt(currentStr + "000", 10));
      }
    } else {
      if (currentStr.length < 9) {
        setCashGiven(parseInt((currentStr + key).replace(/^0+/, "") || "0", 10));
      }
    }
  };

  // Process Checkout
  const handleConfirmPayment = async () => {
    if (processingOrder) return;
    setProcessingOrder(true);

    try {
      let cashierName = "Kasir Booth";
      try {
        const saved = localStorage.getItem("active_cashier");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name) cashierName = parsed.name;
        }
      } catch (e) {}

      const payload = {
        orderSource: "DIRECT",
        eventId: selectedEventId || null,
        cashierName,
        customerName: customerName.trim() || null,
        status: orderStatus,
        items: cart.map((item) => ({
          productId: item.product.id,
          variantId: item.variant?.id && !item.variant.id.startsWith("default-") ? item.variant.id : null,
          price: item.price || item.product.price,
          qty: item.qty,
          notes: item.sizeLabel
            ? (item.notes ? `${item.sizeLabel} • ${item.notes}` : item.sizeLabel)
            : (item.notes || null),
        })),
        voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
        manualDiscountAmount: discountType === "manual" ? discountAmount : 0,
        payment: {
          method: paymentMethod,
          amount: totalAmount,
          isDownPayment: false,
        },
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan transaksi");
      }

      const orderData = await res.json();
      setCompletedOrder({
        ...orderData,
        cashGiven: paymentMethod === "cash" ? cashGiven : totalAmount,
        changeAmount: paymentMethod === "cash" && cashGiven >= totalAmount ? cashGiven - totalAmount : 0,
      });
      setIsCheckoutOpen(false);
      clearCart();
      setCustomerName("");
      setOrderStatus("diproses");
      // Reload products to refresh stock
      loadInitialData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingOrder(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Event Selector & Search */}
      <div className="bg-white dark:bg-[#1c1512] rounded-2xl border border-[#e7ded5] dark:border-[#2e231d] shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300">Lokasi Event Kasir:</span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="text-xs font-semibold bg-white dark:bg-[#251b16] text-stone-900 dark:text-stone-100 border border-[#d8ccc0] dark:border-[#382b23] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5c3826]"
          >
            <option value="">-- Tanpa Event (Booth Mandiri) --</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} {ev.status === "ongoing" ? "🟢 (Ongoing)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Quick link to live bazaar orders */}
          <Link
            href="/bazaar-orders"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#fbf5ee] dark:bg-[#251b16] border border-[#d8ccc0] dark:border-[#382b23] text-[#5c3826] dark:text-amber-300 hover:bg-[#f3eae0] text-xs font-bold transition shrink-0 shadow-2xs"
            title="Lihat antrean dan status pesanan bazaar hari ini"
          >
            <ShoppingBag className="h-4 w-4 text-[#5c3826] dark:text-amber-400" />
            <span className="hidden sm:inline">Pesanan Bazaar</span>
            <span className="sm:hidden">Pesanan</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </Link>

          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu / minuman..."
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-[#251b16] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 border border-[#d8ccc0] dark:border-[#382b23] focus:outline-none focus:ring-2 focus:ring-[#5c3826]"
            />
          </div>
        </div>
      </div>

      {/* Main Layout: Products Grid (Left) + Cart Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Categories & Product Cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-[#5c3826] text-white shadow-xs"
                  : "bg-white dark:bg-[#251b16] text-stone-600 dark:text-stone-300 border border-[#e7ded5] dark:border-[#382b23] hover:bg-[#faf8f5]"
              }`}
            >
              Semua Menu ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 transition cursor-pointer ${
                  selectedCategory === c.id
                    ? "bg-[#5c3826] text-white shadow-xs"
                    : "bg-white dark:bg-[#251b16] text-stone-600 dark:text-stone-300 border border-[#e7ded5] dark:border-[#382b23] hover:bg-[#faf8f5]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-stone-400">Memuat katalog menu...</div>
          ) : displayProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-400 bg-white dark:bg-[#251b16] rounded-2xl border border-dashed border-[#e7ded5] dark:border-[#382b23]">
              Tidak ada produk yang cocok dengan pencarian.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3.5">
              {displayProducts.map((p) => {
                const baseName = normalizeProductName(p.name);
                const totalInCart = cart
                  .filter(
                    (item) => normalizeProductName(item.product.name) === baseName
                  )
                  .reduce((sum, item) => sum + item.qty, 0);

                // Calculate Variant-Aware Stock Readiness for catalog card
                const variantsList: any[] = (p.variants && p.variants.length > 0)
                  ? p.variants
                  : (p.allVariants && p.allVariants.length > 0)
                  ? p.allVariants.flatMap((prod: any) => prod.variants || [])
                  : [];

                const activeVariants = variantsList.filter((v: any) => v.isActive);
                const hasVariantData = activeVariants.length > 0;

                let isAllVariantsOutOfStock = false;
                let isPartialVariantsOutOfStock = false;
                let isAllVariantsAvailable = false;
                let availableCount = 0;

                if (hasVariantData) {
                  const readyVariants = activeVariants.filter(
                    (v: any) =>
                      v.isAvailableByIngredients !== false &&
                      (v.maxProducible === null || v.maxProducible === undefined || v.maxProducible > 0)
                  );
                  availableCount = readyVariants.length;
                  isAllVariantsAvailable = availableCount === activeVariants.length;
                  isPartialVariantsOutOfStock = availableCount > 0 && availableCount < activeVariants.length;
                  isAllVariantsOutOfStock = availableCount === 0;
                } else {
                  const isRawMissing = p.isAvailableByIngredients === false;
                  isAllVariantsOutOfStock = p.stock <= 0 || isRawMissing;
                  isAllVariantsAvailable = !isAllVariantsOutOfStock;
                }

                const priceDisplay =
                  p.isGrouped && p.minPrice !== p.maxPrice
                    ? `Mulai ${formatRupiah(p.minPrice)}`
                    : formatRupiah(p.price);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleOpenProductModal(p)}
                    className={`relative p-3.5 rounded-2xl bg-white dark:bg-[#251b16] border text-left flex flex-col justify-between transition group shadow-xs cursor-pointer ${
                      isAllVariantsOutOfStock
                        ? "opacity-60 grayscale-[30%] border-rose-200 bg-rose-50/20"
                        : isPartialVariantsOutOfStock
                        ? "border-amber-400 hover:border-amber-500 hover:shadow-md"
                        : totalInCart > 0
                        ? "border-[#5c3826] ring-2 ring-[#5c3826]/20 shadow-md"
                        : "border-[#e7ded5] dark:border-[#382b23] hover:border-[#5c3826] hover:shadow-md"
                    }`}
                  >
                    {/* Badge Stock & Category */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-xs uppercase tracking-wider font-bold text-stone-400 truncate">
                        {p.category?.name}
                      </span>

                      {/* Variant Readiness Badge */}
                      {isAllVariantsOutOfStock ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
                          ⚠️ Habis
                        </span>
                      ) : isPartialVariantsOutOfStock ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                          ⚠️ Sebagian ({availableCount}/{activeVariants.length})
                        </span>
                      ) : p.isGrouped ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ {activeVariants.length} Varian Siap
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✓ {p.maxProducible !== null && p.maxProducible !== undefined ? `${p.maxProducible} ${p.unit}` : "Siap"}
                        </span>
                      )}
                    </div>

                    {/* Image Placeholder or Actual Image */}
                    {p.imageUrl ? (
                      <div className="relative w-full h-24 mb-2.5 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800">
                        <img
                          src={p.imageUrl}
                          alt={p.displayName || p.name}
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-24 mb-2.5 rounded-xl flex items-center justify-center font-bold text-xs relative bg-[#f7efe6] dark:bg-[#34241c] text-[#5c3826] dark:text-amber-300">
                        <Coffee className="h-7 w-7 text-[#5c3826]/60 dark:text-amber-400/60 mb-0.5" />
                      </div>
                    )}

                    <div>
                      <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-1">
                        {p.displayName || p.name}
                      </h4>
                      {p.isGrouped && (
                        <p className="text-xs font-medium text-stone-500 line-clamp-1 mt-0.5">
                          Pilih Botol / Cup & Ukuran
                        </p>
                      )}
                      <div className="font-black text-sm text-[#5c3826] dark:text-amber-300 mt-1 tabular-nums">
                        {priceDisplay}
                      </div>
                    </div>

                    {totalInCart > 0 && (
                      <div className="mt-2.5 text-center py-1.5 bg-[#5c3826] text-white font-bold text-xs rounded-xl shadow-xs">
                        {totalInCart} di keranjang
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Cart Panel */}
        <div className="bg-white dark:bg-[#1c1512] rounded-2xl border border-[#e7ded5] dark:border-[#2e231d] shadow-xs flex flex-col h-[calc(100vh-140px)] sticky top-20">
          {/* Cart Header */}
          <div className="p-4 border-b border-[#e7ded5] dark:border-[#2e231d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">Keranjang Kasir</h3>
              <span className="text-xs bg-[#f3eae0] dark:bg-[#251b16] text-[#5c3826] dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold tabular-nums">
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 text-xs text-center space-y-2">
                <ShoppingCart className="h-8 w-8 text-stone-300 dark:text-stone-700" />
                <p>Belum ada produk dipilih.<br />Klik menu di samping untuk kustomisasi & tambah.</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={`${item.product.id}-${index}`}
                  className="p-3.5 rounded-xl bg-[#faf8f5] dark:bg-[#251b16] border border-[#e7ded5] dark:border-[#382b23] space-y-2 text-xs"
                >
                  <div
                    onClick={() => handleEditCartItem(item, index)}
                    className="flex items-start justify-between gap-2 cursor-pointer group/item hover:bg-[#ede5dc]/60 dark:hover:bg-[#2e231d] p-1 rounded-lg transition"
                    title="Klik untuk ubah ukuran, packaging, atau catatan"
                  >
                    <div>
                      <div className="font-bold text-stone-900 dark:text-stone-100 group-hover/item:text-[#5c3826] dark:group-hover/item:text-amber-300 transition flex items-center gap-1.5">
                        <span className="text-sm">{item.product.name}</span>
                        <span className="text-xs text-stone-400">✎</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.sizeLabel && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#f3eae0] dark:bg-[#34241c] text-[#5c3826] dark:text-amber-300 border border-[#dccdc0] dark:border-[#423229]">
                            {item.sizeLabel}
                          </span>
                        )}
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-semibold tabular-nums">
                          {formatRupiah(item.price || item.product.price)}
                        </span>
                      </div>
                      {item.notes && (
                        <div className="text-xs text-[#5c3826] dark:text-amber-300 bg-[#fbf5ee] dark:bg-[#34241c] border border-[#d8ccc0] dark:border-[#423229] rounded-md px-2 py-0.5 mt-1 inline-block">
                          📝 {item.notes}
                        </div>
                      )}
                    </div>
                    <div className="font-black text-sm text-[#5c3826] dark:text-amber-300 tabular-nums">
                      {formatRupiah((item.price || item.product.price) * item.qty)}
                    </div>
                  </div>

                  {/* Notes input */}
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateItemNotes(index, e.target.value)}
                    placeholder="Catatan (misal: less sugar, tanpa es)..."
                    className="w-full text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-[#1c1512] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 border border-[#d8ccc0] dark:border-[#382b23] focus:outline-none focus:ring-1 focus:ring-[#5c3826]"
                  />

                  {/* Qty Switcher */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => removeFromCart(index)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(index, -1)}
                        className="h-7 w-7 rounded-lg bg-white dark:bg-[#1c1512] border border-[#d8ccc0] dark:border-[#382b23] flex items-center justify-center font-bold text-stone-700 dark:text-stone-200 hover:bg-[#ede5dc] cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-black text-sm w-6 text-center tabular-nums">{item.qty}</span>
                      <button
                        onClick={() => updateQty(index, 1)}
                        className="h-7 w-7 rounded-lg bg-white dark:bg-[#1c1512] border border-[#d8ccc0] dark:border-[#382b23] flex items-center justify-center font-bold text-stone-700 dark:text-stone-200 hover:bg-[#ede5dc] cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Discount Section */}
          <div className="p-4 border-t border-[#e7ded5] dark:border-[#2e231d] bg-[#faf8f5]/50 dark:bg-[#1c1512]/50 space-y-3">
            {/* Voucher / Discount Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-700 dark:text-stone-300">Diskon & Promo:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDiscountType("voucher")}
                    className={`font-bold cursor-pointer ${discountType === "voucher" ? "text-[#5c3826] dark:text-amber-400 underline" : "text-stone-400"
                      }`}
                  >
                    Kode Voucher
                  </button>
                  <span className="text-stone-300">|</span>
                  <button
                    onClick={() => setDiscountType("manual")}
                    className={`font-bold cursor-pointer ${discountType === "manual" ? "text-[#5c3826] dark:text-amber-400 underline" : "text-stone-400"
                      }`}
                  >
                    Diskon Manual
                  </button>
                </div>
              </div>

              {discountType === "voucher" ? (
                <div className="space-y-1">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={voucherCodeInput}
                      onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode voucher..."
                      className="flex-1 text-xs uppercase px-3 py-1.5 rounded-lg bg-white dark:bg-[#251b16] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 border border-[#d8ccc0] dark:border-[#382b23] focus:outline-none focus:ring-1 focus:ring-[#5c3826] font-mono font-bold"
                    />
                    <button
                      onClick={handleApplyVoucher}
                      className="px-3.5 py-1.5 rounded-lg bg-[#5c3826] text-white text-xs font-bold hover:bg-[#46291a] cursor-pointer"
                    >
                      Pakai
                    </button>
                  </div>
                  {voucherError && (
                    <p className="text-xs text-rose-600 font-bold">{voucherError}</p>
                  )}
                  {appliedVoucher && (
                    <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <span>✓ {appliedVoucher.code} diterapkan</span>
                      <button
                        onClick={() => {
                          setAppliedVoucher(null);
                          setVoucherCodeInput("");
                        }}
                        className="text-stone-400 hover:text-stone-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <select
                    value={manualDiscountType}
                    onChange={(e) => setManualDiscountType(e.target.value as any)}
                    className="text-xs bg-white dark:bg-[#251b16] text-stone-900 dark:text-stone-100 border border-[#d8ccc0] dark:border-[#382b23] rounded-lg px-2 py-1.5"
                  >
                    <option value="nominal">Nominal (Rp)</option>
                    <option value="percentage">Persen (%)</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={manualDiscountValue || ""}
                    onChange={(e) => setManualDiscountValue(Number(e.target.value))}
                    placeholder={manualDiscountType === "percentage" ? "10%" : "5000"}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-[#251b16] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 border border-[#d8ccc0] dark:border-[#382b23] focus:outline-none focus:ring-1 focus:ring-[#5c3826] tabular-nums"
                  />
                </div>
              )}
            </div>

            {/* Calculations */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-[#e7ded5] dark:border-[#2e231d]">
              <div className="flex justify-between text-stone-600 dark:text-stone-400">
                <span>Subtotal</span>
                <span className="tabular-nums font-bold">{formatRupiah(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>Potongan Diskon</span>
                  <span className="tabular-nums">-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base text-[#5c3826] dark:text-amber-300 pt-1.5 border-t border-[#e7ded5] dark:border-[#2e231d]">
                <span>Total Bayar</span>
                <span className="tabular-nums text-lg">{formatRupiah(totalAmount)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              Proses Bayar ({formatRupiah(totalAmount)})
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal with Payment Simulator */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1c1512] rounded-3xl max-w-md w-full shadow-2xl border border-[#e7ded5] dark:border-[#2e231d] flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden my-auto">
            {/* Modal Header (Fixed at top) */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[#e7ded5] dark:border-[#2e231d] shrink-0 bg-white dark:bg-[#1c1512]">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">Pembayaran Kasir</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-[#ede5dc] dark:hover:bg-[#2e231d] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
              <div className="p-3.5 bg-[#fbf5ee] dark:bg-[#251b16] rounded-2xl border border-[#e7ded5] dark:border-[#382b23] text-center">
                <span className="text-xs text-[#5c3826] dark:text-amber-300 font-bold block">Total yang harus dibayar</span>
                <span className="text-3xl font-black text-[#5c3826] dark:text-amber-400 tabular-nums">{formatRupiah(totalAmount)}</span>
              </div>

              {/* Input Nama Pelanggan Direct */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex justify-between">
                  <span>Nama Pelanggan</span>
                  <span className="text-xs text-stone-400 font-normal">Opsional</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Kak Dian / Meja 3 / Tamu"
                  className="w-full text-sm font-semibold px-3 py-2 rounded-xl bg-white dark:bg-[#251b16] border border-[#d8ccc0] dark:border-[#382b23] focus:outline-none focus:ring-2 focus:ring-[#5c3826] text-stone-900 dark:text-stone-100"
                />
              </div>

              {/* Status Pesanan Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">Status Pengerjaan Pesanan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderStatus("selesai")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      orderStatus === "selesai"
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                        : "bg-[#faf8f5] dark:bg-[#251b16] text-stone-700 dark:text-stone-300 border-[#e7ded5] dark:border-[#382b23] hover:bg-[#ede5dc]"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Langsung Selesai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderStatus("diproses")}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      orderStatus === "diproses"
                        ? "bg-amber-500 text-stone-950 font-black border-amber-600 shadow-xs"
                        : "bg-[#faf8f5] dark:bg-[#251b16] text-stone-700 dark:text-stone-300 border-[#e7ded5] dark:border-[#382b23] hover:bg-[#ede5dc]"
                    }`}
                  >
                    <span>⏳ Sedang Diproses (Antre)</span>
                  </button>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">Pilih Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition cursor-pointer ${paymentMethod === "cash"
                      ? "bg-amber-500 text-stone-950 font-black border-amber-600 shadow-xs"
                      : "bg-[#faf8f5] dark:bg-[#251b16] text-stone-700 dark:text-stone-300 border-[#e7ded5] dark:border-[#382b23] hover:bg-[#ede5dc]"
                      }`}
                  >
                    <Banknote className="h-5 w-5" />
                    <span>Tunai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("qris")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition cursor-pointer ${paymentMethod === "qris"
                      ? "bg-amber-500 text-stone-950 font-black border-amber-600 shadow-xs"
                      : "bg-[#faf8f5] dark:bg-[#251b16] text-stone-700 dark:text-stone-300 border-[#e7ded5] dark:border-[#382b23] hover:bg-[#ede5dc]"
                      }`}
                  >
                    <QrCode className="h-5 w-5" />
                    <span>QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("transfer")}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition cursor-pointer ${paymentMethod === "transfer"
                      ? "bg-amber-500 text-stone-950 font-black border-amber-600 shadow-xs"
                      : "bg-[#faf8f5] dark:bg-[#251b16] text-stone-700 dark:text-stone-300 border-[#e7ded5] dark:border-[#382b23] hover:bg-[#ede5dc]"
                      }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Transfer</span>
                  </button>
                </div>
              </div>

              {/* Cash Calculator */}
              {paymentMethod === "cash" && (
                <div className="space-y-3 pt-2 border-t border-[#e7ded5] dark:border-[#2e231d]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                      Uang Diterima (Cash)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCashGiven(totalAmount)}
                      className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      Reset ke Uang Pas
                    </button>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400 dark:text-stone-500">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={cashGiven || ""}
                      onChange={(e) => setCashGiven(Number(e.target.value))}
                      className="w-full text-xl font-black pl-10 pr-3 py-2 rounded-xl bg-white dark:bg-[#251b16] border border-[#d8ccc0] dark:border-[#382b23] focus:outline-none focus:ring-2 focus:ring-[#5c3826] text-stone-900 dark:text-stone-100 tabular-nums shadow-xs"
                      placeholder="0"
                    />
                  </div>

                  {/* Quick cash pills (Dinamis dari nilai tagihan, pola kasir-umkm) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                        Uang Cepat (Sesuai Tagihan)
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Tagihan: {formatRupiah(totalAmount)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {quickCashOptions.map((amount) => {
                        const isPas = amount === totalAmount;
                        const isSelected = cashGiven === amount;
                        return (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setCashGiven(amount)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer tabular-nums ${
                              isSelected
                                ? "bg-amber-500 text-stone-950 font-black shadow-xs ring-2 ring-amber-400/50"
                                : "bg-[#f0e8df] dark:bg-[#2e231d] hover:bg-[#e4dacd] dark:hover:bg-[#3a2d25] text-stone-800 dark:text-stone-200"
                            }`}
                          >
                            {isPas ? `Uang Pas (${formatRupiah(amount)})` : formatRupiah(amount)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Touch Numpad (Untuk layar sentuh HP / Tablet Booth) */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      Keypad Kasir
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "hapus"].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => handleNumpadPress(k)}
                          className={`py-2 rounded-xl text-sm font-bold transition flex items-center justify-center cursor-pointer ${
                            k === "hapus"
                              ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-200 active:scale-95"
                              : k === "000"
                              ? "bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 active:scale-95"
                              : "bg-white dark:bg-[#251b16] border border-[#e7ded5] dark:border-[#382b23] text-stone-800 dark:text-stone-200 hover:bg-[#f5ede4] active:scale-95 shadow-xs"
                          }`}
                        >
                          {k === "hapus" ? (
                            <span className="flex items-center gap-1 text-xs">⌫ Hapus</span>
                          ) : (
                            k
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Change */}
                  <div
                    className={`p-3.5 rounded-xl border flex justify-between items-center text-xs font-bold transition-colors ${
                      cashGiven < totalAmount
                        ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40"
                        : cashGiven === totalAmount
                        ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40"
                        : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span
                        className={`block font-semibold ${
                          cashGiven < totalAmount
                            ? "text-rose-700 dark:text-rose-400"
                            : cashGiven === totalAmount
                            ? "text-amber-800 dark:text-amber-300"
                            : "text-emerald-800 dark:text-emerald-300"
                        }`}
                      >
                        {cashGiven < totalAmount
                          ? "Uang Kurang:"
                          : cashGiven === totalAmount
                          ? "Status Pembayaran:"
                          : "Kembalian Kasir:"}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        Tagihan: {formatRupiah(totalAmount)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-lg font-black tabular-nums block ${
                          cashGiven < totalAmount
                            ? "text-rose-600 dark:text-rose-400"
                            : cashGiven === totalAmount
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-emerald-700 dark:text-emerald-400"
                        }`}
                      >
                        {cashGiven < totalAmount
                          ? `- ${formatRupiah(totalAmount - cashGiven)}`
                          : cashGiven === totalAmount
                          ? "✓ UANG PAS"
                          : formatRupiah(cashGiven - totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* QRIS preview */}
              {paymentMethod === "qris" && (
                <div className="text-center py-4 bg-[#faf8f5] dark:bg-[#251b16] rounded-2xl border border-[#e7ded5] dark:border-[#382b23] space-y-2">
                  <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-stone-300 flex items-center justify-center shadow-xs">
                    <QrCode className="w-28 h-28 text-stone-900" />
                  </div>
                  <p className="text-xs text-stone-500 font-medium">Scan QRIS Dua Carita Coffee untuk verifikasi pembayaran</p>
                </div>
              )}

              {/* Transfer preview */}
              {paymentMethod === "transfer" && (
                <div className="p-3.5 bg-[#faf8f5] dark:bg-[#251b16] rounded-2xl border border-[#e7ded5] dark:border-[#382b23] space-y-1.5 text-xs">
                  <div className="font-bold text-stone-900 dark:text-stone-100">Rekening Tujuan Booth:</div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>BCA: 8720-192-881</span>
                    <span className="font-bold text-[#5c3826] dark:text-amber-400">a/n Dua Carita Coffee Rasa</span>
                  </div>
                  <p className="text-xs text-stone-400">Pastikan bukti mutasi telah masuk sebelum konfirmasi.</p>
                </div>
              )}
            </div>

            {/* Sticky Modal Footer (Selalu Terlihat di Layar) */}
            <div className="p-3.5 sm:p-4 border-t border-[#e7ded5] dark:border-[#2e231d] bg-[#fbf9f6] dark:bg-[#18110e] shrink-0 flex items-center gap-2 shadow-xs">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 font-bold text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={processingOrder || (paymentMethod === "cash" && cashGiven < totalAmount)}
                onClick={handleConfirmPayment}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{processingOrder ? "Memproses..." : "Konfirmasi & Cetak Struk"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Customization Fast Order Modal */}
      <PosProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingCartItemIndex(null);
        }}
        product={modalProduct}
        allProducts={products}
        initialQty={modalInitialQty}
        initialNotes={modalInitialNotes}
        onAddToCart={handleAddToCartFromModal}
      />

      {/* Completed Order Receipt Modal */}
      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
}
