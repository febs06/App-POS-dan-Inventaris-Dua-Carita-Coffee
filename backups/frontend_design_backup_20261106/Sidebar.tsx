"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  LayoutDashboard,
  ShoppingCart,
  CalendarDays,
  UtensilsCrossed,
  Users,
  Boxes,
  TicketPercent,
  FileText,
  BarChart3,
  Clock,
  Store,
  Settings,
  UserCheck,
  Lock,
  Truck,
  Wallet,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import CashierLoginModal from "./CashierLoginModal";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

// 🎪 Mode Kasir Booth: Only 4 essential, high-speed tools
const KASIR_NAV_ITEMS = [
  { href: "/pos", label: "Kasir Direct (POS)", icon: ShoppingCart, highlight: true },
  { href: "/bazaar-orders", label: "Pesanan Bazaar Hari Ini", icon: ShoppingBag, isLive: true },
  { href: "/po", label: "Ambil Pre-Order (PO)", icon: Clock },
  { href: "/finance", label: "Kas Booth & Shift", icon: Wallet },
];

// 🏢 Mode Inventaris & Back-Office: Full organized management
const INVENTARIS_SECTIONS = [
  {
    title: "Operasional & Stok",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/stock", label: "Manajemen Stok & Resep", icon: Boxes },
      { href: "/products", label: "Produk & Kategori", icon: UtensilsCrossed },
      { href: "/suppliers", label: "Master Supplier", icon: Truck },
      { href: "/events", label: "Event / Bazaar", icon: CalendarDays },
    ],
  },
  {
    title: "Keuangan & Laporan",
    items: [
      { href: "/finance", label: "Buku Kas & Keuangan", icon: Wallet },
      { href: "/reports", label: "Riwayat & Laporan Audit", icon: FileText },
      { href: "/analytics", label: "Visual Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Pelanggan & Sistem",
    items: [
      { href: "/customers", label: "Pelanggan PO", icon: Users },
      { href: "/vouchers", label: "Voucher & Diskon", icon: TicketPercent },
      { href: "/settings", label: "Pengaturan & Toko", icon: Settings },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Dual-mode state: "kasir" vs "inventaris"
  const [appMode, setAppMode] = useState<"kasir" | "inventaris">("kasir");

  const [storeSetting, setStoreSetting] = useState<{
    storeName: string;
    tagline: string | null;
    logoUrl: string | null;
  }>({
    storeName: "Dua Carita Coffee",
    tagline: "Bazaar & Pre-Order System",
    logoUrl: null,
  });

  const [activeCashier, setActiveCashier] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);

  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);

  // Sync mode with current pathname or localStorage
  useEffect(() => {
    const isKasirRoute = pathname === "/pos" || pathname === "/bazaar-orders";
    const isInventarisRoute =
      pathname === "/stock" ||
      pathname === "/products" ||
      pathname === "/suppliers" ||
      pathname === "/reports" ||
      pathname === "/analytics" ||
      pathname === "/settings";

    if (isKasirRoute) {
      setAppMode("kasir");
      localStorage.setItem("app_mode", "kasir");
    } else if (isInventarisRoute) {
      setAppMode("inventaris");
      localStorage.setItem("app_mode", "inventaris");
    } else {
      const savedMode = localStorage.getItem("app_mode") as "kasir" | "inventaris";
      if (savedMode === "kasir" || savedMode === "inventaris") {
        setAppMode(savedMode);
      }
    }
  }, [pathname]);

  const handleSetMode = (mode: "kasir" | "inventaris") => {
    setAppMode(mode);
    localStorage.setItem("app_mode", mode);
    window.dispatchEvent(new CustomEvent("app-mode-changed", { detail: mode }));

    if (mode === "kasir" && pathname !== "/pos" && pathname !== "/bazaar-orders" && pathname !== "/po") {
      router.push("/pos");
    } else if (mode === "inventaris" && (pathname === "/pos" || pathname === "/bazaar-orders")) {
      router.push("/stock");
    }
  };

  const loadSettings = async () => {
    try {
      const cached = localStorage.getItem("store_settings");
      if (cached) {
        setStoreSetting(JSON.parse(cached));
      }
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data && data.storeName) {
        setStoreSetting(data);
        localStorage.setItem("store_settings", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Failed to load settings in sidebar:", err);
    }
  };

  const loadCashier = () => {
    try {
      const saved =
        sessionStorage.getItem("active_cashier") ||
        localStorage.getItem("active_cashier");
      if (saved) {
        setActiveCashier(JSON.parse(saved));
      } else {
        setActiveCashier(null);
      }
    } catch {
      setActiveCashier(null);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("active_cashier");
      localStorage.removeItem("active_cashier");
      window.dispatchEvent(new Event("cashier-updated"));
      router.push("/login");
    } catch {}
  };

  useEffect(() => {
    loadSettings();
    loadCashier();

    const handleSettingsUpdated = () => loadSettings();
    const handleCashierUpdated = () => loadCashier();
    const handleModeChanged = (e: any) => {
      if (e.detail) setAppMode(e.detail);
    };

    window.addEventListener("settings-updated", handleSettingsUpdated);
    window.addEventListener("cashier-updated", handleCashierUpdated);
    window.addEventListener("app-mode-changed", handleModeChanged);

    return () => {
      window.removeEventListener("settings-updated", handleSettingsUpdated);
      window.removeEventListener("cashier-updated", handleCashierUpdated);
      window.removeEventListener("app-mode-changed", handleModeChanged);
    };
  }, []);

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 flex flex-col justify-between bg-slate-900 text-slate-100 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1">
          {/* Brand Header */}
          <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/40 shrink-0">
            {storeSetting.logoUrl ? (
              <img
                src={storeSetting.logoUrl}
                alt={storeSetting.storeName}
                className="h-10 w-10 rounded-xl object-cover border border-amber-500/30 shadow-md bg-white shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0 font-black">
                <Store className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white truncate block">
                  {storeSetting.storeName || "Dua Carita Coffee"}
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  {appMode === "kasir" ? "KASIR" : "ADMIN"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                {storeSetting.tagline || "Bazaar & Pre-Order System"}
              </p>
            </div>
          </div>

          {/* DUAL-MODE SWITCHER (1 Web, 2 Focused Spaces) */}
          <div className="p-3 pb-2 shrink-0 border-b border-slate-800/80 bg-slate-950/30">
            <div className="grid grid-cols-2 p-1 bg-slate-950/90 rounded-2xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleSetMode("kasir")}
                className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  appMode === "kasir"
                    ? "bg-amber-500 text-slate-950 shadow-md font-black"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Beralih ke App Kasir Booth (Fokus Bazaar)"
              >
                <span>🎪 Kasir Booth</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetMode("inventaris")}
                className={`py-2 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  appMode === "inventaris"
                    ? "bg-amber-500 text-slate-950 shadow-md font-black"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Beralih ke App Inventaris & Back-Office"
              >
                <span>🏢 Inventaris</span>
              </button>
            </div>
          </div>

          {/* NAV LIST AREA */}
          <div className="p-3 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
            {appMode === "kasir" ? (
              /* ================= MODE KASIR BOOTH ================= */
              <div className="space-y-1">
                <div className="px-3 pt-2 pb-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400/90 flex items-center justify-between">
                  <span>Menu Kasir Bazaar</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>

                {KASIR_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                          : item.highlight
                          ? "text-slate-100 hover:bg-slate-800/90 hover:text-white bg-slate-800/40"
                          : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive
                            ? "text-slate-950"
                            : item.highlight
                            ? "text-amber-400"
                            : "text-slate-400"
                        }`}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.isLive && !isActive && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Live
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Info Card Mode Kasir */}
                <div className="p-3.5 mt-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Mode Kasir Ramping</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Menu administratif disembunyikan agar kasir fokus pada antrean pesanan booth saat bazaar.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSetMode("inventaris")}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Buka Inventaris & Admin</span>
                    <ArrowRight className="h-3 w-3 text-amber-400" />
                  </button>
                </div>
              </div>
            ) : (
              /* ================= MODE INVENTARIS & MANAGEMENT ================= */
              <div className="space-y-4">
                {INVENTARIS_SECTIONS.map((sec, secIdx) => (
                  <div key={sec.title} className="space-y-1">
                    <div className="px-3 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {sec.title}
                    </div>
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black"
                              : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive ? "text-slate-950" : "text-slate-400"
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}

                {/* Quick Link to Kasir POS */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSetMode("kasir")}
                    className="w-full py-2.5 px-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-400 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Buka Kasir Direct (POS)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cashier Footer Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-800/60 border border-slate-800 text-xs">
            <div className="min-w-0 flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black shrink-0">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-200 truncate">
                  {activeCashier ? activeCashier.name : "Kasir Booth"}
                </div>
                <div className="text-[10px] text-slate-400 capitalize truncate">
                  {activeCashier ? activeCashier.role : "Shift Kasir"}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsCashierModalOpen(true)}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 px-2 py-1 rounded-lg transition shrink-0 cursor-pointer"
              title="Ganti Kasir"
            >
              Ganti
            </button>

            <button
              onClick={handleLogout}
              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0 cursor-pointer"
              title="Keluar (Logout)"
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Cashier Switch Modal */}
      <CashierLoginModal
        isOpen={isCashierModalOpen}
        onClose={() => setIsCashierModalOpen(false)}
        onSuccess={() => {
          loadCashier();
          setIsCashierModalOpen(false);
        }}
      />
    </>
  );
}
