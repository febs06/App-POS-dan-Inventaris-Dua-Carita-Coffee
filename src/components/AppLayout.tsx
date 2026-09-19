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

  useEffect(() => {
    if (pathname === "/login") {
      setAuthChecking(false);
      setIsAuthenticated(true);
      return;
    }

    const checkAuth = () => {
      try {
        const saved = localStorage.getItem("active_cashier");
        if (!saved) {
          setIsAuthenticated(false);
          router.replace("/login");
        } else {
          setIsAuthenticated(true);
        }
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
  }, [pathname, router]);

  if (pathname === "/login") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {children}
      </div>
    );
  }

  // Show loading splash while verifying session
  if (authChecking || !isAuthenticated) {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
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
