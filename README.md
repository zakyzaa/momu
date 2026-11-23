# MOMU Photobooth - Internal Management Dashboard

Dashboard internal yang simpel, modern, dan praktis khusus dirancang untuk bisnis jasa **MOMU Photobooth**. Membantu pencatatan keuangan arus kas (omset, biaya operasional, laba bersih) dan agenda booking event per bulan dengan visual kalender interaktif.

---

## 🌟 Fitur Utama

1. **Ringkasan & Metrik Bisnis (Overview)**
   - **Total Agenda Photobooth**: Jumlah event bulan berjalan lengkap dengan status (Selesai, DP, Lunas).
   - **Pemasukan (Omset)**: Total uang masuk dari DP & pelunasan paket klien.
   - **Pengeluaran Operasional**: Total biaya pembelian kertas/tinta, honor crew/operator, transport/bensin, dan iklan.
   - **Laba Bersih & Margin Profit**: Kalkulasi otomatis laba bersih dan persentase margin keuntungan.
   - **Agenda Photobooth Terdekat**: Daftar countdown event yang harus segera dipersiapkan tim MOMU.
   - **Alokasi Biaya**: Rasio pengeluaran vs laba serta kategori pengeluaran terbesar.
   - **Piutang/Sisa Tagihan Belum Lunas**: Notifikasi sisa pembayaran klien yang masih tertunda.

2. **Jadwal & Agenda Booking Photobooth (Tampilan Kalender & Tabel)**
   - **Kalender Bulanan (Monthly Calendar Grid)**: 
     - Menampilkan hari dan tanggal dalam bulan terpilih.
     - Setiap tanggal memiliki badge event photobooth berwarna sesuai status.
     - Klik tanggal untuk langsung menambahkan booking di hari tersebut.
     - Klik badge event untuk melihat detail atau mencetak bukti booking / invoice.
   - **Tabel Daftar Agenda (List View)**:
     - Pencarian cepat berdasarkan nama klien, venue/lokasi, atau paket.
     - Filter status: *Menunggu DP, DP Diterima, Lunas, Selesai, Dibatalkan*.
     - Detail jam operasional, nama kru yang bertugas, nomor kontak WhatsApp, dan catatan template/request khusus.
   - **Sinkronisasi Otomatis ke Kas**: Saat booking baru dibuat dengan pembayaran DP/Lunas, sistem dapat otomatis mencatatnya sebagai transaksi pemasukan di buku kas!

3. **Pencatatan Keuangan (Cashflow Management)**
   - Pencatatan Pemasukan (+) dan Pengeluaran (-).
   - Kategori khusus usaha photobooth:
     - *Pemasukan*: Paket Photobooth (DP/Pelunasan), Overtime, Custom Backdrop/Guestbook, Tip.
     - *Pengeluaran*: Kertas & Ribbon Tinta Printer (DNP dll), Honor Kru & Fotografer, Bahan Bakar & Transport Logistik, Perawatan Kamera & Alat, Properti/Aksesoris Lucu, Iklan/Marketing Medsos.
   - Metode bayar (BCA, Mandiri/BRI, QRIS, Tunai).
   - Tombol **Export CSV** untuk analisis di Microsoft Excel atau Google Sheets.

4. **Katalog Paket & Pengaturan Data**
   - Katalog paket bawaan (*MOMU Strip 2 Jam, MOMU Polaroid 3 Jam, MOMU Glam Booth 4 Jam, MOMU 360 Video Spinner*).
   - Kemampuan menambah paket baru sesuai kebutuhan.
   - **Penyimpanan Lokal (LocalStorage)**: Data tersimpan aman di browser Anda tanpa perlu internet atau database rumit.
   - **Backup & Restore (JSON)**: Unduh cadangan file data sewaktu-waktu dan pulihkan kembali kapan saja.
   - **Tombol Reset Data Contoh**: Kembalikan data demo MOMU untuk latihan kapan pun.

5. **Invoice & Surat Jalan Siap Cetak (Print Friendly)**
   - Klik tombol cetak pada detail booking untuk menghasilkan invoice profesional MOMU atau surat jalan bagi kru yang bertugas di lapangan.

---

## 🚀 Cara Menjalankan

### Cara 1: Langsung Buka di Browser (Paling Mudah)
Cukup klik ganda (double-click) file:
`buka_dashboard.bat` atau buka langsung file `index.html` dengan Google Chrome, Microsoft Edge, atau browser favorit Anda.

### Cara 2: Menjalankan dengan Local Web Server
Klik ganda file:
`jalankan_server.bat`
Aplikasi akan otomatis terbuka di `http://localhost:8080`.

---

## 📁 Struktur File
```
momu-dashboard/
├── index.html           # File utama aplikasi web dashboard MOMU
├── buka_dashboard.bat   # Script 1-klik untuk membuka di browser
├── jalankan_server.bat  # Script menjalankan local server Python
└── README.md            # Dokumentasi panduan penggunaan
```
