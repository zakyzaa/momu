/**
 * MOMU Photobooth - Supabase Database Layer
 * Layer integrasi database Supabase (PostgreSQL) + Realtime Sync
 */

// ============================================================
// DATA MAPPERS (PostgreSQL snake_case <-> JavaScript camelCase)
// ============================================================

function rowToBooking(r) {
  if (!r) return null;
  return {
    id: r.id,
    clientName: r.client_name ?? r.clientName ?? '',
    clientPhone: r.client_phone ?? r.clientPhone ?? '',
    eventType: r.event_type ?? r.eventType ?? 'Event',
    packageName: r.package_name ?? r.packageName ?? '',
    date: r.date,
    startTime: r.start_time ?? r.startTime ?? '12:00',
    endTime: r.end_time ?? r.endTime ?? '15:00',
    venue: r.venue ?? '',
    totalFee: Number(r.total_fee ?? r.totalFee ?? 0),
    deposit: Number(r.deposit ?? 0),
    remaining: Number(r.remaining ?? 0),
    status: r.status ?? 'Booked',
    crew: r.crew ?? '',
    notes: r.notes ?? '',
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString()
  };
}

function bookingToRow(b) {
  if (!b) return null;
  const row = {
    id: b.id,
    client_name: b.clientName ?? b.client_name,
    client_phone: b.clientPhone ?? b.client_phone ?? '',
    event_type: b.eventType ?? b.event_type ?? 'Event',
    package_name: b.packageName ?? b.package_name ?? '',
    date: b.date,
    start_time: b.startTime ?? b.start_time ?? '12:00',
    end_time: b.endTime ?? b.end_time ?? '15:00',
    venue: b.venue ?? '',
    total_fee: Number(b.totalFee ?? b.total_fee ?? 0),
    deposit: Number(b.deposit ?? 0),
    remaining: Number(b.remaining ?? 0),
    status: b.status ?? 'Booked',
    crew: b.crew ?? '',
    notes: b.notes ?? ''
  };
  if (b.createdAt || b.created_at) {
    row.created_at = b.createdAt || b.created_at;
  }
  return row;
}

function rowToTx(r) {
  if (!r) return null;
  return {
    id: r.id,
    type: r.type,
    category: r.category ?? '',
    description: r.description ?? '',
    amount: Number(r.amount ?? 0),
    date: r.date,
    method: r.method ?? '',
    bookingId: r.booking_id ?? r.bookingId ?? null,
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString()
  };
}

function txToRow(t) {
  if (!t) return null;
  const row = {
    id: t.id,
    type: t.type,
    category: t.category ?? '',
    description: t.description ?? '',
    amount: Number(t.amount ?? 0),
    date: t.date,
    method: t.method ?? '',
    booking_id: t.bookingId ?? t.booking_id ?? null
  };
  if (t.createdAt || t.created_at) {
    row.created_at = t.createdAt || t.created_at;
  }
  return row;
}

// ============================================================
// AUTH HELPERS
// ============================================================

async function getSession() {
  if (!window.supabaseClient) return null;
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session;
}

async function getCurrentUser() {
  if (!window.supabaseClient) return null;
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

async function signOut() {
  if (window.supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  window.location.href = 'login.html';
}

// ============================================================
// BOOKINGS - CRUD
// ============================================================

async function fetchBookings() {
  if (!window.supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('bookings')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('[Supabase] Gagal fetch bookings:', error.message);
    return [];
  }
  return (data || []).map(rowToBooking);
}

async function insertBooking(bookingData) {
  if (!window.supabaseClient) return null;
  const user = await getCurrentUser();
  const row = bookingToRow(bookingData);
  if (user && user.id) row.user_id = user.id;

  const { data, error } = await supabaseClient
    .from('bookings')
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Gagal insert booking:', error.message);
    return null;
  }
  return rowToBooking(data);
}

async function updateBooking(id, bookingData) {
  if (!window.supabaseClient) return null;
  const row = bookingToRow(bookingData);
  delete row.id;
  delete row.created_at;

  const { data, error } = await supabaseClient
    .from('bookings')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Gagal update booking:', error.message);
    return null;
  }
  return rowToBooking(data);
}

async function deleteBookingDB(id) {
  if (!window.supabaseClient) return false;
  const { error } = await supabaseClient
    .from('bookings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Gagal hapus booking:', error.message);
    return false;
  }
  return true;
}

// ============================================================
// TRANSACTIONS - CRUD
// ============================================================

async function fetchTransactions() {
  if (!window.supabaseClient) return [];
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('[Supabase] Gagal fetch transactions:', error.message);
    return [];
  }
  return (data || []).map(rowToTx);
}

async function insertTransaction(txData) {
  if (!window.supabaseClient) return null;
  const user = await getCurrentUser();
  const row = txToRow(txData);
  if (user && user.id) row.user_id = user.id;

  const { data, error } = await supabaseClient
    .from('transactions')
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Gagal insert transaksi:', error.message);
    return null;
  }
  return rowToTx(data);
}

async function deleteTransactionDB(id) {
  if (!window.supabaseClient) return false;
  const { error } = await supabaseClient
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase] Gagal hapus transaksi:', error.message);
    return false;
  }
  return true;
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================

let bookingsChannel = null;
let transactionsChannel = null;

function subscribeBookings(onChangeCallback) {
  if (!window.supabaseClient) return null;
  if (bookingsChannel) {
    supabaseClient.removeChannel(bookingsChannel);
  }

  bookingsChannel = supabaseClient
    .channel('public:bookings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      (payload) => {
        console.log('[Realtime] Bookings changed:', payload.eventType);
        onChangeCallback(payload);
      }
    )
    .subscribe();

  return bookingsChannel;
}

function subscribeTransactions(onChangeCallback) {
  if (!window.supabaseClient) return null;
  if (transactionsChannel) {
    supabaseClient.removeChannel(transactionsChannel);
  }

  transactionsChannel = supabaseClient
    .channel('public:transactions')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions' },
      (payload) => {
        console.log('[Realtime] Transactions changed:', payload.eventType);
        onChangeCallback(payload);
      }
    )
    .subscribe();

  return transactionsChannel;
}

function unsubscribeAll() {
  if (!window.supabaseClient) return;
  if (bookingsChannel) supabaseClient.removeChannel(bookingsChannel);
  if (transactionsChannel) supabaseClient.removeChannel(transactionsChannel);
}

// ============================================================
// MIGRATION HELPER: LocalStorage -> Supabase
// ============================================================

async function migrateLocalStorageToSupabase() {
  if (!window.supabaseClient || !isSupabaseConfigured()) {
    alert('Konfigurasi Supabase terlebih dahulu di supabase-config.js!');
    return;
  }

  const user = await getCurrentUser();
  if (!user) {
    alert('Harus login terlebih dahulu sebelum migrasi!');
    return;
  }

  const localBookings = localStorage.getItem('momu_photobooth_bookings_v2');
  const localTransactions = localStorage.getItem('momu_photobooth_transactions_v2');

  let migratedBookings = 0;
  let migratedTransactions = 0;

  if (localBookings) {
    try {
      const bData = JSON.parse(localBookings);
      for (const b of bData) {
        const row = bookingToRow(b);
        row.user_id = user.id;
        const { error } = await supabaseClient
          .from('bookings')
          .upsert(row, { onConflict: 'id' });
        if (!error) migratedBookings++;
        else console.warn('[Migrate] Gagal booking:', error);
      }
    } catch (e) {
      console.error('[Migrate] Format booking invalid:', e);
    }
  }

  if (localTransactions) {
    try {
      const tData = JSON.parse(localTransactions);
      for (const t of tData) {
        const row = txToRow(t);
        row.user_id = user.id;
        const { error } = await supabaseClient
          .from('transactions')
          .upsert(row, { onConflict: 'id' });
        if (!error) migratedTransactions++;
        else console.warn('[Migrate] Gagal tx:', error);
      }
    } catch (e) {
      console.error('[Migrate] Format transaksi invalid:', e);
    }
  }

  console.log(`✅ Migrasi selesai: ${migratedBookings} bookings, ${migratedTransactions} transaksi`);
  if (typeof showToast === 'function') {
    showToast(`Migrasi sukses: ${migratedBookings} agenda & ${migratedTransactions} transaksi disinkron ke Supabase!`);
  } else {
    alert(`Migrasi sukses: ${migratedBookings} agenda & ${migratedTransactions} transaksi disinkron ke Supabase!`);
  }
}

window.migrateLocalStorageToSupabase = migrateLocalStorageToSupabase;
window.fetchBookings = fetchBookings;
window.insertBooking = insertBooking;
window.updateBooking = updateBooking;
window.deleteBookingDB = deleteBookingDB;
window.fetchTransactions = fetchTransactions;
window.insertTransaction = insertTransaction;
window.deleteTransactionDB = deleteTransactionDB;
window.subscribeBookings = subscribeBookings;
window.subscribeTransactions = subscribeTransactions;
window.unsubscribeAll = unsubscribeAll;
window.getCurrentUser = getCurrentUser;
window.signOut = signOut;
