# BoothFlow 🏪 — Web Kasir POS, Pre-Order (PO), & Booth Event Management

Aplikasi web kasir (POS), pengelolaan Pre-Order WhatsApp, dan manajemen tenant booth event/bazaar yang dirancang khusus untuk bisnis makanan/minuman tanpa tempat fisik tetap.

---

## 🚀 Fitur Utama

1. **Dashboard Eksekutif**:
   - Status booth saat ini & banner event bazaar yang sedang berjalan (*ongoing*).
   - Indikator omzet hari ini, total transaksi, pesanan PO siap diambil/diproses, dan alert stok menipis (≤ 10 unit).
   - Akses instan ke Kasir POS, Input PO Baru, dan Alokasi Stok.

2. **Kasir Direct POS (`/pos`)**:
   - Terikat ke event bazaar yang aktif (atau booth mandiri).
   - Pencarian cepat & filter kategori menu.
   - Keranjang belanja interaktif dengan quantity changer dan catatan khusus per menu.
   - Input diskon: Kode Voucher promo (validasi kuota, minimum order, cap diskon otomatis) atau Diskon Manual (persen/nominal).
   - Multi metode pembayaran: **Cash** (lengkap dengan kalkulator uang pas & kembalian), **QRIS** (simulasi scan QR), dan **Transfer Bank**.
   - Otomatis potong stok dan cetak struk thermal 80mm.

3. **Kelola Pre-Order PO (`/po`)**:
   - Alur cepat pencatatan pesanan dari chat WhatsApp.
   - Pilih pelanggan terdaftar atau buat kontak baru secara *on-the-fly*.
   - Pilihan metode & tanggal pickup: Ambil di Booth Event, COD, atau Ketemu Langsung.
   - Fleksibilitas pembayaran: Bayar DP (Down Payment), Langsung Lunas, atau Belum Bayar.
   - Tombol cepat **Catat Pelunasan DP**.
   - Tombol **Kirim WhatsApp Invoice**: Membuat teks invoice rapi dan langsung membuka WhatsApp Web / Mobile ke nomor pelanggan.
   - Cetak struk invoice dan pembatalan pesanan (*void*) dengan catatan alasan.

4. **Manajemen Event & Bazaar (`/events`)**:
   - CRUD event: nama bazaar, lokasi, tanggal mulai/selesai, catatan, dan status (*upcoming*, *ongoing*, *selesai*).
   - Rekap omzet dan jumlah transaksi per event bazaar untuk evaluasi profitabilitas.
   - Fitur **Alokasi Stok ke Event**: Catat jumlah stok yang dibawa ke lokasi event tertentu.

5. **Manajemen Produk & Kategori (`/products`)**:
   - CRUD Kategori menu makanan & minuman.
   - CRUD Produk: Nama, kategori, harga jual, modal (HPP), stok awal, satuan, foto menu, dan status aktif.
   - Kalkulator margin laba otomatis (Harga Jual - Modal) dan persentase keuntungan.

6. **Database Pelanggan PO (`/customers`)**:
   - Database pelanggan WhatsApp.
   - Histori frekuensi PO dan order terakhir.
   - Tombol langsung chat WhatsApp (`wa.me`).

7. **Manajemen Stok & Mutasi (`/stock`)**:
   - Alert visual stok menipis (≤ 10 unit).
   - Penyesuaian stok manual (restock / koreksi rusak/expired).
   - Alokasi stok yang dibawa ke event.
   - Audit trail mutasi stok lengkap (*StockLog*).

8. **Manajemen Voucher & Diskon (`/vouchers`)**:
   - Buat kode voucher (persentase dengan max cap diskon, atau potongan nominal tetap).
   - Atur minimum pembelian, periode berlaku, dan kuota limit pemakaian.
   - Toggle aktif/nonaktif kupon.

9. **Riwayat & Laporan Transaksi (`/reports`)**:
   - Filter multi-kriteria: rentang tanggal, event bazaar, sumber order (PO vs Direct), status pembayaran (lunas, DP, belum bayar), dan status pesanan.
   - Fitur **Void / Batalkan Order** dengan kewajiban input alasan (stok otomatis dikembalikan).
   - Cetak rekap laporan penjualan.

10. **Visual Analytics (`/analytics`)**:
    - Filter rentang waktu (7 hari, 14 hari, 30 hari, 90 hari).
    - **5 Jenis Grafik Interaktif (Recharts)**:
      1. *Line Chart*: Tren Omzet Harian (membedakan Direct vs PO).
      2. *Bar Chart*: Perbandingan Omzet Antar Event Bazaar.
      3. *Donut Chart*: Porsi Kontribusi PO vs Kasir Direct.
      4. *Ranked Bar Chart*: Top Produk Terlaris.
      5. *Pie Chart*: Distribusi Metode Pembayaran (Cash, QRIS, Transfer).
    - Analisis ROI & efektivitas kupon voucher.

---

## 🛠️ Tech Stack & Arsitektur

- **Frontend & Backend**: Next.js 14/15 (App Router, TypeScript)
- **Styling**: Tailwind CSS + Custom Print Thermal Styling + Lucide React Icons
- **Database**: SQLite (100% lokal, zero config server, offline-ready)
- **ORM**: Prisma ORM
- **Visualisasi Data**: Recharts

---

## 📁 Struktur Folder Proyek

```
booth-pos-po/
├── prisma/
│   ├── schema.prisma       # Skema database 9 model lengkap
│   ├── seed.ts             # Data demo realistis (event, menu, PO, order, voucher)
│   └── dev.db              # File database SQLite lokal
├── src/
│   ├── app/
│   │   ├── api/            # Next.js Route Handlers (Backend CRUD & Analytics)
│   │   │   ├── analytics/  # Agregasi data grafik analitik
│   │   │   ├── categories/ # CRUD Kategori
│   │   │   ├── customers/  # CRUD Pelanggan PO
│   │   │   ├── events/     # CRUD Event Bazaar
│   │   │   ├── orders/     # Transaksi, potong stok, update status & void
│   │   │   │   └── [id]/pay # Pelunasan sisa tagihan DP
│   │   │   ├── products/   # CRUD Produk & HPP
│   │   │   ├── stock/      # Stok alert, restock & alokasi event
│   │   │   └── vouchers/   # CRUD & validasi kode voucher
│   │   ├── analytics/      # Halaman Visual Analytics
│   │   ├── customers/      # Halaman Database Pelanggan
│   │   ├── events/         # Halaman Manajemen Event & Alokasi
│   │   ├── po/             # Halaman Kelola Pre-Order WhatsApp
│   │   ├── pos/            # Halaman Kasir Direct Transaksi Cepat
│   │   ├── products/       # Halaman Produk & Kategori
│   │   ├── reports/        # Halaman Riwayat & Laporan Penjualan
│   │   ├── stock/          # Halaman Manajemen Stok
│   │   ├── vouchers/       # Halaman Voucher & Diskon
│   │   ├── globals.css     # Styling global & thermal print layout
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Halaman Dashboard
│   ├── components/
│   │   ├── AppLayout.tsx   # Wrapper layout aplikasi
│   │   ├── ReceiptModal.tsx# Preview struk thermal & share invoice WA
│   │   ├── Sidebar.tsx     # Navigasi sidebar responsif
│   │   ├── TopNav.tsx      # Bar navigasi atas & status event aktif
│   │   └── VoidModal.tsx   # Dialog pembatalan transaksi dengan alasan
│   └── lib/
│       ├── format.ts       # Helper format Rupiah, tanggal & status badge
│       └── prisma.ts       # Singleton instance Prisma client
├── .env                    # Konfigurasi DATABASE_URL="file:./dev.db"
├── package.json
└── README.md
```

---

## ⚡ Cara Menjalankan Proyek Secara Lokal

### 1. Masuk ke Direktori Proyek
```bash
cd "C:\Users\febri\.gemini\antigravity-ide\scratch\booth-pos-po"
```

### 2. Instalasi Dependensi (jika belum)
```bash
npm install
```

### 3. Setup & Migrasi Database SQLite
Pastikan skema database tersinkronisasi:
```bash
npx prisma db push
```

### 4. Seeding Data Demo (Event, Menu, Order PO & Direct, Voucher)
```bash
npx tsx prisma/seed.ts
```

### 5. Jalankan Development Server
```bash
npm run dev
```

Buka browser di: **[http://localhost:3000](http://localhost:3000)**
