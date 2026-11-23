/**
 * MOMU Photobooth - Supabase Configuration
 */

// URL Project Supabase (Hanya domain root, tanpa /rest/v1/)
const RAW_SUPABASE_URL = 'https://szljmhgeqqvevrggtdyn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bGptaGdlcXF2ZXZyZ2d0ZHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU0NDk2MTMsImV4cCI6MjExMTAyNTYxM30.UwIuJgEoNiTIuOpH0R2Dbt_4juqXfRuj3eGrbXMpi-4';

// Helper sanitasi URL: otomatis bersihkan jika tidak sengaja tertulis /rest/v1/ atau garis miring di ujung
function cleanUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

const SUPABASE_URL = cleanUrl(RAW_SUPABASE_URL);

// Helper untuk mengecek apakah Supabase sudah dikonfigurasi
function isSupabaseConfigured() {
  return (
    typeof SUPABASE_URL === 'string' &&
    SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co' &&
    !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
    typeof SUPABASE_ANON_KEY === 'string' &&
    SUPABASE_ANON_KEY !== 'YOUR_ANON_PUBLIC_KEY' &&
    !SUPABASE_ANON_KEY.includes('YOUR_ANON')
  );
}

// Inisialisasi Supabase Client jika SDK tersedia
let supabaseClient = null;
if (typeof supabase !== 'undefined' && supabase.createClient) {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Ekspor ke window agar bisa diakses di semua script
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.supabaseClient = supabaseClient;
window.isSupabaseConfigured = isSupabaseConfigured;
