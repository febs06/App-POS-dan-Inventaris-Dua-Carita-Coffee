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
      <header className="sticky top-0 z-30 h-14 sm:h-16 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 overflow-x-clip">
        {/* Left Side: Hamburger & Active Event & Mode Switcher */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden shrink-0 border border-slate-200/80 dark:border-slate-700/60"
            aria-label="Toggle Menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Dual-Mode Quick Pill */}
          <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => handleToggleMode("kasir")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                appMode === "kasir"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Beralih ke App Kasir Booth"
            >
              🎪 Kasir
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode("inventaris")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                appMode === "inventaris"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Beralih ke App Inventaris & Back-Office"
            >
              🏢 Inventaris
            </button>
          </div>

          {/* Ongoing Event Status */}
          {activeEvent ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 shrink-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold text-[11px] sm:text-xs truncate max-w-[110px] sm:max-w-[180px]">{activeEvent.name}</span>
              <span className="hidden md:inline text-emerald-600 dark:text-emerald-400">({activeEvent.location})</span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 shrink-0">
              <Calendar className="h-3.5 w-3.5" />
              <span>Booth Mandiri</span>
            </div>
          )}
        </div>

        {/* Right Side: Cashier, Low Stock, & POS Action */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Low Stock Warning Icon */}
          {lowStockCount > 0 && (
            <Link
              href="/stock"
              title={`${lowStockCount} produk stok menipis!`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-100 transition shrink-0"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="hidden md:inline font-semibold">Kritis:</span>
              <span>{lowStockCount}</span>
            </Link>
          )}

          {/* Active Cashier Shift Badge */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCashierModalOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs text-slate-700 dark:text-slate-200 transition cursor-pointer shrink-0"
              title="Klik untuk ganti shift kasir"
            >
              <UserCheck className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="hidden md:inline text-slate-500 font-medium">Kasir:</span>
              <span className="font-bold text-[11px] sm:text-xs truncate max-w-[65px] sm:max-w-[110px]">{activeCashier?.name || "Kasir"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="hidden md:inline-flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 transition shrink-0 cursor-pointer"
              title="Keluar / Kunci Kiosk"
            >
              <Lock className="h-3.5 w-3.5" />
            </button>

          </div>

          {/* Fast Action Buttons */}
          <Link
            href="/po"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 text-xs font-semibold hover:bg-violet-100 transition shrink-0"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>PO</span>
          </Link>

          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition shrink-0"
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
