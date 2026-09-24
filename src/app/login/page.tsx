"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  Lock,
  User,
  Shield,
  Clock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

interface StoreSetting {
  storeName: string;
  tagline: string | null;
  logoUrl: string | null;
}

interface ActiveEvent {
  id: string;
  name: string;
  location: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeSetting, setStoreSetting] = useState<StoreSetting>({
    storeName: "Dua Carita Coffee",
    tagline: "Bazaar & Pre-Order System",
    logoUrl: null,
  });
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch store settings & active event
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [settRes, eventRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/events"),
        ]);

        const sett = await settRes.json();
        if (sett && sett.storeName) {
          setStoreSetting(sett);
        }

        const events = await eventRes.json();
        if (Array.isArray(events)) {
          const ongoing = events.find((e: any) => e.status === "ongoing");
          if (ongoing) setActiveEvent(ongoing);
        }
      } catch (err) {
        console.error("Failed to load login page data:", err);
      }
    };

    loadInitialData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username / User ID wajib diisi");
      return;
    }
    if (!password) {
      setError("Password wajib diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/employees/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Username atau password salah");
        return;
      }

      // Save cashier info to sessionStorage and localStorage
      sessionStorage.setItem("active_cashier", JSON.stringify(data.employee));
      localStorage.setItem("active_cashier", JSON.stringify(data.employee));
      window.dispatchEvent(new Event("cashier-updated"));

      // Redirect to POS
      router.push("/pos");
    } catch {
      setError("Gagal menghubungi server verifikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-4 sm:px-6 py-3.5 sm:py-5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          {storeSetting.logoUrl ? (
            <img
              src={storeSetting.logoUrl}
              alt={storeSetting.storeName}
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl object-cover border border-amber-500/40 shadow-lg bg-white shrink-0"
            />
          ) : (
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-orange-500/20 shrink-0">
              <Store className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate max-w-[170px] sm:max-w-none">
                {storeSetting.storeName}
              </h1>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                POS KIOSK
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate max-w-[180px] sm:max-w-none">
              {storeSetting.tagline || "Point of Sale & Pre-Order System"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Event Badge */}
          {activeEvent ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold">{activeEvent.name}</span>
            </div>
          ) : null}

          {/* Live Clock Display */}
          <div className="text-right shrink-0">
            <div className="text-xs sm:text-sm font-black text-amber-400 font-mono tracking-wider flex items-center justify-end gap-1">
              <Clock className="h-3 w-3 text-amber-500" />
              <span>{currentTime || "--:--:--"}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium capitalize hidden sm:block">
              {currentDate || ""}
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Form Area */}
      <main className="relative z-10 flex-1 max-w-md w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1 shadow-inner">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Masuk ke Sistem
            </h2>
            <p className="text-xs text-slate-400">
              Silakan masukkan Username dan Password untuk mengakses sistem kasir & inventaris booth
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Username / User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Contoh: febriansyah / kasir1"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Ketik password akun Anda..."
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Memeriksa Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              Sistem POS & Inventaris Booth Terintegrasi &bull; Dual-Mode Ready
            </p>
          </div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="relative z-10 w-full px-4 sm:px-6 py-3 border-t border-slate-800/60 bg-slate-950/80 text-center text-xs text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} {storeSetting.storeName} &bull; Keamanan terenkripsi PBKDF2
        </p>
      </footer>
    </div>
  );
}
