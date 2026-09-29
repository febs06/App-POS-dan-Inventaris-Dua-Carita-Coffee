"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Send,
  Copy,
  Check,
  AlertTriangle,
  Building2,
  Package,
  MessageSquare,
  Sparkles,
  Layers,
  ChevronRight,
} from "lucide-react";
import { formatRupiah, formatDateTime } from "@/lib/format";

interface RawMaterialItem {
  id: string;
  name: string;
  category?: string;
  stock: number;
  unit: string;
  minStock: number;
  costPerUnit: number;
  supplier?: string;
  buyUnit?: string;
  packSize?: number;
  lastPackPrice?: number;
}

interface SupplierItem {
  id: string;
  name: string;
  phone?: string;
  type?: string;
}

interface LowStockWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials: RawMaterialItem[];
}

export default function LowStockWhatsAppModal({
  isOpen,
  onClose,
  rawMaterials,
}: LowStockWhatsAppModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [customPhone, setCustomPhone] = useState<string>("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [storeInfo, setStoreInfo] = useState<{ storeName: string; phoneNumber?: string }>({
    storeName: "Dua Carita Coffee",
    phoneNumber: "",
  });
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>("");

  // Load store settings & suppliers on open
  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.storeName) {
            setStoreInfo({
              storeName: data.storeName,
              phoneNumber: data.phoneNumber || "",
            });
          }
        })
        .catch(() => {});

      fetch("/api/suppliers")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSuppliers(data);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // All critical materials (stock <= minStock)
  const criticalMaterials = useMemo(() => {
    return rawMaterials.filter((m) => m.stock <= m.minStock);
  }, [rawMaterials]);

  // Reset selected item IDs when modal opens or critical list changes
  useEffect(() => {
    if (isOpen) {
      setSelectedItemIds(criticalMaterials.map((m) => m.id));
      setSelectedSupplier("all");
      setAdditionalNotes("");
      setCustomPhone("");
    }
  }, [isOpen, criticalMaterials]);

  // Filtered by supplier tab if selected
  const displayedMaterials = useMemo(() => {
    if (selectedSupplier === "all") return criticalMaterials;
    return criticalMaterials.filter(
      (m) => (m.supplier?.trim() || "Tanpa Supplier") === selectedSupplier
    );
  }, [criticalMaterials, selectedSupplier]);

  // List of distinct suppliers from critical items
  const distinctSuppliers = useMemo(() => {
    const set = new Set<string>();
    criticalMaterials.forEach((m) => {
      set.add(m.supplier?.trim() || "Tanpa Supplier");
    });
    return Array.from(set);
  }, [criticalMaterials]);

  // Auto-fill phone when selecting specific supplier
  useEffect(() => {
    if (selectedSupplier !== "all" && selectedSupplier !== "Tanpa Supplier") {
      const match = suppliers.find(
        (s) => s.name.toLowerCase() === selectedSupplier.toLowerCase()
      );
      if (match?.phone) {
        setCustomPhone(match.phone);
        return;
      }
    }
    // If "all" or no match, default to store phone if available or empty
    if (selectedSupplier === "all" && storeInfo.phoneNumber) {
      setCustomPhone(storeInfo.phoneNumber);
    } else {
      setCustomPhone("");
    }
  }, [selectedSupplier, suppliers, storeInfo]);

  // Toggle item selection
  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const currentDisplayedIds = displayedMaterials.map((m) => m.id);
    const allSelected = currentDisplayedIds.every((id) => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !currentDisplayedIds.includes(id)));
    } else {
      setSelectedItemIds((prev) => Array.from(new Set([...prev, ...currentDisplayedIds])));
    }
  };

  // Generate WhatsApp message
  const generatedMessage = useMemo(() => {
    const itemsToSend = displayedMaterials.filter((m) => selectedItemIds.includes(m.id));
    const now = new Date();
    const dateFormatted = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(now);

    const isSupplierSpecific = selectedSupplier !== "all" && selectedSupplier !== "Tanpa Supplier";

    let text = `🚨 *PERINGATAN BAHAN BAKU MENIPIS* 🚨\n`;
    text += `*${storeInfo.storeName || "Dua Carita Coffee"}*\n`;
    text += `📅 _${dateFormatted} WIB_\n\n`;

    if (isSupplierSpecific) {
      text += `Halo *${selectedSupplier}*, kami ingin mengajukan restock/pemesanan untuk bahan berikut karena stok di booth sudah mencapai batas minimum:\n\n`;
    } else {
      text += `Halo Tim Operasional / Barista, berikut rekap bahan baku yang stoknya kritis (sudah mencapai / di bawah batas aman) dan butuh segera di-restock:\n\n`;
    }

    if (itemsToSend.length === 0) {
      text += `_(Tidak ada bahan yang dipilih)_\n\n`;
    } else {
      itemsToSend.forEach((item, idx) => {
        const deficit = Math.max(0, item.minStock - item.stock);
        text += `${idx + 1}. *${item.name}*\n`;
        text += `   • Sisa Stok: *${item.stock} ${item.unit}* (Batas Min: ${item.minStock} ${item.unit})\n`;
        if (deficit > 0) {
          text += `   • ⚠️ Butuh Restock: *min. ${deficit} ${item.unit}*\n`;
        }
        if (item.packSize && item.packSize > 1) {
          text += `   • Kemasan Beli: 1 ${item.buyUnit || "pack"} = ${item.packSize} ${item.unit}`;
          if (item.lastPackPrice) {
            text += ` (Est. ${formatRupiah(item.lastPackPrice)})`;
          }
          text += `\n`;
        }
        if (!isSupplierSpecific && item.supplier) {
          text += `   • Vendor/Supplier: ${item.supplier}\n`;
        }
        text += `\n`;
      });
    }

    if (additionalNotes.trim()) {
      text += `📝 *Catatan Tambahan:*\n${additionalNotes.trim()}\n\n`;
    }

    text += `----------------------------------------\n`;
    text += `Total Bahan Kritis: *${itemsToSend.length} item*\n`;
    text += `Mohon segera diproses agar kelancaran booth event tetap terjaga. Terima kasih! 🙏☕\n\n`;
    text += `_Dikirim otomatis dari Sistem Kasir & Inventaris ${storeInfo.storeName}_`;

    return text;
  }, [displayedMaterials, selectedItemIds, selectedSupplier, storeInfo, additionalNotes]);

  // Clean phone and build link
  const cleanPhone = customPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone;
  const whatsappUrl = formattedPhone
    ? `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(generatedMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedMessage)}`;

  // Copy handler
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-emerald-300">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                <span>Format WA Bahan Baku Menipis</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                  {criticalMaterials.length} Kritis
                </span>
              </h2>
              <p className="text-xs text-white/80">
                Kirim rekap restock otomatis via WhatsApp ke Owner, Tim, atau Vendor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          {criticalMaterials.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50/60 rounded-2xl border border-emerald-200 text-emerald-900">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 font-bold text-xl">
                ✓
              </div>
              <h3 className="font-bold text-sm">Semua Stok Bahan Baku Aman!</h3>
              <p className="text-xs text-emerald-700 mt-1">
                Tidak ada bahan baku yang berada di bawah batas minimum stok saat ini.
              </p>
            </div>
          ) : (
            <>
              {/* Supplier Filter Tabs */}
              {distinctSuppliers.length > 1 && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Filter Pengiriman Berdasarkan:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedSupplier("all")}
                      className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer ${
                        selectedSupplier === "all"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Semua Bahan ({criticalMaterials.length})
                    </button>
                    {distinctSuppliers.map((sup) => {
                      const count = criticalMaterials.filter(
                        (m) => (m.supplier?.trim() || "Tanpa Supplier") === sup
                      ).length;
                      return (
                        <button
                          key={sup}
                          type="button"
                          onClick={() => setSelectedSupplier(sup)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition text-xs cursor-pointer flex items-center gap-1.5 ${
                            selectedSupplier === sup
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          <Building2 className="h-3 w-3" />
                          <span>{sup}</span>
                          <span className="text-[10px] opacity-80">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Items Selection Checklist */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Pilih Bahan Baku ({displayedMaterials.filter((m) => selectedItemIds.includes(m.id)).length} dari {displayedMaterials.length} item)
                  </span>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] cursor-pointer"
                  >
                    {displayedMaterials.every((m) => selectedItemIds.includes(m.id))
                      ? "Batal Pilih Semua"
                      : "Pilih Semua"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {displayedMaterials.map((m) => {
                    const isChecked = selectedItemIds.includes(m.id);
                    const deficit = Math.max(0, m.minStock - m.stock);
                    return (
                      <label
                        key={m.id}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition select-none ${
                          isChecked
                            ? "bg-white border-emerald-400 shadow-2xs"
                            : "bg-slate-100/70 border-slate-200 text-slate-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(m.id)}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate text-slate-900">{m.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Sisa: <strong className="text-rose-600">{m.stock} {m.unit}</strong> / Min: {m.minStock} {m.unit}
                            {deficit > 0 && <span className="ml-1 text-amber-700 font-semibold">(Kurang {deficit})</span>}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Destination Phone & Extra Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nomor WhatsApp Tujuan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="Contoh: 0821xxx (Kosongkan jika pilih kontak di WA)"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                    <span>💡 Kosongkan untuk bebas memilih kontak/grup langsung di aplikasi WA</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Cth: Tolong kirim sebelum jam 3 sore untuk persiapan bazaar"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Message Live Preview (WhatsApp Bubble) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Pratinjau Pesan WhatsApp:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Salin Teks</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#EFEAE2] dark:bg-slate-900 border border-slate-300/80 font-mono text-[11px] text-slate-800 dark:text-slate-100 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                  {generatedMessage}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            Format pesan kompatibel dengan WhatsApp Web, Android, dan iOS
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              disabled={criticalMaterials.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Salin Format</span>
                </>
              )}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-md transition cursor-pointer ${
                criticalMaterials.length === 0
                  ? "bg-slate-300 pointer-events-none"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
              }`}
            >
              <Send className="h-4 w-4" />
              <span>Buka &amp; Kirim WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
