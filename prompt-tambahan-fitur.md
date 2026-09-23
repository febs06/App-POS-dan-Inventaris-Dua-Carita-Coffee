# Prompt: Penambahan Fitur & Perbaikan pada Aplikasi Kasir/PO yang Sudah Ada

## Konteks
Aplikasi web kasir & PO ini **sudah ada dan sudah berjalan ±90%**. Ini **bukan permintaan untuk membangun ulang dari awal**, melainkan menambahkan beberapa fitur baru dan melakukan sejumlah perbaikan pada bagian yang sudah ada. Sesuaikan dengan struktur project, penamaan komponen, dan pola kode yang sudah dipakai di codebase saat ini — jangan buat struktur baru yang tidak konsisten dengan yang sudah ada.

Berikut daftar penambahan/perbaikan yang perlu dikerjakan:

## 1. Fitur Restock Bahan Baku (Inventory)
Tambahkan/rapikan alur restock untuk bahan baku (bukan produk jadi), dengan referensi tampilan seperti pada screenshot yang dilampirkan:

- **Halaman Inventory Bahan Baku**, terdiri dari:
  - Form **"Input Bahan Baru"**: field Nama Bahan, Jumlah, Satuan (dropdown), Keterangan (opsional), tombol "Tambah Bahan"
  - Tabel **"Daftar Inventory"**: kolom Nama Bahan, Jumlah, Satuan, Keterangan, dan Aksi. Lengkapi dengan kolom pencarian bahan (search by nama)
  - Kolom Aksi berisi 3 tombol: **tambah stok/restock** (ikon `+`), **edit** (ikon pensil), **hapus** (ikon tempat sampah)
- **Modal "Restok Bahan"** yang muncul saat tombol restock ditekan, isinya:
  - Nama Bahan (otomatis terisi sesuai bahan yang dipilih, readonly)
  - Jumlah Restok & Satuan (otomatis mengikuti satuan bahan tsb)
  - Tanggal Restok (default hari ini, bisa diubah)
  - Tombol "Simpan Restok" — saat disimpan, jumlah stok bahan bertambah otomatis
  - Panel **"Riwayat Restok"** di bawah form, menampilkan tabel histori restok bahan tersebut (kolom: No, Tanggal, Jumlah), diurutkan dari yang terbaru. Jika belum ada riwayat, tampilkan pesan "Belum ada riwayat restok."
- Pastikan penambahan stok lewat modal ini tercatat di tabel log/histori restok (bukan hanya update angka stok saja), supaya riwayatnya bisa ditampilkan kembali kapan saja.

## 2. Status Order Default = "Sedang Diproses"
- Saat order baru dibuat (baik dari kasir/direct maupun PO), status awalnya harus **"Sedang Diproses"**, **bukan langsung "Selesai"**.
- Status baru berubah ke "Selesai" setelah ada aksi eksplisit dari admin/kasir (misal tombol "Tandai Selesai" atau saat pembayaran+pengambilan barang dikonfirmasi).
- Cek ulang alur pembuatan order yang sekarang — jika status langsung ter-set "selesai" saat submit, perbaiki logikanya.

## 3. Nomor WA di Struk Transaksi (untuk Share Invoice)
- Tambahkan nomor WhatsApp usaha ke tampilan/cetak struk transaksi, supaya struk yang di-share ke pelanggan (misal sebagai gambar/PDF via WA) menyertakan kontak yang bisa dihubungi balik.
- Ambil nomor WA dari satu sumber terpusat (misal halaman/pengaturan Profil Usaha) — jangan hardcode di banyak tempat, supaya kalau nomor berubah cukup update di satu tempat.
- Jika belum ada halaman pengaturan nomor WA usaha, tambahkan field sederhana untuk itu (bisa di halaman Settings/Profil yang sudah ada, atau buat baru jika belum ada).

## 4. Urutan Tampilan Order (Antrian FIFO)
- Perbaiki urutan daftar order (di halaman kasir/antrian order dan/atau kelola PO) agar **order paling lama di atas, order terbaru di bawah** — mengikuti urutan masuk (FIFO), supaya order yang lebih dulu masuk lebih dulu diproses.
- Cek query/sort yang dipakai sekarang — kemungkinan saat ini terurut terbalik (terbaru di atas), ubah jadi ascending berdasarkan waktu order dibuat.

## 5. Fitur Stock Opname
- Tambahkan fitur stock opname untuk bahan baku: admin bisa input hasil hitung stok fisik secara berkala, lalu sistem membandingkan dengan stok yang tercatat di sistem.
- Setelah opname disimpan:
  - Selisih (stok sistem vs stok fisik) dihitung otomatis dan ditampilkan
  - Stok di sistem dikoreksi mengikuti hasil hitung fisik (actual quantity)
  - Riwayat opname tersimpan (tanggal, bahan, stok sistem saat itu, stok fisik, selisih, catatan) agar bisa diaudit/dilihat lagi nanti
- Buat halaman/tab khusus untuk stock opname, terpisah dari halaman restock biasa (karena tujuannya beda: restock = menambah stok baru, opname = mengoreksi/mencocokkan stok yang sudah ada).

## 6. Dashboard: Top 8 Produk (Hanya Nama Produk, Tanpa Varian Ukuran)
- Pada bagian dashboard yang menampilkan produk terlaris, batasi tampilan ke **top 8 produk**.
- Jika satu produk punya beberapa varian ukuran (misal "Kopi Susu 250ml" dan "Kopi Susu 500ml"), **gabungkan total penjualannya berdasarkan nama produk yang sama** — jangan ditampilkan terpisah per varian. Yang muncul di ranking cukup "Kopi Susu" dengan total gabungan dari semua ukurannya.
- Pastikan logika agregasi ini konsisten dipakai juga di bagian Analytics/laporan lain yang menampilkan produk terlaris, supaya angkanya tidak berbeda-beda antar halaman.

## Catatan Tambahan
- Untuk setiap poin di atas, mohon cek dulu bagian kode yang sudah ada (komponen, API/route, schema database) sebelum menambahkan yang baru — supaya tidak duplikat logika atau bikin struktur data yang bertabrakan dengan yang sudah berjalan.
- Jika ada perubahan pada schema database (misal tabel restock log atau stock opname belum ada), buatkan migration-nya juga.
