-- ============================================================
-- MOMU Photobooth Dashboard - Supabase SQL Schema & Permissions
-- 
-- CARA MENJALANKAN (HANYA BUTUH 1 KALI):
-- 1. Buka Supabase Dashboard (https://supabase.com)
-- 2. Buka menu "SQL Editor" (icon >_ di sebelah kiri)
-- 3. Klik tombol "New query"
-- 4. Copy-paste SELURUH isi file ini lalu klik "Run"
-- ============================================================

-- 1. Pastikan izin akses schema public aktif
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Buat tabel bookings jika belum ada
CREATE TABLE IF NOT EXISTS public.bookings (
  id            TEXT PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  client_name   TEXT,
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
  status        TEXT DEFAULT 'DP',
  crew          TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Buat tabel transactions jika belum ada
CREATE TABLE IF NOT EXISTS public.transactions (
  id          TEXT PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  type        TEXT NOT NULL,
  category    TEXT,
  description TEXT,
  amount      NUMERIC DEFAULT 0,
  date        DATE NOT NULL,
  method      TEXT,
  booking_id  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Buat tabel packages jika belum ada (Katalog Paket & Layanan)
CREATE TABLE IF NOT EXISTS public.packages (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  duration    TEXT,
  price       NUMERIC DEFAULT 0,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Pastikan kolom fleksibel & lengkap
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS package_id TEXT;
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- 6. KUNCI UTAMA: Berikan izin GRANT ke role anon & authenticated
GRANT ALL ON TABLE public.bookings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.transactions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.packages TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 7. Row Level Security (RLS) - Buka akses penuh untuk tabel studio MOMU
ALTER TABLE public.bookings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can manage own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow all access for authenticated" ON public.bookings;

CREATE POLICY "Public access to bookings"
  ON public.bookings
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow all access for authenticated" ON public.transactions;

CREATE POLICY "Public access to transactions"
  ON public.transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public access to packages" ON public.packages;
CREATE POLICY "Public access to packages"
  ON public.packages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. Realtime Synchronization (Aman untuk Supabase tanpa DROP)
ALTER TABLE public.bookings     REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.packages     REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'packages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;
  END IF;
END $$;

-- 9. Indeks pencarian cepat
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
