"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Percent,
  Calendar,
  BarChart3,
  PieChart as PieIcon,
  Award,
  Layers,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState("30");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [range, selectedYear]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}&year=${selectedYear}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const summary = data?.summary || {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalDiscount: 0,
    grossProfit: 0,
  };

  const monthlySummary = data?.monthlySummary || {
    selectedYear: Number(selectedYear),
    annualTotalRevenue: 0,
    annualTotalOrders: 0,
    averageMonthlyRevenue: 0,
    bestMonthName: "-",
    bestMonthRevenue: 0,
  };

  const monthlyRevenue = data?.monthlyRevenue || [];

  const COLORS = ["#f59e0b", "#8b5cf6", "#10b981", "#0ea5e9", "#ec4899", "#6366f1"];

  return (
    <div className="space-y-6">
      {/* Header & Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Visual Analytics & Omzet</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis data tren omzet harian & bulanan, perbandingan event bazaar, dan performa produk
          </p>
        </div>

        {activeTab === "daily" ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Rentang Waktu:</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="text-xs font-bold bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="7">7 Hari Terakhir</option>
              <option value="14">14 Hari Terakhir</option>
              <option value="30">30 Hari Terakhir</option>
              <option value="90">3 Bulan Terakhir</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Pilih Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-xs font-bold bg-white text-slate-900 border border-slate-300 rounded-xl px-3 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="2026">Tahun 2026 (Aktif)</option>
              <option value="2025">Tahun 2025</option>
              <option value="2024">Tahun 2024</option>
            </select>
          </div>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("daily")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === "daily"
              ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Performa Harian & Produk</span>
        </button>

        <button
          onClick={() => setActiveTab("monthly")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === "monthly"
              ? "border-amber-500 text-amber-600 bg-amber-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CalendarDays className="h-4 w-4" />
          <span>Rekapitulasi Omzet Bulanan (Tahun {selectedYear})</span>
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          Memuat visual analytics & omzet...
        </div>
      ) : activeTab === "daily" ? (
        <>
          {/* 4 Stat Cards Harian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Omzet
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {formatRupiah(summary.totalRevenue)}
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Laba Bersih: {formatRupiah(summary.grossProfit)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Transaksi
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {summary.totalOrders} <span className="text-sm font-medium text-slate-500">order</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">PO dan Kasir Direct</div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Rata-rata Order
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {formatRupiah(summary.avgOrderValue)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Average ticket per transaksi</div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Percent className="h-6 w-6" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Total Diskon Promo
                </span>
                <div className="text-2xl font-black text-rose-600 mt-1">
                  {formatRupiah(summary.totalDiscount)}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Potongan voucher & manual</div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Section 1: Line Chart Tren Omzet Harian */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
            <h2 className="font-bold text-base text-slate-900 mb-1">1. Tren Omzet Harian (Direct Kasir vs Pre-Order)</h2>
            <p className="text-xs text-slate-500 mb-4">
              Visualisasi pergerakan pemasukan harian dan kontribusi dari booth kasir vs pesanan PO
            </p>

            <div className="h-72 w-full">
              {data?.revenueTrend && data.revenueTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(val: any) => formatRupiah(Number(val))}
                      contentStyle={{
                        borderRadius: "12px",
                        fontSize: "12px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total Omzet"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="direct"
                      name="Direct Kasir"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                    <Line
                      type="monotone"
                      dataKey="po"
                      name="Pre-Order (PO)"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Belum ada data transaksi pada rentang waktu ini.
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Donut Chart PO vs Direct & Bar Chart Antar Event */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <h2 className="font-bold text-base text-slate-900 mb-1">2. Porsi Sumber Penjualan</h2>
                <p className="text-xs text-slate-500 mb-4">Perbandingan omzet Pre-Order vs Direct Booth</p>
              </div>

              <div className="h-64 flex items-center justify-center">
                {data?.sourceComparison && data.sourceComparison.some((s: any) => s.revenue > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.sourceComparison}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        {data.sourceComparison.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => formatRupiah(Number(val))}
                        contentStyle={{
                          borderRadius: "12px",
                          fontSize: "12px",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400">Belum ada transaksi tercatat.</div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
              <h2 className="font-bold text-base text-slate-900 mb-1">3. Perbandingan Omzet Antar Event Bazaar</h2>
              <p className="text-xs text-slate-500 mb-4">
                Total pemasukan yang diraih di masing-masing event/bazaar
              </p>

              <div className="h-64">
                {data?.eventComparison && data.eventComparison.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.eventComparison}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(val: any) => formatRupiah(Number(val))}
                        contentStyle={{
                          borderRadius: "12px",
                          fontSize: "12px",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      <Bar dataKey="revenue" name="Total Omzet" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Belum ada data event tercatat.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4 & 5: Top Products & Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
              <h2 className="font-bold text-base text-slate-900 mb-1">4. Top 8 Produk Terlaris</h2>
              <p className="text-xs text-slate-500 mb-4">
                Katalog produk dengan volume penjualan tertinggi dalam rentang waktu ini
              </p>

              <div className="h-64">
                {data?.topProducts && data.topProducts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={130}
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(val: any) => `${val} porsi / cup`}
                        contentStyle={{
                          borderRadius: "12px",
                          fontSize: "12px",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      <Bar dataKey="qty" name="Qty Terjual" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Belum ada produk yang terjual.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <h2 className="font-bold text-base text-slate-900 mb-1">5. Metode Pembayaran</h2>
                <p className="text-xs text-slate-500 mb-4">Distribusi nominal transaksi QRIS, Tunai, dan Transfer</p>
              </div>

              <div className="h-64 flex items-center justify-center">
                {data?.paymentDistribution && data.paymentDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.paymentDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                      >
                        {data.paymentDistribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => formatRupiah(Number(val))}
                        contentStyle={{
                          borderRadius: "12px",
                          fontSize: "12px",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400">Belum ada data pembayaran.</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ========================================================================= */
        /* TAB 2: ANALISIS & REKAPITULASI OMZET BULANAN (TAHUNAN) */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* 4 Stat Cards Tahunan / Bulanan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Total Omzet Tahun {selectedYear}
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {formatRupiah(monthlySummary.annualTotalRevenue)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Akumulasi omzet bersih 12 bulan</div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Rata-rata Omzet / Bulan
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {formatRupiah(monthlySummary.averageMonthlyRevenue)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Rata-rata bulan aktif</div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Bulan Omzet Tertinggi
              </span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {monthlySummary.bestMonthName}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {formatRupiah(monthlySummary.bestMonthRevenue)}
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Total Transaksi Tahun {selectedYear}
              </span>
              <div className="text-2xl font-black text-violet-700 mt-1">
                {monthlySummary.annualTotalOrders} <span className="text-xs font-medium text-slate-500">order</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Total pesanan berhasil</div>
            </div>
          </div>

          {/* Monthly Revenue Bar Chart (12 Bulan) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  Grafik Pertumbuhan Omzet Bulanan (Januari – Desember {selectedYear})
                </h2>
                <p className="text-xs text-slate-500">
                  Perbandingan omzet kotor, potongan diskon voucher, dan omzet bersih per bulan
                </p>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Tahun {selectedYear}
              </span>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="monthShort" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => formatRupiah(Number(val))}
                    contentStyle={{
                      borderRadius: "12px",
                      fontSize: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Bar
                    dataKey="netRevenue"
                    name="Omzet Bersih"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="directRevenue"
                    name="Kasir Booth"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="poRevenue"
                    name="Pre-Order (PO)"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Summary Table (12 Bulan Lengkap) */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="font-bold text-sm text-slate-900">
                  Tabel Rincian Rekapitulasi Omzet Bulanan {selectedYear}
                </h2>
                <p className="text-xs text-slate-500">
                  Audit lengkap performa per bulan beserta pertumbuhan MoM (Month-over-Month)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Bulan</th>
                    <th className="py-3 px-4">Total Order</th>
                    <th className="py-3 px-4">Direct Booth</th>
                    <th className="py-3 px-4">Pre-Order (PO)</th>
                    <th className="py-3 px-4">Total Diskon</th>
                    <th className="py-3 px-4">Omzet Bersih</th>
                    <th className="py-3 px-4">Rata-rata Order</th>
                    <th className="py-3 px-4 text-right">Pertumbuhan (MoM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyRevenue.map((m: any) => {
                    const isPositive = m.momGrowth > 0;
                    const isNegative = m.momGrowth < 0;

                    return (
                      <tr key={m.monthIndex} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {m.monthName}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {m.ordersCount} transaksi
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatRupiah(m.directRevenue)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {formatRupiah(m.poRevenue)}
                        </td>
                        <td className="py-3.5 px-4 text-rose-600">
                          {m.discount > 0 ? `-${formatRupiah(m.discount)}` : "Rp 0"}
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900">
                          {formatRupiah(m.netRevenue)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {formatRupiah(m.avgTicket)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {m.ordersCount === 0 ? (
                            <span className="text-slate-400">-</span>
                          ) : m.monthIndex === 0 ? (
                            <span className="text-slate-400 text-[10px]">Awal Tahun</span>
                          ) : isPositive ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[11px]">
                              <ArrowUpRight className="h-3 w-3" />
                              +{m.momGrowth}%
                            </span>
                          ) : isNegative ? (
                            <span className="inline-flex items-center gap-0.5 text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold text-[11px]">
                              <ArrowDownRight className="h-3 w-3" />
                              {m.momGrowth}%
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium text-[11px]">0%</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
