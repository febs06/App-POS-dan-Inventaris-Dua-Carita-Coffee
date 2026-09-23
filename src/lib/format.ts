export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "selesai":
      return { label: "Selesai", bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" };
    case "siap diambil":
      return { label: "Siap Diambil", bg: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800" };
    case "diproses":
      return { label: "Diproses", bg: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800" };
    case "pending":
      return { label: "Menunggu", bg: "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800" };
    case "dibatalkan":
      return { label: "Dibatalkan", bg: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800" };
    case "ongoing":
      return { label: "Sedang Berjalan", bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" };
    case "upcoming":
      return { label: "Akan Datang", bg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800" };
    default:
      return { label: status, bg: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700" };
  }
}

export function getPaymentBadge(paymentStatus: "lunas" | "dp" | "belum_bayar" | string) {
  switch (paymentStatus.toLowerCase()) {
    case "lunas":
      return { label: "Lunas", bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800" };
    case "dp":
      return { label: "Bayar DP", bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800" };
    case "belum_bayar":
    default:
      return { label: "Belum Bayar", bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-300 dark:border-rose-800" };
  }
}

/**
 * Normalisasi nama produk untuk agregasi Top Bestseller
 * Menghapus varian ukuran (250ml, 500ml, 1 Liter, Cup, Botol, dll)
 * sehingga produk dengan nama dasar sama tergabung penjualannya.
 */
export function normalizeProductName(name: string | null | undefined): string {
  if (!name) return "Produk";
  return name
    .replace(/\s*\(\s*\d+\s*(ml|l|liter|oz|gram|g|kg|pcs).*?\)/gi, "")
    .replace(/\s*-\s*\d+\s*(ml|l|liter|oz|gram|g|kg).*$/gi, "")
    .replace(/\s*\b\d+\s*(ml|l|liter|oz|gram|g|kg)\b/gi, "")
    .replace(/\s*\((cup|botol|dine in|takeaway|dingin|panas|hot|ice)\)/gi, "")
    .replace(/\s*[-–—]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

