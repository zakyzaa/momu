# MOMU Photobooth - Internal Management Dashboard

Dashboard internal yang simpel, modern, dan praktis khusus dirancang untuk bisnis jasa **MOMU Photobooth**. Membantu pencatatan keuangan arus kas (omset, biaya operasional, laba bersih) dan agenda booking event per bulan dengan visual kalender interaktif.

---

## 🌟 Fitur Utama

1. **Ringkasan & Metrik Bisnis (Overview)**
2. **Jadwal & Agenda Booking Photobooth** (Kalender + Tabel)
3. **Pencatatan Keuangan** (Cashflow Management)
4. **Katalog Paket & Pengaturan Data**
5. **Invoice & Surat Jalan Siap Cetak**
6. **🔒 Supabase Auth (Aman untuk GitHub Pages)** — 1 akun akses bersama yang diverifikasi langsung oleh server Supabase
7. **⚡ Supabase Realtime Database** — Perubahan jadwal atau kas di satu perangkat langsung terupdate seketika di semua perangkat tim

---

## 🚀 Panduan Setup Supabase (Lengkap & Mudah)

### Langkah 1 — Buat Project Supabase (Gratis)
1. Buka [https://supabase.com](https://supabase.com) lalu masuk/daftar.
2. Klik tombol **"New Project"**, beri nama (misal: `momu-photobooth`) dan buat password database.
3. Tunggu sekitar 1-2 menit hingga project selesai dibuat.

### Langkah 2 — Jalankan SQL Schema
1. Di sidebar Supabase Dashboard, klik menu **SQL Editor**.
2. Buka file [`schema.sql`](schema.sql) dari folder ini, copy seluruh isinya.
3. Tempel di SQL Editor Supabase, lalu klik tombol **"Run"**.
   > *Tabel `bookings`, `transactions`, Row Level Security (RLS), dan Realtime akan langsung aktif.*

### Langkah 3 — Buat 1 Akun Bersama untuk Tim
1. Di sidebar Supabase Dashboard, klik menu **Authentication** → **Users**.
2. Klik tombol **"Add user"** → pilih **"Create user"**.
3. Masukkan:
   - **User Email**: misal `admin@momu.com` atau email studio kamu
   - **User Password**: password bersama (misal: `MomuStudio2026!`)
   - **Auto Confirm User?**: Pastikan dicentang / bernilai **Yes** (agar tidak perlu verifikasi email)
4. Klik **"Create user"**.
5. *(Opsional tapi Disarankan)*: Masuk ke **Authentication** → **Providers** → klik **Email** → matikan opsi **"Allow new users to sign up"** lalu Save. Ini memastikan orang luar yang menemukan link GitHub Pages kamu tidak bisa mendaftarkan akun baru.

### Langkah 4 — Hubungkan Kredensial ke Dashboard
1. Di Supabase Dashboard, klik icon gear **Settings** (kiri bawah) → **API**.
2. Salin:
   - **Project URL** (contoh: `https://xyzabcdefg.supabase.co`)
   - **anon public** key (token panjang diawali `eyJ...`)
3. Buka file [`supabase-config.js`](supabase-config.js) dan isi:
   ```javascript
   const SUPABASE_URL = 'https://xyzabcdefg.supabase.co';  // ← ganti
   const SUPABASE_ANON_KEY = 'eyJhbGciOi...';              // ← ganti
   ```
4. Simpan file.

### Langkah 5 — (Opsional) Pindahkan Data Lama ke Supabase
Jika sebelumnya kamu sudah punya data di localStorage browser:
1. Login ke dashboard di browser.
2. Tekan tombol `F12` di keyboard untuk membuka Developer Tools → tab **Console**.
3. Ketik perintah:
   ```javascript
   migrateLocalStorageToSupabase()
   ```
4. Tekan Enter. Semua data booking dan transaksi lokal akan otomatis diunggah ke database Supabase!

---

## 🛡️ Mengapa Ini Aman di GitHub Pages?

- **Tidak ada password di kode JavaScript**: Password disimpan dalam bentuk hash terenkripsi di server Supabase, bukan di file HTML/JS publik GitHub Pages.
- **Dilindungi Row Level Security (RLS)**: Meskipun URL GitHub Pages kamu diakses orang lain, Supabase akan menolak semua permintaan baca/tulis data jika mereka belum login.
- **Satu Akun Bersama**: Kamu cukup membuat 1 akun (misal `admin@momu.com`), lalu bagikan email & password tersebut ke anggota tim/operator photobooth yang bertugas.

---

## 📂 Struktur File

```
momu-dashboard/
├── index.html           # Halaman utama dashboard MOMU
├── login.html           # Halaman login aman (Supabase Auth)
├── app.js               # Logic dashboard & UI rendering
├── style.css            # Styling tambahan
├── supabase-config.js   # Konfigurasi URL & API Key Supabase (EDIT FILE INI)
├── supabase-db.js       # Layer database, mapper snake_case <-> camelCase & Realtime
├── schema.sql           # Query SQL untuk tabel, RLS, dan Realtime di Supabase
├── logo.png             # Logo MOMU Photobooth
├── buka_dashboard.bat   # Script 1-klik untuk membuka di browser lokal
├── jalankan_server.bat  # Script local server Python
└── README.md            # Dokumentasi panduan ini
```

---

## 🌐 Cara Menjalankan

### Cara 1: GitHub Pages (Online)
Push seluruh file ini ke repository GitHub kamu dan aktifkan **GitHub Pages** (Settings → Pages → Deploy from branch `main`).

### Cara 2: Di Komputer Lokal
Klik ganda file `buka_dashboard.bat` atau jalankan `jalankan_server.bat`.
