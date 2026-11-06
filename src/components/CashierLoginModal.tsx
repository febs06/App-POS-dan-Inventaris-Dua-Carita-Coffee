"use client";

import { useState, useEffect } from "react";
import { UserCheck, Shield, KeyRound, AlertCircle, X, Check, Lock, Eye, EyeOff } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  username: string;
  role: string;
  isActive: boolean;
}

interface CashierLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (employee: Employee) => void;
}

export default function CashierLoginModal({ isOpen, onClose, onSuccess }: CashierLoginModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roleTab, setRoleTab] = useState<"KASIR" | "OWNER">("KASIR");
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      setPin("");
      setError("");
    }
  }, [isOpen]);

  const loadEmployees = async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (Array.isArray(data)) {
        const active = data.filter((e) => e.isActive);
        setEmployees(active);

        const cashiers = active.filter((e) => e.role !== "OWNER");
        const owners = active.filter((e) => e.role === "OWNER");

        // Jika ada kasir, default tab kasir; jika belum ada kasir, buka tab owner
        if (cashiers.length > 0) {
          setRoleTab("KASIR");
          setSelectedEmp(cashiers[0]);
        } else if (owners.length > 0) {
          setRoleTab("OWNER");
          setSelectedEmp(owners[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSelectTab = (tab: "KASIR" | "OWNER") => {
    setRoleTab(tab);
    setPin("");
    setError("");
    const filtered = employees.filter((e) => (tab === "OWNER" ? e.role === "OWNER" : e.role !== "OWNER"));
    if (filtered.length > 0) {
      setSelectedEmp(filtered[0]);
    } else {
      setSelectedEmp(null);
    }
  };

  const handleKeypadPress = (val: string) => {
    setError("");
    if (val === "clear") {
      setPin("");
    } else if (val === "back") {
      setPin((prev) => prev.slice(0, -1));
    } else {
      if (pin.length < 32) {
        setPin((prev) => prev + val);
      }
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedEmp) {
      setError("Pilih karyawan terlebih dahulu");
      return;
    }
    if (!pin) {
      setError("Masukkan PIN kasir");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/employees/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEmp.id,
          pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal verifikasi PIN");
        setPin("");
        return;
      }

      // Save to sessionStorage and localStorage
      sessionStorage.setItem("active_cashier", JSON.stringify(data.employee));
      localStorage.setItem("active_cashier", JSON.stringify(data.employee));
      window.dispatchEvent(new Event("cashier-updated"));

      if (onSuccess) onSuccess(data.employee);
      onClose();
    } catch (err: any) {
      setError("Terjadi kesalahan koneksi server");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Masuk Shift / Ganti Kasir</h2>
              <p className="text-xs text-slate-500">Pilih staf dan masukkan PIN untuk bertugas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Role Segmented Tabs (Kasir vs Owner) */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSelectTab("KASIR")}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                roleTab === "KASIR"
                  ? "bg-amber-500 text-slate-950 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Staf Kasir ({employees.filter((e) => e.role !== "OWNER").length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab("OWNER")}
              className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                roleTab === "OWNER"
                  ? "bg-slate-900 text-white shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-amber-400" />
              <span>Owner / Admin ({employees.filter((e) => e.role === "OWNER").length})</span>
            </button>
          </div>

          {/* Info Banner per Tab */}
          {roleTab === "OWNER" ? (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-[11px] flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Memerlukan PIN Owner untuk otorisasi penuh akses keuangan, stok, dan pengaturan toko.</span>
            </div>
          ) : (
            <div className="p-2 rounded-xl bg-slate-100 text-slate-600 text-[11px] flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>Pilih staf kasir yang akan bertugas di shift booth saat ini.</span>
            </div>
          )}

          {/* Pilih Karyawan */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">
              {roleTab === "OWNER" ? "Pilih Akun Owner / Admin" : "Pilih Nama Staf Kasir"}
            </label>
            {fetching ? (
              <div className="text-xs text-slate-400 py-3 text-center">Memuat daftar staf...</div>
            ) : employees.filter((e) => (roleTab === "OWNER" ? e.role === "OWNER" : e.role !== "OWNER")).length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                {roleTab === "OWNER" ? "Tidak ada akun owner terdaftar" : "Belum ada akun kasir terdaftar"}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {employees
                  .filter((e) => (roleTab === "OWNER" ? e.role === "OWNER" : e.role !== "OWNER"))
                  .map((emp) => {
                    const isSelected = selectedEmp?.id === emp.id;
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setSelectedEmp(emp);
                          setPin("");
                          setError("");
                        }}
                        className={`p-2.5 rounded-xl text-left border transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? roleTab === "OWNER"
                              ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                              : "bg-amber-50 border-amber-500 text-amber-950 shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                        }`}
                      >
                        <div className="font-bold text-xs truncate flex items-center justify-between">
                          <span>{emp.name}</span>
                          {isSelected && (
                            <Check
                              className={`h-3.5 w-3.5 ${
                                roleTab === "OWNER" ? "text-amber-400" : "text-amber-600"
                              }`}
                            />
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-semibold uppercase mt-1 ${
                            isSelected && roleTab === "OWNER" ? "text-amber-300" : "text-slate-400"
                          }`}
                        >
                          {emp.role}
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Password Input & Eye Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                <span>Password / PIN Akses</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {pin.length > 0 ? `${pin.length} karakter` : "Min. 6-8 Karakter"}
              </span>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  setError("");
                  setPin(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && pin.length >= 4 && selectedEmp && !loading) {
                    handleLogin();
                  }
                }}
                placeholder="Ketik password atau gunakan tombol..."
                autoFocus
                className="w-full text-center text-base sm:text-lg font-mono tracking-wider py-2.5 px-9 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? "Sembunyikan" : "Tampilkan"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-semibold bg-rose-50 p-2 rounded-xl border border-rose-200 animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Keypad Angka */}
          <div className="grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-base transition flex items-center justify-center cursor-pointer shadow-2xs"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleKeypadPress("clear")}
              className="h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center justify-center cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress("0")}
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-black text-base transition flex items-center justify-center cursor-pointer shadow-2xs"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress("back")}
              className="h-11 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition flex items-center justify-center cursor-pointer"
            >
              Hapus
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleLogin()}
              disabled={loading || pin.length < 4}
              className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-slate-950 disabled:text-slate-400 transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? "Memverifikasi..." : "Mulai Shift"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
