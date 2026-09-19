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
  Sparkles,
  Lock,
} from "lucide-react";
import CashierLoginModal from "./CashierLoginModal";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Kasir Direct (POS)", icon: ShoppingCart, highlight: true },
  { href: "/po", label: "Kelola Pre-Order (PO)", icon: Clock, highlight: true },
  { href: "/events", label: "Event / Bazaar", icon: CalendarDays },
  { href: "/products", label: "Produk & Kategori", icon: UtensilsCrossed },
  { href: "/stock", label: "Manajemen Stok", icon: Boxes },
  { href: "/customers", label: "Pelanggan PO", icon: Users },
  { href: "/vouchers", label: "Voucher & Diskon", icon: TicketPercent },
  { href: "/reports", label: "Riwayat & Laporan", icon: FileText },
  { href: "/analytics", label: "Visual Analytics", icon: BarChart3 },
  { href: "/settings", label: "Pengaturan & Toko", icon: Settings },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
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
    } catch (e) {
      setActiveCashier(null);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("active_cashier");
      localStorage.removeItem("active_cashier");
      window.dispatchEvent(new Event("cashier-updated"));
      router.push("/login");
    } catch (e) {}
  };


  useEffect(() => {
    loadSettings();
    loadCashier();

    const handleSettingsUpdated = () => loadSettings();
    const handleCashierUpdated = () => loadCashier();

    window.addEventListener("settings-updated", handleSettingsUpdated);
    window.addEventListener("cashier-updated", handleCashierUpdated);

    return () => {
      window.removeEventListener("settings-updated", handleSettingsUpdated);
      window.removeEventListener("cashier-updated", handleCashierUpdated);
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
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/40">
            {storeSetting.logoUrl ? (
              <img
                src={storeSetting.logoUrl}
                alt={storeSetting.storeName}
                className="h-10 w-10 rounded-xl object-cover border border-amber-500/30 shadow-md bg-white shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
                <Store className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white truncate block">
                  {storeSetting.storeName || "Dua Carita Coffee"}
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  POS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                {storeSetting.tagline || "Bazaar & Pre-Order System"}
              </p>
            </div>
          </div>

          {/* Nav List */}
          <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-170px)]">
            <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Menu Utama
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20"
                      : item.highlight
                      ? "text-slate-200 hover:bg-slate-800/80 hover:text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-slate-950" : item.highlight ? "text-amber-400" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.highlight && !isActive && (
                    <span className="ml-auto flex h-2 w-2 rounded-full bg-amber-400" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer: Cashier & System info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50 space-y-2">
          {/* Active Cashier Card */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-medium">Kasir Bertugas:</span>
                <span className="text-xs font-bold text-slate-200 truncate block">
                  {activeCashier?.name || "Kasir"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCashierModalOpen(true)}
                className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition shrink-0 cursor-pointer"
                title="Ganti Kasir Cepat"
              >
                Ganti
              </button>
              <button
                onClick={handleLogout}
                className="text-[10px] font-bold px-1.5 py-1 rounded-md bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-300 transition shrink-0 cursor-pointer flex items-center gap-1"
                title="Keluar / Kunci Kiosk"
              >
                <Lock className="h-3 w-3" />
              </button>

            </div>
          </div>
        </div>
      </aside>

      {/* Cashier Switch Modal */}
      {isCashierModalOpen && (
        <CashierLoginModal
          isOpen={isCashierModalOpen}
          onClose={() => setIsCashierModalOpen(false)}
          onSuccess={(emp) => setActiveCashier(emp)}
        />
      )}
    </>
  );
}
