"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Store,
  KeyRound,
  Shield,
  UserCheck,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Lock,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  username: string;
  role: string;
  isActive: boolean;
}

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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

  // Fetch store settings, active event, and employees
  useEffect(() => {
    const loadInitialData = async () => {
      setFetching(true);
      try {
        const [empRes, settRes, eventRes] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/settings"),
          fetch("/api/events"),
        ]);

        const emps = await empRes.json();
        if (Array.isArray(emps)) {
          const active = emps.filter((e: any) => e.isActive);
          setEmployees(active);
          if (active.length > 0) {
            setSelectedEmp(active[0]);
          }
        }

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
      } finally {
        setFetching(false);
      }
    };

    loadInitialData();
  }, []);

  // Handle Physical Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        if (pin.length < 6) {
          setError("");
          setPin((prev) => prev + e.key);
        }
      } else if (e.key === "Backspace") {
        setError("");
        setPin((prev) => prev.slice(0, -1));
      } else if (e.key === "Enter") {
        if (pin.length >= 4 && selectedEmp && !loading) {
          submitLogin(selectedEmp, pin);
        }
      } else if (e.key === "Escape") {
        setPin("");
        setError("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, selectedEmp, loading]);

  const handleKeypadPress = (val: string) => {
    setError("");
    if (val === "clear") {
      setPin("");
    } else if (val === "back") {
      setPin((prev) => prev.slice(0, -1));
    } else {
      if (pin.length < 6) {
        setPin((prev) => prev + val);
      }
    }
  };

  const submitLogin = async (emp: Employee, pinCode: string) => {
    if (!emp) {
      setError("Pilih kasir / staf terlebih dahulu");
      return;
    }
    if (!pinCode || pinCode.length < 4) {
      setError("Masukkan minimal 4 digit PIN");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/employees/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: emp.id,
          pin: pinCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "PIN Kasir salah. Silakan coba lagi.");
        setPin("");
        return;
      }

      // Save cashier info to localStorage
      localStorage.setItem("active_cashier", JSON.stringify(data.employee));
      window.dispatchEvent(new Event("cashier-updated"));

      // Direct to POS register
      router.push("/pos");
    } catch (err) {
      setError("Gagal menghubungi server verifikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-6 py-5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          {storeSetting.logoUrl ? (
            <img
              src={storeSetting.logoUrl}
              alt={storeSetting.storeName}
              className="h-11 w-11 rounded-2xl object-cover border border-amber-500/40 shadow-lg bg-white shrink-0"
            />
          ) : (
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-orange-500/20 shrink-0">
              <Store className="h-6 w-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-tight">
                {storeSetting.storeName}
              </h1>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40">
                POS KIOSK
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {storeSetting.tagline || "Point of Sale & Pre-Order System"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Active Event Badge */}
          {activeEvent ? (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold">{activeEvent.name}</span>
              <span className="text-emerald-500/80">({activeEvent.location})</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              <span>Booth Mandiri (Non-Event)</span>
            </div>
          )}

          {/* Live Clock Display */}
          <div className="text-right">
            <div className="text-sm font-black text-amber-400 font-mono tracking-wider flex items-center justify-end gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>{currentTime || "--:--:--"}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium capitalize">
              {currentDate || "Memuat waktu..."}
            </div>
          </div>
        </div>
      </header>

      {/* Main Kiosk Content Area */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Staff Card Selector */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
                <Shield className="h-3.5 w-3.5" />
                <span>Otentikasi Karyawan Booth</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Pilih Staf Bertugas
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Pilih profil Anda di bawah ini, lalu ketik PIN otorisasi untuk memulai shift kasir.
              </p>
            </div>

            {fetching ? (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
                Memuat daftar staf aktif...
              </div>
            ) : employees.length === 0 ? (
              <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800/40 text-rose-400 text-sm">
                Tidak ada staf aktif. Silakan hubungi admin untuk mendaftarkan akun kasir.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
                {employees.map((emp) => {
                  const isSelected = selectedEmp?.id === emp.id;
                  const roleBadgeClass =
                    emp.role.toUpperCase() === "OWNER"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      : emp.role.toUpperCase() === "BARISTA"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30";

                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => {
                        setSelectedEmp(emp);
                        setPin("");
                        setError("");
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50"
                          : "bg-slate-900/40 border-slate-800 hover:bg-slate-900/80 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${
                            isSelected
                              ? "bg-amber-500 text-slate-950 font-black shadow-md"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {emp.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{emp.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${roleBadgeClass}`}
                            >
                              {emp.role}
                            </span>
                            <span className="text-xs text-slate-500">@{emp.username}</span>
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="h-6 w-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Quick Demo PIN note */}
            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                PIN Bawaan: <strong className="text-slate-200">Owner (1234)</strong>,{" "}
                <strong className="text-slate-200">Kasir (0000)</strong>,{" "}
                <strong className="text-slate-200">Barista (1111)</strong>.
              </span>
            </div>
          </div>

          {/* Right Column: Interactive PIN Pad */}
          <div className="lg:col-span-7">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
              {/* Selected Profile Indicator */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">
                      Otorisasi Bertugas:
                    </span>
                    <span className="text-base font-black text-white">
                      {selectedEmp ? selectedEmp.name : "Pilih Karyawan"}
                    </span>
                  </div>
                </div>

                {selectedEmp && (
                  <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                    {selectedEmp.role}
                  </span>
                )}
              </div>

              {/* PIN Visual Dots */}
              <div className="my-6">
                <div className="text-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Masukkan PIN Kasir (4 - 6 Digit)
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 py-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                    const isFilled = pin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`h-4 w-4 rounded-full border transition-all duration-150 ${
                          isFilled
                            ? "bg-amber-500 border-amber-400 scale-125 shadow-md shadow-amber-500/40"
                            : "bg-slate-800 border-slate-700"
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              {/* Keypad Buttons (3x4 grid) */}
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="h-14 sm:h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-750 active:bg-amber-500 active:text-slate-950 border border-slate-700/60 text-white font-black text-xl sm:text-2xl transition-all flex items-center justify-center cursor-pointer shadow-sm hover:scale-[1.02]"
                  >
                    {num}
                  </button>
                ))}

                {/* Clear / Reset Button */}
                <button
                  type="button"
                  onClick={() => handleKeypadPress("clear")}
                  className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-700/40 text-slate-400 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer"
                >
                  Reset
                </button>

                {/* 0 Button */}
                <button
                  type="button"
                  onClick={() => handleKeypadPress("0")}
                  className="h-14 sm:h-16 rounded-2xl bg-slate-800/80 hover:bg-slate-750 active:bg-amber-500 active:text-slate-950 border border-slate-700/60 text-white font-black text-xl sm:text-2xl transition-all flex items-center justify-center cursor-pointer shadow-sm hover:scale-[1.02]"
                >
                  0
                </button>

                {/* Backspace Button */}
                <button
                  type="button"
                  onClick={() => handleKeypadPress("back")}
                  className="h-14 sm:h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-700 border border-slate-700/40 text-slate-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer"
                >
                  Hapus
                </button>
              </div>

              {/* Submit Action */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="text-xs text-slate-400 hover:text-slate-200 transition py-2 px-3 rounded-lg hover:bg-slate-800/50 cursor-pointer"
                >
                  Bypass ke Dashboard Admin
                </button>

                <button
                  type="button"
                  onClick={() => selectedEmp && submitLogin(selectedEmp, pin)}
                  disabled={loading || pin.length < 4 || !selectedEmp}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <span>Mulai Shift Kasir</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer System Info */}
      <footer className="relative z-10 w-full px-6 py-4 border-t border-slate-800/60 bg-slate-900/40 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Sistem Kiosk POS Booth Online & Terhubung</span>
        </div>
        <div>
          <span>{storeSetting.storeName} &copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
