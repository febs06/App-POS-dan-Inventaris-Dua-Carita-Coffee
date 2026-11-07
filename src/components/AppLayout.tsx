"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import { Store } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = pathname === "/" || pathname === "/login";

  // Synchronous guard to prevent any flash of restricted routes during client navigation
  const isRestrictedForCashier = !isPublicRoute && (() => {
    if (typeof window === "undefined") return false;
    try {
      const saved =
        sessionStorage.getItem("active_cashier") ||
        localStorage.getItem("active_cashier");
      if (!saved) return false;
      const c = JSON.parse(saved);
      const role = c?.role?.trim().toUpperCase();
      const isOwner = role === "OWNER" || role === "MANAGER";
      const KASIR_ALLOWED_ROUTES = ["/pos", "/bazaar-orders", "/po"];
      return !isOwner && !KASIR_ALLOWED_ROUTES.includes(pathname);
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    if (isPublicRoute) {
      setAuthChecking(false);
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = () => {
      try {
        const sessionActive =
          sessionStorage.getItem("active_cashier") ||
          localStorage.getItem("active_cashier");
        if (!sessionActive) {
          setIsAuthenticated(false);
          router.replace("/login");
          return;
        }

        const cashier = JSON.parse(sessionActive);
        const role = cashier?.role?.trim().toUpperCase();
        const isOwner = role === "OWNER" || role === "MANAGER";
        const KASIR_ALLOWED_ROUTES = ["/pos", "/bazaar-orders", "/po"];

        // RBAC Route Guard:
        // Role KASIR atau non-owner DILARANG keras mengakses modul admin, keuangan, stok, dan pengaturan
        if (!isOwner && !KASIR_ALLOWED_ROUTES.includes(pathname)) {
          console.warn(`[RBAC] Akses Ditolak: Role "${cashier?.role}" mencoba mengakses "${pathname}". Mengalihkan ke /pos.`);
          setIsAuthenticated(false);
          router.replace("/pos");
          return;
        }

        setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(false);
        router.replace("/login");
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();

    const handleCashierUpdated = () => {
      checkAuth();
    };

    window.addEventListener("cashier-updated", handleCashierUpdated);
    return () => window.removeEventListener("cashier-updated", handleCashierUpdated);
  }, [pathname, router, isPublicRoute]);

  if (pathname === "/") {
    return (
      <div className="min-h-screen bg-[#15100c] text-[#f7f2ea]">
        {children}
      </div>
    );
  }

  if (pathname === "/login") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {children}
      </div>
    );
  }

  // Show loading splash while verifying session or redirecting unauthorized cashier
  if (authChecking || !isAuthenticated || isRestrictedForCashier) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 animate-pulse">
            <Store className="h-7 w-7" />
          </div>
          <div>
            <h3 className="font-black text-white text-base tracking-tight">Dua Carita Coffee</h3>
            <p className="text-xs text-slate-400 mt-1">Memeriksa otorisasi kasir...</p>
          </div>
          <div className="h-1.5 w-28 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-amber-500 rounded-full w-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#15100e] text-[#1c1512] dark:text-[#f5efe6] flex font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
