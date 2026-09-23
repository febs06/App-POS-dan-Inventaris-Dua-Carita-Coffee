"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatRupiah } from "@/lib/format";
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
} from "lucide-react";
import ReceiptModal from "@/components/ReceiptModal";

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
}

interface CartItem {
  product: Product;
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
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0);

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

  // Cart actions
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    if (product.isAvailableByIngredients === false) {
      const missingList = product.missingIngredients?.map((m) => m.name).join(", ") || "Bahan baku habis";
      alert(`Menu "${product.name}" tidak dapat dipesan karena stok bahan baku tidak mencukupi (${missingList})!`);
      return;
    }

    const effectiveStock =
      product.maxProducible !== undefined && product.maxProducible !== null
        ? Math.min(product.stock, product.maxProducible)
        : product.stock;

    if (effectiveStock <= 0) {
      alert(`Stok bahan baku untuk "${product.name}" tidak mencukupi untuk membuat 1 porsi.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.qty >= effectiveStock) {
          alert(`Maksimal pesanan ${product.name} yang dapat dibuat saat ini adalah ${effectiveStock} ${product.unit}`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1, notes: "" }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.qty + delta;
            const effectiveStock =
              item.product.maxProducible !== undefined && item.product.maxProducible !== null
                ? Math.min(item.product.stock, item.product.maxProducible)
                : item.product.stock;

            if (newQty > effectiveStock) {
              alert(`Maksimal ${effectiveStock} ${item.product.unit} dapat dibuat berdasarkan stok produk dan bahan baku saat ini.`);
              return item;
            }
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateItemNotes = (productId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, notes } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
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

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setCashGiven(totalAmount);
    setIsCheckoutOpen(true);
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
          qty: item.qty,
          notes: item.notes || null,
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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">Lokasi Event Kasir:</span>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="text-xs font-semibold bg-white text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">-- Tanpa Event (Booth Mandiri) --</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name} {ev.status === "ongoing" ? "🟢 (Ongoing)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari menu / minuman..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${selectedCategory === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
            >
              Semua Menu ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${selectedCategory === c.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Memuat katalog menu...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
              Tidak ada produk yang cocok dengan pencarian.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3.5">
              {filteredProducts.map((p) => {
                const inCart = cart.find((item) => item.product.id === p.id);
                const isRawMissing = p.isAvailableByIngredients === false;
                const effectiveStock =
                  p.maxProducible !== undefined && p.maxProducible !== null
                    ? Math.min(p.stock, p.maxProducible)
                    : p.stock;
                const isOutOfStock = p.stock <= 0 || isRawMissing || effectiveStock <= 0;

                return (
                  <button
                    key={p.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(p)}
                    className={`relative p-3 rounded-2xl bg-white border text-left flex flex-col justify-between transition group shadow-xs ${
                      isOutOfStock
                        ? "opacity-60 grayscale-[30%] cursor-not-allowed border-rose-200 bg-rose-50/20"
                        : inCart
                        ? "border-amber-400 ring-2 ring-amber-400/20 shadow-md"
                        : "border-slate-200/80 hover:border-amber-400 hover:shadow-md"
                    }`}
                  >
                    {/* Badge Stock */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 truncate">
                        {p.category?.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isRawMissing
                            ? "bg-rose-100 text-rose-800 border border-rose-300 font-black"
                            : isOutOfStock
                            ? "bg-rose-100 text-rose-700"
                            : effectiveStock <= 5
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {isRawMissing
                          ? "Bahan Habis"
                          : isOutOfStock
                          ? "Habis"
                          : `${effectiveStock} ${p.unit}`}
                      </span>
                    </div>

                    {/* Image Placeholder or Actual Image */}
                    {p.imageUrl ? (
                      <div className="relative w-full h-24 mb-2 rounded-xl overflow-hidden bg-slate-100">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className={`w-full h-full object-cover transition duration-300 ${
                            isOutOfStock ? "opacity-60" : "group-hover:scale-105"
                          }`}
                        />
                        {isRawMissing && (
                          <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center p-1">
                            <span className="text-[10px] font-black uppercase text-white bg-rose-600 px-2 py-0.5 rounded-md shadow-sm">
                              Bahan Habis
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`w-full h-24 mb-2 rounded-xl flex items-center justify-center font-bold text-xs relative ${
                          isOutOfStock
                            ? "bg-slate-100 text-slate-400"
                            : "bg-gradient-to-tr from-amber-50 to-orange-100 text-amber-700"
                        }`}
                      >
                        {p.name.slice(0, 2).toUpperCase()}
                        {isRawMissing && (
                          <div className="absolute inset-0 bg-slate-950/40 rounded-xl flex items-center justify-center p-1">
                            <span className="text-[10px] font-black uppercase text-white bg-rose-600 px-2 py-0.5 rounded-md shadow-sm">
                              Bahan Habis
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{p.name}</h4>
                      {isRawMissing && p.missingIngredients && p.missingIngredients.length > 0 && (
                        <p className="text-[10px] font-semibold text-rose-600 line-clamp-1 mt-0.5">
                          Kurang: {p.missingIngredients.map((m) => m.name).join(", ")}
                        </p>
                      )}
                      <div className="font-black text-sm text-slate-900 mt-1">
                        {formatRupiah(p.price)}
                      </div>
                    </div>

                    {inCart && (
                      <div className="mt-2 text-center py-0.5 bg-amber-500 text-slate-950 font-black text-[11px] rounded-lg">
                        {inCart.qty} di keranjang
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Cart Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[calc(100vh-140px)] sticky top-20">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">Keranjang Kasir</h3>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-2">
                <ShoppingCart className="h-8 w-8 text-slate-300" />
                <p>Belum ada produk dipilih.<br />Klik menu di samping untuk menambahkan.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{item.product.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {formatRupiah(item.product.price)} / {item.product.unit}
                      </div>
                    </div>
                    <div className="font-black text-slate-900">
                      {formatRupiah(item.product.price * item.qty)}
                    </div>
                  </div>

                  {/* Notes input */}
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateItemNotes(item.product.id, e.target.value)}
                    placeholder="Catatan (misal: less sugar / pedas)..."
                    className="w-full text-[11px] px-2.5 py-1 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />

                  {/* Qty Switcher */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Hapus"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.product.id, -1)}
                        className="h-6 w-6 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-bold text-xs w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.product.id, 1)}
                        className="h-6 w-6 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100"
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
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
            {/* Voucher / Discount Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-600">Diskon & Promo:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDiscountType("voucher")}
                    className={`font-semibold ${discountType === "voucher" ? "text-amber-600 underline" : "text-slate-400"
                      }`}
                  >
                    Kode Voucher
                  </button>
                  <span>|</span>
                  <button
                    onClick={() => setDiscountType("manual")}
                    className={`font-semibold ${discountType === "manual" ? "text-amber-600 underline" : "text-slate-400"
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
                      className="flex-1 text-xs uppercase px-2.5 py-1.5 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                    <button
                      onClick={handleApplyVoucher}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                    >
                      Pakai
                    </button>
                  </div>
                  {voucherError && (
                    <p className="text-[10px] text-rose-600 font-medium">{voucherError}</p>
                  )}
                  {appliedVoucher && (
                    <div className="flex items-center justify-between text-[11px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      <span>✓ {appliedVoucher.code} diterapkan</span>
                      <button
                        onClick={() => {
                          setAppliedVoucher(null);
                          setVoucherCodeInput("");
                        }}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <select
                    value={manualDiscountType}
                    onChange={(e) => setManualDiscountType(e.target.value as any)}
                    className="text-xs bg-white text-slate-900 border border-slate-200 rounded-lg px-2 py-1.5"
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
                    className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>

            {/* Calculations */}
            <div className="space-y-1 text-xs pt-2 border-t border-slate-200">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Potongan Diskon</span>
                  <span>-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-base text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Bayar</span>
                <span>{formatRupiah(totalAmount)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Proses Bayar ({formatRupiah(totalAmount)})
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal with Payment Simulator */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-base text-slate-900">Pembayaran Kasir</h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <span className="text-xs text-amber-800 font-medium block">Total yang harus dibayar</span>
              <span className="text-2xl font-black text-amber-900">{formatRupiah(totalAmount)}</span>
            </div>

            {/* Input Nama Pelanggan Direct */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex justify-between">
                <span>Nama Pelanggan</span>
                <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Kak Dian / Meja 3 / Tamu"
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
              />
            </div>

            {/* Status Pesanan Selector */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Status Pengerjaan Pesanan</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderStatus("selesai")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    orderStatus === "selesai"
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Langsung Selesai</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderStatus("diproses")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    orderStatus === "diproses"
                      ? "bg-amber-500 text-slate-950 border-amber-600 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>⏳ Sedang Diproses (Antre)</span>
                </button>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Pilih Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${paymentMethod === "cash"
                    ? "bg-amber-500 text-slate-950 border-amber-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  <Banknote className="h-5 w-5" />
                  <span>Tunai</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("qris")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${paymentMethod === "qris"
                    ? "bg-amber-500 text-slate-950 border-amber-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  <QrCode className="h-5 w-5" />
                  <span>QRIS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("transfer")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition ${paymentMethod === "transfer"
                    ? "bg-amber-500 text-slate-950 border-amber-600 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Transfer</span>
                </button>
              </div>
            </div>

            {/* Cash Calculator */}
            {paymentMethod === "cash" && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">Uang Diterima (Cash)</label>
                <input
                  type="number"
                  value={cashGiven || ""}
                  onChange={(e) => setCashGiven(Number(e.target.value))}
                  className="w-full text-base font-bold px-3 py-2 rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                />

                {/* Quick cash pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setCashGiven(totalAmount)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Uang Pas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashGiven(50000)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Rp 50.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashGiven(100000)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Rp 100.000
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashGiven(200000)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    Rp 200.000
                  </button>
                </div>

                {/* Change */}
                <div className="p-2.5 rounded-xl bg-slate-100 flex justify-between items-center text-xs font-bold mt-2">
                  <span className="text-slate-600">Kembalian:</span>
                  <span
                    className={`text-sm ${cashGiven < totalAmount ? "text-rose-600" : "text-emerald-700"
                      }`}
                  >
                    {cashGiven < totalAmount
                      ? `Kurang ${formatRupiah(totalAmount - cashGiven)}`
                      : formatRupiah(cashGiven - totalAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* QRIS preview */}
            {paymentMethod === "qris" && (
              <div className="text-center py-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="w-36 h-36 mx-auto bg-white p-2 rounded-lg border border-slate-300 flex items-center justify-center shadow-xs">
                  <QrCode className="w-28 h-28 text-slate-800" />
                </div>
                <p className="text-xs text-slate-500">Scan QRIS Dua Carita Coffee untuk verifikasi pembayaran</p>
              </div>
            )}

            {/* Transfer preview */}
            {paymentMethod === "transfer" && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="font-bold text-slate-800">Rekening Tujuan Booth:</div>
                <div className="flex justify-between text-slate-600">
                  <span>BCA: 8720-192-881</span>
                  <span className="font-semibold text-slate-900">a/n Dua Carita Coffee Rasa</span>
                </div>
                <p className="text-[11px] text-slate-400">Pastikan bukti mutasi telah masuk sebelum konfirmasi.</p>
              </div>
            )}

            <button
              type="button"
              disabled={processingOrder || (paymentMethod === "cash" && cashGiven < totalAmount)}
              onClick={handleConfirmPayment}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition"
            >
              {processingOrder ? "Memproses Transaksi..." : "Konfirmasi & Cetak Struk"}
            </button>
          </div>
        </div>
      )}

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
