# PANDUAN PENGGUNAAN & STANDAR OPERASIONAL PROSEDUR (SOP)
## SISTEM POS & MANAJEMEN INVENTARIS DUA CARITA COFFEE

Dokumen ini berisi panduan lengkap dan Standar Operasional Prosedur (SOP) resmi untuk penggunaan aplikasi operasional **Dua Carita Coffee** (Kasir POS, Pre-Order, Manajemen Stok, Supplier, Keuangan Dual Ledger, dan Rencana Anggaran Biaya).

---

## 📌 DAFTAR ISI
1. [Struktur Pengguna & Peran (Role)](#1-struktur-pengguna--peran-role)
2. [SOP 1: Pembukaan Shift & Persiapan Booth / Bazaar](#sop-1-pembukaan-shift--persiapan-booth--bazaar)
3. [SOP 2: Operasional Kasir Direct (POS)](#sop-2-operasional-kasir-direct-pos)
4. [SOP 3: Pengelolaan Pesanan Pre-Order (PO)](#sop-3-pengelolaan-pesanan-pre-order-po)
5. [SOP 4: Pembukuan Keuangan (Dual Ledger: Cash & QRIS)](#sop-4-pembukuan-keuangan-dual-ledger-cash--qris)
6. [SOP 5: Pengelolaan Rencana Anggaran Biaya (RAB)](#sop-5-pengelolaan-rencana-anggaran-biaya-rab)
7. [SOP 6: Manajemen Stok Bahan Baku & Kemasan](#sop-6-manajemen-stok-bahan-baku--kemasan)
8. [SOP 7: Pengadaan Barang & Hubungan Supplier](#sop-7-pengadaan-barang--hubungan-supplier)
9. [SOP 8: Pembatalan Transaksi (Void) & Penyesuaian](#sop-8-pembatalan-transaksi-void--penyesuaian)
10. [SOP 9: Penutupan Shift (Closing) & Rekonsiliasi Kas](#sop-9-penutupan-shift-closing--rekonsiliasi-kas)

---

## 1. Struktur Pengguna & Peran (Role)

Aplikasi Dua Carita Coffee dirancang untuk digunakan oleh tim internal:
- **Owner / Manager (Febri / Revan / Raihan)**:
  - Akses penuh ke seluruh menu sistem.
  - Berwenang mengubah harga produk, formula resep (BOM), anggaran (RAB), master supplier, dan manajemen staf.
- **Kasir / Barista**:
  - Mengoperasikan POS Direct, memproses PO, mencetak struk thermal, dan mencatat mutasi kas operasional harian.
  - Wajib login menggunakan akun/PIN masing-masing saat bertugas agar histori transaksi tercatat akurat.

---

## SOP 1: Pembukaan Shift & Persiapan Booth / Bazaar

### Waktu Pelaksanaan: 15–30 menit sebelum open booth / bazaar.

1. **Login Kasir Bertugas**:
   - Buka aplikasi pada browser (PC / Tablet / HP).
   - Masukkan PIN staf yang bertugas pada halaman login.
   - Pastikan nama kasir yang aktif muncul pada pojok kiri bawah sidebar (*contoh: Kasir Bertugas: Raihan*).
   - Jika berganti staf, klik tombol **"Ganti"** pada sidebar untuk switch kasir secara cepat tanpa logout total.

2. **Cek Event / Bazaar Aktif**:
   - Masuk ke menu **Event / Bazaar** (`/events`).
   - Pastikan event hari ini berstatus **"Ongoing"** (misal: *Bazaar MOKAKU 2026* atau *Stand Harian*).
   - Seluruh transaksi kasir yang dibuat akan otomatis tercatat ke dalam event yang aktif tersebut.

3. **Cek Saldo Kas Fisik Awal**:
   - Masuk ke menu **Buku Kas & Keuangan** (`/finance`).
   - Klik tab **"Kas Tunai (Cash)"**.
   - Pastikan uang fisik di laci/kotak kas (*cash drawer*) sesuai dengan nilai **"Saldo Kas Saat Ini"**.

4. **Pengecekan Stok Bahan & Kemasan**:
   - Masuk ke menu **Manajemen Stok** (`/stock`).
   - Pastikan stok bahan baku (kopi, susu UHT, sirup, krimer, gula aren) dan kemasan (Cup 12 Oz, Botol 250ml, Botol 1L, stiker) dalam kondisi aman (tidak berwarna merah / di bawah batas minimum).

---

## SOP 2: Operasional Kasir Direct (POS)

### Halaman: `Kasir Direct (POS)` (`/pos`)

1. **Memilih Menu Pesanan**:
   - Klik kategori produk (Kopi, Non-Kopi, Botol 250ml, Botol 1 Liter).
   - Klik produk yang dipesan pembeli untuk menambahkannya ke keranjang (*cart*).
   - Varian resmi Dua Carita:
     - **Cup 12 Oz**: Aren Coffee Milk (Rp 13k), Hazelnut Coffee Milk (Rp 13k), Choco Blend (Rp 15k), Signature (Rp 10k), Matcha Latte (Rp 16k), Caffe Latte (Rp 13k).
     - **Botol 250 ML**: Aren (Rp 15k), Hazelnut (Rp 16k), Choco Blend (Rp 18k), Signature (Rp 13k), Matcha (Rp 19k), Caffe Latte (Rp 15k).
     - **Botol 1000 ML (1 Liter)**: Aren (Rp 55k), Hazelnut (Rp 55k), Choco Blend (Rp 55k), Signature (Rp 47k), Matcha (Rp 55k), Caffe Latte (Rp 55k).

2. **Input Kustomisasi / Catatan Pesanan**:
   - Klik item di keranjang untuk menambahkan catatan (misal: *Less ice, Normal sweet, Tanpa sedotan*).

3. **Input Data Pelanggan & Status Pesanan**:
   - Pada panel keranjang, masukkan **Nama Pelanggan** (contoh: *Kak Maya*, *Meja 3*, *Tamu Stand*).
   - Pilih **Status Order**:
     - **Langsung Selesai**: Minuman langsung diracik dan diserahkan ke pelanggan saat itu juga.
     - **Sedang Diproses (Antre)**: Untuk pesanan yang membutuhkan waktu antre peracikan barista.

4. **Voucher / Diskon (Jika Ada)**:
   - Masukkan kode voucher promosi pada kolom voucher, lalu klik *Terapkan*. Sistem akan memvalidasi kuota dan masa berlaku secara otomatis di server.

5. **Proses Pembayaran**:
   - Klik tombol **"Bayar Sekarang"**.
   - Pilih metode pembayaran:
     - **Tunai (Cash)**: Masukkan nominal uang yang diterima dari pembeli. Sistem secara otomatis menghitung **Uang Kembalian (*Change*)**.
     - **QRIS**: Arahkan pelanggan memindai barcode QRIS resmi Dua Carita. Pastikan notifikasi dana masuk telah diterima di HP kasir sebelum menyelesaikan pesanan.
     - **Transfer**: Pastikan bukti transfer terverifikasi.
   - Klik **"Selesaikan Pembayaran"**.

6. **Struk & Invoice**:
   - Modal struk akan muncul otomatis.
   - **Cetak Struk Thermal 80mm**: Klik *Cetak Struk* untuk mencetak ke printer bluetooth/thermal mini 80mm.
   - **Kirim WhatsApp**: Masukkan nomor WA pembeli lalu klik tombol WhatsApp untuk langsung membuka chat invoice otomatis.

7. **Pengurangan Stok Otomatis (BOM)**:
   - Sistem secara otomatis memotong stok bahan baku dan packaging (misal: 1 porsi Aren Coffee Milk akan langsung memotong Kopi, Susu UHT, Rich Milk, Creamer, Gula Aren, Cup 12 Oz, dan Tutup Cup dari database inventaris).

---

## SOP 3: Pengelolaan Pesanan Pre-Order (PO)

### Halaman: `Kelola Pre-Order (PO)` (`/po`) & `Pelanggan PO` (`/customers`)

1. **Mencatat Pesanan Pre-Order Baru**:
   - Masuk ke menu **Kelola Pre-Order (PO)**.
   - Masukkan nama pemesan, nomor WhatsApp, tanggal & jam pengambilan pesanan.
   - Pilih **Metode Pengambilan**:
     - *Ambil di Event* (Sebutkan nama event bazaar)
     - *COD (Cash on Delivery)*
     - *Ketemu Langsung*
   - Masukkan produk PO yang dipesan (biasanya varian Botol 250ml atau 1 Liter).

2. **Status Pembayaran PO**:
   - Jika pelanggan baru membayar uang muka: Masukkan nominal pada bagian **DP (Down Payment)**. Sistem akan mencatat sisa tagihan yang harus dilunasi saat serah terima.
   - Jika sudah lunas di awal: Centang atau pilih **Lunas**.

3. **Perubahan Status Pengerjaan**:
   - **Pending**: Pesanan baru masuk, belum diracik.
   - **Diproses**: Minuman sedang diproduksi/dikemas oleh tim barista.
   - **Siap Diambil**: Pesanan sudah siap di booth/tempat serah terima. Kirim notifikasi WA ke pelanggan.
   - **Selesai**: Pesanan telah diserahkan dan sisa tagihan telah dilunasi penuh.

---

## SOP 4: Pembukuan Keuangan (Dual Ledger: Cash & QRIS)

### Halaman: `Buku Kas & Keuangan` (`/finance`)

Sistem keuangan Dua Carita Coffee menggunakan **Dual Ledger** (dua buku kas terpisah):
1. **Kas Tunai (Cash)**: Khusus mencatat mutasi uang fisik di booth/laci kas.
2. **Saldo QRIS (Digital)**: Khusus mencatat dana yang masuk ke rekening QRIS dan pengeluaran digital.

### A. Prosedur Mencatat Pengeluaran Harian
1. Klik tombol **"+ Catat Mutasi Kas"** di kanan atas.
2. Pilih akun dompet yang digunakan:
   - Pilih **Kas Tunai (Cash)** jika membayar pakai uang fisik di laci.
   - Pilih **Saldo QRIS** jika membayar via transfer/QRIS/debit.
3. Pilih tipe: **Pengeluaran (Keluar)**.
4. Pilih kategori yang sesuai:
   - `BAHAN_BAKU`: Beli susu, es batu, kopi, creamer, gula, sirup.
   - `PACKAGING`: Beli cup, tutup, botol kale, stiker, sedotan, plastik.
   - `OPERASIONAL`: Parkir, makan staf, bensin, ongkir, pulsa, lakban.
   - `MODAL`: Pembagian hasil, refund modal tim.
   - `LAINNYA`: Tip, biaya tak terduga.
5. Masukkan nominal rupiah, nama kasir/penanggung jawab, dan keterangan spesifik.
6. Klik **"Simpan Mutasi"**. Saldo berjalan akan otomatis terkalkulasi.

### B. Prosedur Pindah Saldo (Tarik Tunai / Penyetoran)
Jika terjadi pemindahan dana antara Kas Tunai dan QRIS (contoh: Kasir menarik uang QRIS sebesar Rp 150.000 ke uang kas):
1. **Di Buku QRIS**: Catat mutasi **Keluar** sebesar Rp 150.000 dengan kategori `PINDAH_SALDO` dan keterangan *"Pindah ke Kas Tunai"*.
2. **Di Buku Kas Tunai**: Catat mutasi **Masuk** sebesar Rp 150.000 dengan kategori `PINDAH_SALDO` dan keterangan *"Dari Saldo QRIS"*.
*(Kedua saldo akan langsung sinkron secara riil).*

---

## SOP 5: Pengelolaan Rencana Anggaran Biaya (RAB)

### Halaman: `Buku Kas & Keuangan` (`/finance`) -> Tab `Rencana Anggaran (RAB)`

Modul RAB digunakan untuk merencanakan belanja kebutuhan booth, perlengkapan stand, dan bahan baku sebelum event/bazaar dimulai.

1. **Membuat Pos Anggaran Baru**:
   - Beralih ke tab **"Rencana Anggaran (RAB)"**.
   - Klik **"+ Tambah Item RAB"**.
   - Pilih bulan anggaran (misal: *Agustus 2026*).
   - Pilih **Sumber Dana / Penanggung Jawab**:
     - `DCC`: Menggunakan dana kas bersama Dua Carita Coffee.
     - `Revan` / `Febri` / `Raihan`: Ditalangi terlebih dahulu oleh anggota yang bersangkutan.
   - Masukkan nama barang, jumlah (Qty), satuan (Pcs/Pack/Kg/L), dan harga satuan. Total harga akan terkalkulasi otomatis.
   - Klik **"Simpan Item RAB"**.

2. **Monitoring Realisasi Anggaran**:
   - Pantau kartu ringkasan untuk melihat total belanja yang ditalangi masing-masing anggota:
     - *Uang DCC*
     - *Uang Revan*
     - *Uang Febri*
     - *Uang Raihan*
   - Kartu ini digunakan sebagai dasar **Reimbursement / Refund Modal** pada pembukuan kas.

---

## SOP 6: Manajemen Stok Bahan Baku & Kemasan

### Halaman: `Manajemen Stok` (`/stock`) & `Produk & Kategori` (`/products`)

1. **Restock Bahan Baku (Barang Datang)**:
   - Saat kiriman bahan datang dari supplier (misal: Susu UHT 1 karton atau Kopi Robusta 2 kg):
   - Masuk ke menu **Manajemen Stok** -> Tab **Bahan Baku**.
   - Klik tombol **"+ Mutasi Stok"** pada item yang bersangkutan.
   - Pilih tipe: **Restock (Masuk)**.
   - Masukkan jumlah yang masuk dan catatan (contoh: *Beli dari Lets Brew*).
   - Stok bahan akan otomatis bertambah.

2. **Bahan Rusak / Tumpah / Expired**:
   - Jika ada susu basi, bubuk tumpah, atau botol rusak:
   - Lakukan mutasi stok dengan tipe **Rusak / Buang (Keluar)** dan berikan alasan jelas. Hal ini wajib dicatat agar tidak terjadi selisih (*gap*) antara stok sistem dan fisik.

3. **Pemberitahuan Stok Menipis (*Low Stock Warning*)**:
   - Setiap bahan memiliki batas `minStock`. Jika stok berada di bawah batas, kartu bahan akan berwarna merah/kuning sebagai penanda segera melakukan *re-order* ke supplier.

---

## SOP 7: Pengadaan Barang & Hubungan Supplier

### Halaman: `Master Supplier` (`/suppliers`)

1. **Daftar Supplier Resmi**:
   - `SPL-001` **Lets Brew**: Biji Kopi, Sirup Trieste, Denali, Creamer Santos, Matcha.
   - `SPL-002` **Utara Jaya**: Botol Kale 250ml & 1L.
   - `SPL-003` **Nyablonkeun.id**: Cup Injection 12 Oz & Tutup Cup.
   - `SPL-004` **Aj Supplier & Tbk Cipadung**: Susu UHT Diamond & Rich Milk grosir.
   - `SPL-005` **Camille Printshop**: Stiker Vinyl Kiss Cut.
   - `SPL-006` **Golden Sata Digital Printing**: Stiker Vinyl Kiss Cut.
   - `SPL-007` **Cicalengka Printing**: Stiker Vinyl Kiss Cut.

2. **Menghubungi Supplier**:
   - Klik tombol **"WhatsApp"** pada kartu supplier untuk langsung terhubung ke chat PIC vendor tanpa perlu menyimpan nomor terlebih dahulu.
   - Klik tombol **"Buka Maps"** untuk melihat rute lokasi gudang/toko fisik supplier.

3. **Mencatat Kenaikan / Perubahan Harga**:
   - Jika vendor menaikkan harga (misal: Botol Kale naik harga):
   - Klik tab **Katalog Item Supplier** -> Klik **Update Harga**.
   - Masukkan harga baru dan tanggal. Sistem akan otomatis mencatat riwayat perubahan harga (*Price History*) sehingga tim dapat memantau fluktuasi harga beli dari waktu ke waktu.

---

## SOP 8: Pembatalan Transaksi (Void) & Penyesuaian

### Halaman: `Riwayat & Laporan` (`/reports`)

1. **Ketentuan Pembatalan (Void)**:
   - Void hanya boleh dilakukan jika pesanan salah input, pembeli batal sebelum minuman dibuat, atau terjadi kesalahan pembayaran.
   - Void **hanya dapat disetujui oleh Kasir yang bertugas atau Owner**.

2. **Prosedur Void**:
   - Cari nomor pesanan di menu **Riwayat & Laporan**.
   - Klik tombol **"Batalkan (Void)"**.
   - Masukkan alasan pembatalan secara jelas (misal: *Salah pilih menu oleh kasir*).
   - **Integritas Sistem**: Saat pesanan di-void, sistem akan secara otomatis:
     1. Mengembalikan stok produk jadi.
     2. Mengembalikan seluruh takaran bahan baku (kopi, susu, sirup, kemasan) ke tabel `RawMaterial`.
     3. Memberikan tanda merah `VOID` pada transaksi laporan.

---

## SOP 9: Penutupan Shift (Closing) & Rekonsiliasi Kas

### Waktu Pelaksanaan: Sesaat setelah stand/booth tutup.

1. **Penghitungan Uang Fisik (*Physical Cash Count*)**:
   - Hitung seluruh uang tunai fisik yang ada di laci kas (kertas dan koin).
   - Pisahkan uang modal awal kas dengan uang hasil penjualan hari ini.

2. **Cocokkan dengan Buku Kas Sistem**:
   - Buka menu **Buku Kas & Keuangan** (`/finance`) -> Tab **Kas Tunai (Cash)**.
   - Nilai fisik uang tunai **WAJIB SAMA** dengan nilai **"Saldo Kas Saat Ini"**.
   - Jika terdapat selisih:
     - Telusuri apakah ada pengeluaran operasional kecil (es batu, parkir, sedotan) yang lupa diinput kasir.
     - Jika ditemukan, segera klik **"+ Catat Mutasi Kas"** untuk menginput pengeluaran tersebut.

3. **Cek Rekap Transaksi Penjualan**:
   - Masuk ke menu **Riwayat & Laporan** (`/reports`).
   - Filter tanggal hari ini.
   - Periksa total omset harian, rincian pembayaran Cash vs QRIS, dan total cup terjual.

4. **Ekspor Cadangan Data (*Backup Data*)**:
   - Klik tombol **"Ekspor CSV"** di menu Laporan atau Buku Kas sebagai arsip pembukuan berkala.

5. **Kunci Kiosk / Logout**:
   - Klik tombol ikon gembok (**Lock**) pada pojok kiri bawah sidebar untuk mengunci sistem dan mengakhiri sesi shift kasir.

---

*Dokumen SOP ini berlaku untuk seluruh operasional booth, event bazaar, dan aktivitas bisnis Dua Carita Coffee.*
