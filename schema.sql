-- ============================================================
-- MOMU Photobooth Dashboard - Supabase SQL Schema
-- 
-- CARA MENJALANKAN:
-- 1. Buka Supabase Dashboard (https://supabase.com)
-- 2. Pilih project kamu -> Buka "SQL Editor" di menu samping kiri
-- 3. Klik "New query", copy-paste seluruh isi file ini, lalu klik "Run"
-- ============================================================

-- ============================================================
-- 1. TABEL: bookings (Jadwal & Agenda Photobooth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id            TEXT PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  client_name   TEXT NOT NULL,
  client_phone  TEXT,
  event_type    TEXT DEFAULT 'Event',
  package_name  TEXT,
  date          DATE NOT NULL,
  start_time    TEXT DEFAULT '12:00',
  end_time      TEXT DEFAULT '15:00',
  venue         TEXT,
  total_fee     NUMERIC DEFAULT 0,
  deposit       NUMERIC DEFAULT 0,
  remaining     NUMERIC DEFAULT 0,
  status        TEXT DEFAULT 'Booked',
  crew          TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. TABEL: transactions (Pencatatan Kas Pemasukan & Pengeluaran)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id          TEXT PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  type        TEXT NOT NULL CHECK (type IN ('pemasukan', 'pengeluaran')),
  category    TEXT,
  description TEXT,
  amount      NUMERIC DEFAULT 0,
  date        DATE NOT NULL,
  method      TEXT,
  booking_id  TEXT REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- Hanya user yang berhasil login (authenticated) yang dapat
-- membaca dan mengubah data studio MOMU Photobooth.
-- Pengunjung publik di GitHub Pages tanpa login diblokir total!
-- ============================================================
ALTER TABLE public.bookings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Authenticated users can manage bookings"     ON public.bookings;
DROP POLICY IF EXISTS "Users can manage own bookings"              ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage own transactions"          ON public.transactions;

-- Buat policy baru: Semua user yang login (1 akun bersama studio) punya akses penuh
CREATE POLICY "Authenticated users can manage bookings"
  ON public.bookings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage transactions"
  ON public.transactions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. REALTIME: Aktifkan full replication & publikasi realtime
-- ============================================================
ALTER TABLE public.bookings     REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.bookings, public.transactions;
COMMIT;

-- ============================================================
-- 5. INDEXES untuk performa query cepat
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bookings_date        ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date    ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type    ON public.transactions(type);

-- ============================================================
-- 6. CARA MEMBUAT 1 AKUN BERSAMA DI SUPABASE DASHBOARD:
-- 
-- 1. Buka Supabase Dashboard -> Menu "Authentication" -> "Users"
-- 2. Klik tombol "Add user" -> "Create user"
-- 3. Isi:
--    - Email: misal "admin@momu.com" atau "momustudio@gmail.com"
--    - Password: buat password yang aman (misal: "MomuStudio2026!")
--    - Pastikan centang "Auto Confirm User?" bernilai YA (Checked)
-- 4. Klik "Create user"
-- 5. Selesai! Email dan password tersebut adalah 1 akses bersama
--    yang dibagikan ke tim studio MOMU untuk login di GitHub Pages.
-- ============================================================
