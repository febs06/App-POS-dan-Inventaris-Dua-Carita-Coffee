import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ShoppingCart, PlusCircle, AlertTriangle, Calendar, UserCheck, Lock } from "lucide-react";
import CashierLoginModal from "./CashierLoginModal";

interface TopNavProps {
  onToggleSidebar: () => void;
}

export default function TopNav({ onToggleSidebar }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeEvent, setActiveEvent] = useState<{ id: string; name: string; location: string } | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [activeCashier, setActiveCashier] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);
  const [isCashierModalOpen, setIsCashierModalOpen] = useState(false);

  const handleLogout = () => {
    try {
      localStorage.removeItem("active_cashier");
      window.dispatchEvent(new Event("cashier-updated"));
      router.push("/login");
    } catch (e) {}
  };

  const fetchActiveEvent = () => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const ongoing = data.find((e: any) => e.status === "ongoing");
          setActiveEvent(ongoing || null);
        } else {
          setActiveEvent(null);
        }
      })
      .catch(() => {
        setActiveEvent(null);
      });
  };

  const fetchLowStock = () => {
    fetch("/api/stock")
      .then((res) => res.json())
      .then((data) => {
        if (data.lowStockCount !== undefined) {
          setLowStockCount(data.lowStockCount);
        }
      })
      .catch(() => {});
  };

  const loadCashier = () => {
    try {
      const saved = localStorage.getItem("active_cashier");
      if (saved) {
        setActiveCashier(JSON.parse(saved));
      } else {
        setActiveCashier(null);
      }
    } catch (e) {
      setActiveCashier(null);
    }
  };


  useEffect(() => {
    fetchActiveEvent();
    fetchLowStock();
    loadCashier();

    const handleEventUpdated = () => fetchActiveEvent();
    const handleCashierUpdated = () => loadCashier();

    window.addEventListener("event-updated", handleEventUpdated);
    window.addEventListener("cashier-updated", handleCashierUpdated);

    return () => {
      window.removeEventListener("event-updated", handleEventUpdated);
      window.removeEventListener("cashier-updated", handleCashierUpdated);
    };
  }, [pathname]);

  const [appMode, setAppMode] = useState<"kasir" | "inventaris">("kasir");

  useEffect(() => {
    const isKasirRoute = pathname === "/pos" || pathname === "/bazaar-orders";
    const isInventarisRoute =
      pathname === "/stock" ||
      pathname === "/products" ||
      pathname === "/suppliers" ||
      pathname === "/reports" ||
      pathname === "/analytics" ||
      pathname === "/settings";

    if (isKasirRoute) setAppMode("kasir");
    else if (isInventarisRoute) setAppMode("inventaris");
    else {
      const savedMode = localStorage.getItem("app_mode") as "kasir" | "inventaris";
      if (savedMode) setAppMode(savedMode);
    }
  }, [pathname]);

  const handleToggleMode = (mode: "kasir" | "inventaris") => {
    setAppMode(mode);
    localStorage.setItem("app_mode", mode);
    window.dispatchEvent(new CustomEvent("app-mode-changed", { detail: mode }));
    if (mode === "kasir" && pathname !== "/pos" && pathname !== "/bazaar-orders" && pathname !== "/po") {
      router.push("/pos");
    } else if (mode === "inventaris" && (pathname === "/pos" || pathname === "/bazaar-orders")) {
      router.push("/stock");
    }
  };

  const todayStr = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <>
      <header className="sticky top-0 z-30 h-14 sm:h-16 w-full bg-[#faf8f5]/95 dark:bg-[#1c1512]/95 backdrop-blur-md border-b border-[#e7ded5] dark:border-[#2e231d] px-3 sm:px-6 flex items-center justify-between gap-2 overflow-x-clip">
        {/* Left Side: Hamburger & Active Event & Mode Switcher */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-stone-700 dark:text-stone-200 hover:bg-[#ede5dc] dark:hover:bg-[#2e231d] lg:hidden shrink-0 border border-[#e7ded5] dark:border-[#2e231d]"
            aria-label="Toggle Menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Dual-Mode Quick Pill (Hanya Tampil untuk Owner / Manager) */}
          {(activeCashier?.role === "OWNER" || activeCashier?.role === "MANAGER") && (
            <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-[#ede5dc]/80 dark:bg-[#251b16] border border-[#d8ccc0] dark:border-[#382b23] text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => handleToggleMode("kasir")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs ${
                  appMode === "kasir"
                    ? "bg-amber-500 text-stone-950 font-black shadow-xs"
                    : "text-stone-600 hover:text-stone-950 dark:text-stone-400 dark:hover:text-white"
                }`}
                title="Beralih ke App Kasir Booth"
              >
                <span>🎪 Kasir</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleMode("inventaris")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer text-xs ${
                  appMode === "inventaris"
                    ? "bg-amber-500 text-stone-950 font-black shadow-xs"
                    : "text-stone-600 hover:text-stone-950 dark:text-stone-400 dark:hover:text-white"
                }`}
                title="Beralih ke App Inventaris & Back-Office"
              >
                <span>🏢 Inventaris</span>
              </button>
            </div>
          )}

          {/* Ongoing Event Status */}
          {activeEvent ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 shrink-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-xs truncate max-w-[120px] sm:max-w-[180px]">{activeEvent.name}</span>
              <span className="hidden md:inline text-emerald-700 dark:text-emerald-400">({activeEvent.location})</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ede5dc]/70 dark:bg-[#251b16] border border-[#d8ccc0] dark:border-[#382b23] text-xs text-stone-700 dark:text-stone-300 shrink-0">
              <Calendar className="h-3.5 w-3.5 text-stone-500" />
              <span className="font-semibold">Booth Mandiri</span>
            </div>
          )}
        </div>

        {/* Right Side: Cashier, Low Stock, & POS Action */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Low Stock Warning Icon (Hanya untuk Owner / Manager) */}
          {(activeCashier?.role === "OWNER" || activeCashier?.role === "MANAGER") && lowStockCount > 0 && (
            <Link
              href="/stock?openWa=true"
              title={`${lowStockCount} bahan baku/produk stok menipis! Klik untuk kirim rekap WhatsApp`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold hover:bg-amber-100 transition shrink-0"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="hidden md:inline font-semibold">Kritis:</span>
              <span className="tabular-nums">{lowStockCount}</span>
            </Link>
          )}

          {/* Active Cashier Shift Badge */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCashierModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#d8ccc0] dark:border-[#382b23] bg-[#f5ede4] dark:bg-[#251b16] hover:bg-[#ede3d8] dark:hover:bg-[#2f221c] text-xs text-stone-800 dark:text-stone-200 transition cursor-pointer shrink-0"
              title="Klik untuk ganti shift kasir"
            >
              <UserCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="hidden md:inline text-stone-500 dark:text-stone-400 font-medium">Kasir:</span>
              <span className="font-bold text-xs truncate max-w-[80px] sm:max-w-[120px]">{activeCashier?.name || "Kasir"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="hidden md:inline-flex p-1.5 rounded-lg border border-[#d8ccc0] dark:border-[#382b23] bg-[#f5ede4] dark:bg-[#251b16] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:hover:bg-[#2f221c] text-stone-600 dark:text-stone-300 transition shrink-0 cursor-pointer"
              title="Keluar / Kunci Kiosk"
            >
              <Lock className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Fast Action Buttons */}
          <Link
            href="/po"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ede5dc] dark:bg-[#251b16] text-[#5c3826] dark:text-amber-300 border border-[#d8ccc0] dark:border-[#382b23] text-xs font-bold hover:bg-[#e4dacd] transition shrink-0"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>PO</span>
          </Link>

          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black shadow-xs transition shrink-0"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Kasir POS</span>
            <span className="sm:hidden">POS</span>
          </Link>
        </div>
      </header>


      {/* Cashier Shift Modal */}
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
