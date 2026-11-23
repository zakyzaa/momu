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

function rowToPackage(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name ?? '',
    duration: r.duration ?? '2 Jam Unlimited Print',
    price: Number(r.price ?? 0),
    desc: r.description ?? r.desc ?? ''
  };
}

function packageToRow(p) {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    duration: p.duration,
    price: Number(p.price || 0),
    description: p.desc ?? p.description ?? ''
  };
}

// ============================================================
// AUTH & LOGOUT HELPERS
// ============================================================

async function getSession() {
  if (!window.supabaseClient) return null;
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  } catch (e) {
    return null;
  }
}

async function getCurrentUser() {
  if (!window.supabaseClient) return null;
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  } catch (e) {
    return null;
  }
}

async function signOut() {
  if (window.supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  window.location.href = 'login.html';
}

async function handleLogout() {
  if (confirm('Yakin ingin keluar dari dashboard MOMU?')) {
    if (window.supabaseClient) {
      try {
        await supabaseClient.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    sessionStorage.clear();
    localStorage.removeItem('momu_auth_session');
    window.location.href = 'login.html';
  }
}
window.handleLogout = handleLogout;
window.signOut = signOut;

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
    if (typeof showToast === 'function') {
      showToast('⚠️ Gagal simpan booking ke cloud: ' + error.message);
    }
    return null;
  }
  console.log('[Supabase] Booking berhasil disimpan ke cloud:', data.id);
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
    if (typeof showToast === 'function') {
      showToast('⚠️ Gagal update booking ke cloud: ' + error.message);
    }
    return null;
  }
  console.log('[Supabase] Booking berhasil diupdate di cloud:', id);
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
    if (typeof showToast === 'function') {
      showToast('⚠️ Gagal hapus booking di cloud: ' + error.message);
    }
    return false;
  }
  console.log('[Supabase] Booking berhasil dihapus di cloud:', id);
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
    if (typeof showToast === 'function') {
      showToast('⚠️ Gagal simpan kas ke cloud: ' + error.message);
    }
    return null;
  }
  console.log('[Supabase] Transaksi kas tersimpan di cloud:', data.id);
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
    if (typeof showToast === 'function') {
      showToast('⚠️ Gagal update kas ke cloud: ' + error.message);
    }
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
    if (typeof showToast === 'function') {
      showToast('⚠️ Gagal hapus kas di cloud: ' + error.message);
    }
    return false;
  }
  return true;
}

// ============================================================
// PACKAGES - CRUD
// ============================================================

async function fetchPackages() {
  if (!window.supabaseClient) return [];
  try {
    const { data, error } = await supabaseClient
      .from('packages')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      console.warn('[Supabase] Gagal fetch packages:', error.message);
      return [];
    }
    return (data || []).map(rowToPackage);
  } catch (e) {
    return [];
  }
}

async function insertPackage(pkgData) {
  if (!window.supabaseClient) return null;
  try {
    const row = packageToRow(pkgData);
    const { data, error } = await supabaseClient
      .from('packages')
      .upsert([row], { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Gagal insert/upsert package:', error.message);
      return null;
    }
    console.log('[Supabase] Paket berhasil disimpan di cloud:', data.id);
    return rowToPackage(data);
  } catch (e) {
    return null;
  }
}

async function updatePackageDB(id, pkgData) {
  if (!window.supabaseClient) return null;
  try {
    const row = packageToRow(pkgData);
    delete row.id;

    const { data, error } = await supabaseClient
      .from('packages')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Gagal update package:', error.message);
      return null;
    }
    console.log('[Supabase] Paket berhasil diupdate di cloud:', id);
    return rowToPackage(data);
  } catch (e) {
    return null;
  }
}

async function deletePackageDB(id) {
  if (!window.supabaseClient) return false;
  try {
    const { error } = await supabaseClient
      .from('packages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase] Gagal hapus package:', error.message);
      return false;
    }
    console.log('[Supabase] Paket berhasil dihapus di cloud:', id);
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================================
// REALTIME SUBSCRIPTIONS
// ============================================================

let bookingsChannel = null;
let transactionsChannel = null;
let packagesChannel = null;

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
        console.log('[Realtime] Perubahan bookings diterima:', payload.eventType);
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
        console.log('[Realtime] Perubahan transaksi diterima:', payload.eventType);
        onChangeCallback(payload);
      }
    )
    .subscribe();

  return transactionsChannel;
}

function subscribePackages(onChangeCallback) {
  if (!window.supabaseClient) return null;
  if (packagesChannel) {
    supabaseClient.removeChannel(packagesChannel);
  }

  packagesChannel = supabaseClient
    .channel('realtime:packages')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'packages' },
      (payload) => {
        console.log('[Realtime] Perubahan paket diterima:', payload.eventType);
        onChangeCallback(payload);
      }
    )
    .subscribe();

  return packagesChannel;
}

function unsubscribeAll() {
  if (!window.supabaseClient) return;
  if (bookingsChannel) supabaseClient.removeChannel(bookingsChannel);
  if (transactionsChannel) supabaseClient.removeChannel(transactionsChannel);
  if (packagesChannel) supabaseClient.removeChannel(packagesChannel);
}

// ============================================================
// SYNC LOCAL DATA TO SUPABASE
// ============================================================

async function syncLocalToSupabase(bookingsList, financesList, packagesList) {
  if (!window.supabaseClient || !isSupabaseConfigured()) return;
  const user = await getCurrentUser();

  if (Array.isArray(bookingsList)) {
    for (const b of bookingsList) {
      const row = bookingToRow(b);
      if (user && user.id) row.user_id = user.id;
      const { error } = await supabaseClient.from('bookings').upsert(row, { onConflict: 'id' });
      if (error) console.warn('[Supabase Sync] Gagal booking:', error.message);
    }
  }

  if (Array.isArray(financesList)) {
    for (const f of financesList) {
      const row = txToRow(f);
      if (user && user.id) row.user_id = user.id;
      const { error } = await supabaseClient.from('transactions').upsert(row, { onConflict: 'id' });
      if (error) console.warn('[Supabase Sync] Gagal tx:', error.message);
    }
  }

  if (Array.isArray(packagesList)) {
    for (const p of packagesList) {
      const row = packageToRow(p);
      const { error } = await supabaseClient.from('packages').upsert(row, { onConflict: 'id' });
      if (error) console.warn('[Supabase Sync] Gagal package:', error.message);
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
window.fetchPackages = fetchPackages;
window.insertPackage = insertPackage;
window.updatePackageDB = updatePackageDB;
window.deletePackageDB = deletePackageDB;
window.subscribeBookings = subscribeBookings;
window.subscribeTransactions = subscribeTransactions;
window.subscribePackages = subscribePackages;
window.unsubscribeAll = unsubscribeAll;
window.getCurrentUser = getCurrentUser;
window.syncLocalToSupabase = syncLocalToSupabase;
