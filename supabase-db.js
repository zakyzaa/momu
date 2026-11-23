/**
 * MOMU Photobooth - Supabase Database Layer
 * Layer integrasi database Supabase (PostgreSQL) + Realtime Sync
 * Terhubung langsung dengan struktur data index.html
 */

// ============================================================
// DATA MAPPERS (PostgreSQL snake_case <-> JavaScript index.html)
// ============================================================

function rowToBooking(r) {
  if (!r) return null;
  const price = Number(r.price ?? r.total_fee ?? 0);
  const paid = Number(r.paid ?? r.deposit ?? 0);
  return {
    id: r.id,
    client: r.client ?? r.client_name ?? '',
    type: (r.type ?? r.event_type ?? 'Event').toLowerCase().includes('wedding') ? 'Wedding' : 'Event',
    date: r.date,
    timeStart: r.time_start ?? r.start_time ?? '12:00',
    timeEnd: r.time_end ?? r.end_time ?? '15:00',
    packageId: r.package_id ?? '',
    packageName: r.package_name ?? '',
    phone: r.phone ?? r.client_phone ?? '',
    location: r.location ?? r.venue ?? '',
    price: price,
    paid: paid,
    status: r.status ?? 'DP',
    crew: r.crew ?? '',
    notes: r.notes ?? ''
  };
}

function bookingToRow(b) {
  if (!b) return null;
  const price = Number(b.price ?? b.total_fee ?? b.totalFee ?? 0);
  const paid = Number(b.paid ?? b.deposit ?? 0);
  const remaining = Math.max(0, price - paid);
  return {
    id: b.id,
    client_name: b.client ?? b.client_name ?? b.clientName ?? '',
    client_phone: b.phone ?? b.client_phone ?? b.clientPhone ?? '',
    event_type: (b.type ?? b.event_type ?? b.eventType ?? 'Event').toLowerCase().includes('wedding') ? 'Wedding' : 'Event',
    package_name: b.packageName ?? b.package_name ?? '',
    date: b.date,
    start_time: b.timeStart ?? b.start_time ?? b.startTime ?? '12:00',
    end_time: b.timeEnd ?? b.end_time ?? b.endTime ?? '15:00',
    venue: b.location ?? b.venue ?? '',
    total_fee: price,
    deposit: paid,
    remaining: remaining,
    status: b.status ?? 'DP',
    crew: b.crew ?? '',
    notes: b.notes ?? ''
  };
}

function rowToTx(r) {
  if (!r) return null;
  const isIncome = (r.type === 'pemasukan' || r.type === 'INCOME');
  return {
    id: r.id,
    type: isIncome ? 'INCOME' : 'EXPENSE',
    category: r.category ?? '',
    desc: r.description ?? r.desc ?? '',
    amount: Number(r.amount ?? 0),
    date: r.date,
    method: r.method ?? ''
  };
}

function txToRow(t) {
  if (!t) return null;
  const rawType = (t.type || '').toUpperCase();
  const dbType = (rawType === 'INCOME' || rawType === 'PEMASUKAN') ? 'pemasukan' : 'pengeluaran';
  return {
    id: t.id,
    type: dbType,
    category: t.category ?? '',
    description: t.desc ?? t.description ?? '',
    amount: Number(t.amount ?? 0),
    date: t.date,
    method: t.method ?? ''
  };
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

async function updateTransactionDB(id, txData) {
  if (!window.supabaseClient) return null;
  const row = txToRow(txData);
  delete row.id;

  const { data, error } = await supabaseClient
    .from('transactions')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[Supabase] Gagal update transaksi:', error.message);
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
    .channel('realtime:bookings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      (payload) => {
        console.log('[Realtime] Bookings event:', payload.eventType);
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
    .channel('realtime:transactions')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions' },
      (payload) => {
        console.log('[Realtime] Transactions event:', payload.eventType);
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
// SYNC LOCAL DATA TO SUPABASE
// ============================================================

async function syncLocalToSupabase(bookingsList, financesList) {
  if (!window.supabaseClient || !isSupabaseConfigured()) return;
  const user = await getCurrentUser();
  if (!user) return;

  if (Array.isArray(bookingsList)) {
    for (const b of bookingsList) {
      const row = bookingToRow(b);
      row.user_id = user.id;
      const { error } = await supabaseClient.from('bookings').upsert(row, { onConflict: 'id' });
      if (error) console.warn('[Supabase Sync] Gagal booking:', error.message);
    }
  }

  if (Array.isArray(financesList)) {
    for (const f of financesList) {
      const row = txToRow(f);
      row.user_id = user.id;
      const { error } = await supabaseClient.from('transactions').upsert(row, { onConflict: 'id' });
      if (error) console.warn('[Supabase Sync] Gagal tx:', error.message);
    }
  }

  console.log('[Supabase Sync] Berhasil mengunggah data ke cloud database.');
}

window.fetchBookings = fetchBookings;
window.insertBooking = insertBooking;
window.updateBooking = updateBooking;
window.deleteBookingDB = deleteBookingDB;
window.fetchTransactions = fetchTransactions;
window.insertTransaction = insertTransaction;
window.updateTransactionDB = updateTransactionDB;
window.deleteTransactionDB = deleteTransactionDB;
window.subscribeBookings = subscribeBookings;
window.subscribeTransactions = subscribeTransactions;
window.unsubscribeAll = unsubscribeAll;
window.getCurrentUser = getCurrentUser;
window.signOut = signOut;
window.syncLocalToSupabase = syncLocalToSupabase;
