"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, X, Check, ArrowRight } from "lucide-react";
import { formatRupiah, formatDateTime } from "@/lib/format";

interface DeleteOrderModalProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteOrderModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: DeleteOrderModalProps) {
  const [restoreStock, setRestoreStock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !order) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/orders?id=${order.id}&restoreStock=${restoreStock}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus pesanan");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menghapus pesanan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Hapus Riwayat Pesanan</h3>
              <p className="text-[11px] text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Order Details Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Nomor Transaksi</span>
              <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Waktu Order</span>
              <span className="font-medium text-slate-700">{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Tipe & Tujuan</span>
              <span className="font-semibold text-slate-800">
                {order.orderSource === "PO"
                  ? `PO - ${order.customer?.name || "Customer"}`
                  : `Direct - ${order.event?.name || "Booth"}`}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-600 font-medium">Total Nominal</span>
              <span className="text-sm font-black text-slate-900">
                {formatRupiah(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Stock Restoration Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition select-none">
            <input
              type="checkbox"
              checked={restoreStock}
              onChange={(e) => setRestoreStock(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800 block">
                Kembalikan stok produk & bahan baku otomatis
              </span>
              <span className="text-[11px] text-slate-500">
                Disarankan jika ini pesanan dummy/testing agar stok tidak terpotong permanen.
              </span>
            </div>
          </label>

          {/* Warning notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              Transaksi ini beserta rincian item dan pembayaran akan <strong>dihapus permanen</strong> dari database dan laporan keuangan.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-5 py-3.5 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition shadow-xs"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              "Menghapus..."
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Permanen
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
