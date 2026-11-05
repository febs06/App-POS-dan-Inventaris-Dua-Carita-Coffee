# Original User Request

## Initial Request — 2026-11-05T15:16:47Z

Gunakan tim lengkap untuk membagi pekerjaan arsitektur, frontend, backend, dan verifikasi. Perbaiki sistem resep dan komposisi bahan baku pada aplikasi POS & Inventaris Dua Carita Coffee agar setiap varian ukuran/kemasan memiliki resep bahan bakunya masing-masing secara spesifik (strict per varian), sehingga perhitungan HPP per varian, pengurangan stok saat transaksi kasir, dan kalkulasi kesiapan bahan baku akurat per kemasan/ukuran.

Integrity mode: development

## Requirements

### R1. Database Backup & Safety
Sebelum melakukan modifikasi skema atau migrasi data, buat backup lengkap skema dan data database yang ada saat ini untuk menjamin keamanan dan keterpulihan data operasional Dua Carita Coffee ("selalu backup jika ada pembaruan").

### R2. Variant-Specific Recipe Modeling (Strict per Variant)
Perbarui model data resep (`ProductIngredient` atau relasi resep) agar terikat spesifik ke level varian produk (`ProductVariant`), bukan lagi terikat pada level produk (`Product`). Setiap varian ukuran/kemasan (contoh: Cup Reguler, Cup Large, Botol 250 ML, Botol 1.000 ML) memiliki takaran bahan baku (seperti espresso, susu, sirup) dan wadah kemasan fisiknya masing-masing secara independen tanpa fallback ke level produk.

### R3. Accurate HPP (COGS) Calculation per Variant
Perhitungan HPP (Harga Pokok Penjualan) harus dihitung secara akurat per varian ukuran/kemasan berdasarkan total akumulasi harga bahan baku dan kemasan fisik yang menyusun resep varian tersebut.

### R4. Variant-Aware Inventory Depletion & Stock Readiness
- Saat transaksi penjualan kasir (POS) terjadi untuk varian tertentu, pemotongan stok bahan baku dan wadah kemasan fisik harus memotong stok sesuai takaran resep spesifik varian yang dibeli.
- Perhitungan kesiapan stok (jumlah porsi yang dapat dibuat) harus dihitung per varian ukuran/kemasan berdasarkan ketersediaan bahan baku dan kemasan fisik pada resep masing-masing varian.

### R5. Full-Stack Management UI
Sediakan atau perbarui antarmuka (UI) manajemen resep pada menu Admin / POS agar pengguna dapat mengelola (melihat, menambah, mengubah takaran, dan menghapus) komposisi bahan baku untuk setiap varian ukuran/kemasan.

## Acceptance Criteria

### Database & Backup
- [ ] Backup skema dan data database eksisting berhasil dibuat sebelum perubahan skema atau migrasi dijalankan.
- [ ] Model data mendukung penyimpanan relasi resep bahan baku spesifik per varian (`ProductVariant`).
- [ ] Data resep tersimpan dan terasosiasi secara unik ke masing-masing varian ukuran/kemasan tanpa fallback ke level produk.

### HPP & Stock Calculation Accuracy
- [ ] Kalkulasi HPP per varian ukuran/kemasan menghasilkan nilai akurat berdasarkan jumlah takaran dan harga beli bahan baku serta kemasan fisik varian tersebut.
- [ ] Kalkulasi kesiapan bahan baku (stok porsi yang dapat dibuat) akurat per varian ukuran/kemasan berdasarkan stok bahan minimum yang tersedia.

### POS Inventory Depletion
- [ ] Transaksi penjualan varian tertentu di kasir memotong stok bahan baku dan kemasan fisik sesuai takaran resep varian yang dipilih.
- [ ] Penjualan dua varian berbeda dari produk yang sama memotong stok bahan baku dan kemasan fisik yang berbeda sesuai resep masing-masing varian.

### UI Management
- [ ] Antarmuka Admin/POS menampilkan komposisi bahan baku per varian ukuran/kemasan.
- [ ] Pengguna dapat menambah, mengedit takaran, dan menghapus bahan baku pada resep tiap varian ukuran/kemasan melalui UI.

### Automated Verification
- [ ] Tersedia automated unit/integration test baru yang memvalidasi integritas data resep per varian, kebenaran kalkulasi HPP per varian, dan pemotongan stok bahan saat transaksi penjualan.
- [ ] Seluruh automated test berjalan sukses tanpa error (pass 100%).
