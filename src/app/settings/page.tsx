"use client";

import { useEffect, useState, useRef } from "react";
import {
  Store,
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Building2,
  Phone,
  MapPin,
  FileText,
  Lock,
  Edit2,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "employees">("profile");

  // Store Profile State
  const [storeName, setStoreName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const [profileErrorMsg, setProfileErrorMsg] = useState("");

  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Employees State
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  // Employee Form
  const [empName, setEmpName] = useState("");
  const [empUsername, setEmpUsername] = useState("");
  const [empPin, setEmpPin] = useState("");
  const [empRole, setEmpRole] = useState("KASIR");
  const [empActive, setEmpActive] = useState(true);
  const [submittingEmp, setSubmittingEmp] = useState(false);
  const [empError, setEmpError] = useState("");

  useEffect(() => {
    loadSettings();
    loadEmployees();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data) {
        setStoreName(data.storeName || "Dua Carita Coffee");
        setTagline(data.tagline || "");
        setLogoUrl(data.logoUrl || "");
        setPhoneNumber(data.phoneNumber || "");
        setAddress(data.address || "");
        setReceiptFooter(data.receiptFooter || "");
      }
    } catch (err) {
      console.error("Gagal memuat pengaturan toko:", err);
    }
  };

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      if (Array.isArray(data)) setEmployees(data);
    } catch (err) {
      console.error("Gagal memuat karyawan:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileErrorMsg("File harus berupa gambar (PNG, JPG, JPEG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileErrorMsg("Ukuran file gambar maksimal 5MB");
      return;
    }

    setUploadingLogo(true);
    setProfileErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileErrorMsg(data.error || "Gagal mengunggah logo");
        return;
      }

      setLogoUrl(data.url);
      setProfileSuccessMsg("Foto logo berhasil diunggah! Jangan lupa klik Simpan Pengaturan.");
      setTimeout(() => setProfileSuccessMsg(""), 4000);
    } catch (err) {
      setProfileErrorMsg("Terjadi kesalahan saat mengunggah file");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg("");
    setProfileErrorMsg("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          tagline,
          logoUrl,
          phoneNumber,
          address,
          receiptFooter,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProfileErrorMsg(data.error || "Gagal menyimpan pengaturan");
        return;
      }

      setProfileSuccessMsg("Pengaturan identitas toko & logo berhasil disimpan!");
      window.dispatchEvent(new Event("settings-updated"));
      setTimeout(() => setProfileSuccessMsg(""), 4000);
    } catch (err: any) {
      setProfileErrorMsg("Terjadi kesalahan saat menyimpan pengaturan");
    } finally {
      setSavingProfile(false);
    }
  };

  const openAddEmployee = () => {
    setEditingEmployee(null);
    setEmpName("");
    setEmpUsername("");
    setEmpPin("");
    setEmpRole("KASIR");
    setEmpActive(true);
    setEmpError("");
    setIsEmployeeModalOpen(true);
  };

  const openEditEmployee = (emp: any) => {
    setEditingEmployee(emp);
    setEmpName(emp.name);
    setEmpUsername(emp.username);
    setEmpPin(""); // Reset PIN to blank unless user wants to change
    setEmpRole(emp.role);
    setEmpActive(emp.isActive);
    setEmpError("");
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEmp(true);
    setEmpError("");

    try {
      let res;
      if (editingEmployee) {
        res = await fetch("/api/employees", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingEmployee.id,
            name: empName,
            username: empUsername,
            pin: empPin || undefined,
            role: empRole,
            isActive: empActive,
          }),
        });
      } else {
        if (!empPin || empPin.length < 4) {
          setEmpError("PIN staf minimal 4 digit angka");
          setSubmittingEmp(false);
          return;
        }
        res = await fetch("/api/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: empName,
            username: empUsername,
            pin: empPin,
            role: empRole,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setEmpError(data.error || "Gagal menyimpan data karyawan");
        return;
      }

      setIsEmployeeModalOpen(false);
      loadEmployees();
    } catch (err) {
      setEmpError("Gagal terhubung ke server");
    } finally {
      setSubmittingEmp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan & Identitas Toko</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Ubah logo brand bisnis, nama usaha, kontak booth, serta kelola akun kasir dan staf shift
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === "profile"
              ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Profil Brand & Logo Toko</span>
        </button>

        <button
          onClick={() => setActiveTab("employees")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === "employees"
              ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Manajemen Staf & Kasir</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
            {employees.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Profile & Logo */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Notification Banners */}
          {profileSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card Logo Upload */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col items-center text-center space-y-4">
              <h2 className="text-sm font-bold text-slate-900 w-full text-left">Logo Usaha / Booth</h2>
              
              <div className="relative group">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo Toko"
                    className="h-32 w-32 rounded-2xl object-cover border-2 border-amber-500/30 shadow-md bg-white"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex flex-col items-center justify-center shadow-md">
                    <Store className="h-12 w-12" />
                    <span className="text-[10px] font-bold mt-1 text-white/80">Belum ada logo</span>
                  </div>
                )}
              </div>

              <div className="w-full space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{uploadingLogo ? "Mengunggah..." : logoUrl ? "Ganti File Logo" : "Unggah Logo Anda"}</span>
                </button>

                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="w-full py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Logo (Kembali ke Ikon Default)</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                Format didukung: PNG, JPG, JPEG, WEBP. Maks 5MB. Logo akan otomatis tampil pada Navbar, Sidebar, Struk Kasir, dan Laporan.
              </p>
            </div>

            {/* Card Information Fields */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Informasi & Identitas Bisnis</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Usaha / Booth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Contoh: Dua Carita Coffee"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tagline / Subtitle
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Contoh: Bazaar & Pre-Order System"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nomor WhatsApp / CS
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="08123456789"
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Lokasi / Alamat Markas
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Jakarta, Indonesia"
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pesan Kaki Struk (Receipt Footer)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                  <textarea
                    rows={2}
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    placeholder="Terima kasih atas pesanan Anda! Follow kami di Instagram..."
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:bg-slate-300"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingProfile ? "Menyimpan..." : "Simpan Pengaturan"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Employees */}
      {activeTab === "employees" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Daftar Akun Staf & Hak Akses</h2>
              <p className="text-xs text-slate-500">
                Staf dapat masuk ke sistem POS kasir menggunakan PIN 4-6 digit
              </p>
            </div>

            <button
              type="button"
              onClick={openAddEmployee}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Tambah Staf Baru</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Nama Staf</th>
                  <th className="py-3.5 px-4">Username</th>
                  <th className="py-3.5 px-4">Role / Jabatan</th>
                  <th className="py-3.5 px-4">Otorisasi PIN</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingEmployees ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Memuat daftar staf...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Belum ada staf terdaftar.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {emp.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        @{emp.username}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            emp.role === "OWNER"
                              ? "bg-amber-100 text-amber-800"
                              : emp.role === "MANAGER"
                              ? "bg-purple-100 text-purple-800"
                              : emp.role === "BARISTA"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono text-xs">•••••• (Tersedia)</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            emp.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {emp.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditEmployee(emp)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition cursor-pointer"
                        >
                          Edit / Ganti PIN
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Karyawan */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-base font-black text-slate-900">
                {editingEmployee ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              {empError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{empError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="Contoh: Rian Pratama"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={empUsername}
                  onChange={(e) => setEmpUsername(e.target.value)}
                  placeholder="rian_pos"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Role / Posisi
                </label>
                <select
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                >
                  <option value="KASIR">Kasir Booth</option>
                  <option value="BARISTA">Barista / Kitchen</option>
                  <option value="MANAGER">Manager Shift</option>
                  <option value="OWNER">Owner / Administrator</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {editingEmployee ? "Ganti PIN (Kosongkan bila tidak diubah)" : "PIN Kasir (4-6 Digit Angka)"}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={empPin}
                  onChange={(e) => setEmpPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Contoh: 1234"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-mono text-slate-900 tracking-widest"
                />
              </div>

              {editingEmployee && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="active-toggle"
                    checked={empActive}
                    onChange={(e) => setEmpActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="active-toggle" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Akun Karyawan Aktif
                  </label>
                </div>
              )}

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition shadow-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEmp}
                  className="flex-1 py-2.5 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition shadow-sm cursor-pointer disabled:bg-slate-300"
                >
                  {submittingEmp ? "Menyimpan..." : "Simpan Karyawan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
