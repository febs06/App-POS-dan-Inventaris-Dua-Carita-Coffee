"use client";

import { useEffect, useState, useRef } from "react";
import { formatRupiah, formatDateTime, formatDate } from "@/lib/format";
import { Printer, MessageCircle, X, CheckCircle2, Store } from "lucide-react";

interface ReceiptModalProps {
  order: any | null;
  onClose: () => void;
}

export default function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [storeSetting, setStoreSetting] = useState<{
    storeName: string;
    tagline: string | null;
    logoUrl: string | null;
    phoneNumber: string | null;
    address: string | null;
    receiptFooter: string | null;
  }>({
    storeName: "Dua Carita Coffee",
    tagline: "Bazaar & Pre-Order System",
    logoUrl: null,
    phoneNumber: null,
    address: null,
    receiptFooter: "Terima kasih atas kunjungan Anda!",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.storeName) setStoreSetting(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.classList.add("modal-receipt-open");
    return () => {
      document.body.classList.remove("modal-receipt-open");
    };
  }, []);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalPaid = order.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
  const remaining = Math.max(0, order.totalAmount - totalPaid);
  const isPO = order.orderSource === "PO";
  const customerDisplayName = order.customerName || order.customer?.name || "Pelanggan Umum";
  const isPaidOff = totalPaid >= order.totalAmount && order.totalAmount > 0;

  // Format status label
  const getStatusLabel = (st: string) => {
    switch (st?.toLowerCase()) {
      case "selesai":
        return "SELESAI";
      case "diproses":
        return "SEDANG DIPROSES";
      case "siap diambil":
        return "SIAP DIAMBIL";
      case "dibatalkan":
        return "DIBATALKAN (VOID)";
      case "pending":
        return "MENUNGGU (PENDING)";
      default:
        return st ? st.toUpperCase() : "-";
    }
  };

  // Generate WhatsApp message
  const handleShareWhatsApp = () => {
    const cleanPhone = order.customer?.phoneNumber?.replace(/[^0-9]/g, "");

    const itemsText = order.items
      ?.map(
        (it: any) =>
          `• ${it.product?.name || "Item"} x${it.qty} = ${formatRupiah(it.price * it.qty)}${
            it.notes ? ` (${it.notes})` : ""
          }`
      )
      .join("\n");

    const message = `*INVOICE PESANAN - ${storeSetting.storeName || "Dua Carita Coffee"}* 🧾
----------------------------------------
No. Order : ${order.orderNumber}
Waktu     : ${formatDateTime(order.createdAt)}
Kasir     : ${order.cashierName || "Kasir Booth"}
Tipe      : ${isPO ? "Pre-Order (PO)" : "Direct POS"}
Pelanggan : ${customerDisplayName}
Status    : ${getStatusLabel(order.status)}
${order.event ? `Event     : ${order.event.name}\n` : ""}${
      order.customer?.phoneNumber ? `No. WA    : ${order.customer.phoneNumber}\n` : ""
    }${order.pickupDate ? `Tgl Ambil : ${formatDate(order.pickupDate)}\n` : ""}${
      order.pickupMethod ? `Metode    : ${order.pickupMethod}\n` : ""
    }
*Rincian Pesanan:*
${itemsText}
----------------------------------------
Subtotal       : ${formatRupiah(order.subtotal)}
Diskon         : ${order.discountAmount > 0 ? `-${formatRupiah(order.discountAmount)}` : "Rp 0"}
*Total Tagihan  : ${formatRupiah(order.totalAmount)}*
Total Terbayar : ${formatRupiah(totalPaid)}
${
  remaining > 0
    ? `*Sisa Tagihan   : ${formatRupiah(remaining)}*`
    : `Status Bayar   : LUNAS ✅`
}${
  order.changeAmount && order.changeAmount > 0
    ? `\nKembalian      : ${formatRupiah(order.changeAmount)}`
    : ""
}
----------------------------------------
${storeSetting.receiptFooter || "Terima kasih telah memesan di booth kami! 🙏✨"}`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:static print:p-0 print:bg-transparent print:block">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:w-auto print:max-w-none print:block print:bg-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              {isPO ? "Invoice Pre-Order (PO)" : "Struk Kasir Booth (Direct)"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Receipt Content to Print (Styled for 80mm Thermal) */}
        <div
          className="p-6 overflow-y-auto font-mono text-xs text-slate-900 bg-white"
          id="printable-receipt"
          ref={receiptRef}
          style={{ width: "100%", maxWidth: "80mm", margin: "0 auto" }}
        >
          {/* Header Brand */}
          <div className="text-center pb-3 border-b border-dashed border-slate-400">
            {storeSetting.logoUrl ? (
              <img
                src={storeSetting.logoUrl}
                alt={storeSetting.storeName}
                className="h-10 w-10 mx-auto rounded-lg object-contain mb-1.5"
              />
            ) : null}
            <div className="flex justify-center items-center gap-1 font-sans font-black text-base text-slate-900 mb-0.5">
              {!storeSetting.logoUrl && <Store className="h-4 w-4 text-amber-600 inline" />}
              <span>{storeSetting.storeName || "Dua Carita Coffee"}</span>
            </div>
            <p className="text-[11px] text-slate-600 font-sans">
              {storeSetting.tagline || "Bazaar & Pre-Order System"}
            </p>
            {storeSetting.address && (
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                {storeSetting.address}
              </p>
            )}
            {storeSetting.phoneNumber && (
              <p className="text-[10px] text-slate-500 font-sans">
                WA: {storeSetting.phoneNumber}
              </p>
            )}
            {order.event && (
              <p className="text-[11px] font-bold text-slate-800 font-sans mt-1">
                📍 {order.event.name}
              </p>
            )}
          </div>

          {/* Meta Info */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">No. Order:</span>
              <span className="font-bold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tipe:</span>
              <span className="font-semibold">{isPO ? "Pre-Order (PO)" : "Direct POS"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waktu:</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kasir:</span>
              <span className="font-semibold">{order.cashierName || "Kasir Booth"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pelanggan:</span>
              <span className="font-bold text-slate-900">
                {customerDisplayName}
                {order.customer?.phoneNumber ? ` (${order.customer.phoneNumber})` : ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status Order:</span>
              <span className="font-bold">{getStatusLabel(order.status)}</span>
            </div>
            {order.pickupDate && (
              <div className="flex justify-between">
                <span className="text-slate-500">Tgl Ambil:</span>
                <span className="font-bold">{formatDate(order.pickupDate)}</span>
              </div>
            )}
            {order.pickupMethod && (
              <div className="flex justify-between">
                <span className="text-slate-500">Metode:</span>
                <span className="capitalize">{order.pickupMethod}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="py-2.5 border-b border-dashed border-slate-400 space-y-2">
            {order.items?.map((it: any, idx: number) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between">
                  <span className="font-bold">{it.product?.name || "Item"}</span>
                  <span className="font-semibold">{formatRupiah(it.price * it.qty)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>
                    {it.qty} x {formatRupiah(it.price)}
                  </span>
                  {it.notes && <span className="italic">({it.notes})</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-2.5 pb-2 space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatRupiah(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between font-semibold">
                <span>Diskon {order.voucher ? `(${order.voucher.code})` : ""}</span>
                <span>-{formatRupiah(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-950 pt-1 border-t border-slate-300">
              <span>TOTAL</span>
              <span>{formatRupiah(order.totalAmount)}</span>
            </div>
          </div>

          {/* Payments & Change */}
          <div className="py-2 border-t border-dashed border-slate-400 space-y-1">
            {order.payments?.map((p: any, idx: number) => (
              <div key={idx} className="flex justify-between text-slate-600">
                <span className="capitalize">
                  {p.method} {p.isDownPayment ? "(DP)" : ""}
                </span>
                <span>{formatRupiah(p.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-slate-900 pt-0.5">
              <span>Total Bayar:</span>
              <span>{formatRupiah(totalPaid)}</span>
            </div>

            {/* Cash Given & Kembalian */}
            {order.cashGiven !== undefined && order.cashGiven > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Uang Diterima:</span>
                <span>{formatRupiah(order.cashGiven)}</span>
              </div>
            )}
            {order.changeAmount !== undefined && order.changeAmount > 0 && (
              <div className="flex justify-between font-bold text-emerald-800">
                <span>Kembalian:</span>
                <span>{formatRupiah(order.changeAmount)}</span>
              </div>
            )}

            {remaining > 0 ? (
              <div className="flex justify-between font-bold text-amber-800 bg-amber-50 p-1 rounded mt-1">
                <span>Sisa Tagihan:</span>
                <span>{formatRupiah(remaining)}</span>
              </div>
            ) : isPaidOff ? (
              <div className="text-center font-bold text-emerald-800 bg-emerald-50 py-1 rounded mt-1">
                *** LUNAS ***
              </div>
            ) : null}
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 text-[10px] text-slate-600 font-sans leading-relaxed border-t border-dashed border-slate-400 mt-2">
            {storeSetting.receiptFooter || "Terima kasih atas kunjungan Anda!"}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-2 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition shadow-xs cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Cetak Struk (80mm)
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition shadow-xs cursor-pointer"
          >
            <MessageCircle className="h-4 w-4" />
            Kirim WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
