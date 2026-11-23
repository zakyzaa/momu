/**
 * MOMU Photobooth Dashboard
 * Core Application Logic & State Management
 */

// Storage Keys (tetap dipakai sebagai fallback offline)
const STORAGE_BOOKINGS_KEY = 'momu_photobooth_bookings_v2';
const STORAGE_TRANSACTIONS_KEY = 'momu_photobooth_transactions_v2';

// Flag: apakah Supabase tersedia/terkonfigurasi
function isSupabaseConfigured() {
  try {
    return (
      typeof supabaseClient !== 'undefined' &&
      SUPABASE_URL !== 'https://YOUR_PROJECT_ID.supabase.co'
    );
  } catch (e) {
    return false;
  }
}

// In-Memory State
let bookings = [];
let transactions = [];
let activeAgendaFilter = 'semua';
let activeAgendaView = 'cards'; // 'cards' | 'calendar'
let activeFinanceFilter = 'all'; // 'all' | 'pemasukan' | 'pengeluaran'
let calendarCurrentDate = new Date(2026, 10, 23); // Defaulting around current Nov 2026

// Chart Instances
let financialChartInstance = null;
let expenseChartInstance = null;

// Category Lists
const INCOME_CATEGORIES = [
  'DP Booking Photobooth',
  'Pelunasan Event Photobooth',
  'Self-Photo Studio',
  'Cetak Tambahan / Extra Prints',
  'Jual Frame / Merchandise',
  'Lain-lain'
];

const EXPENSE_CATEGORIES = [
  'Kertas Foto & Ribbon DNP',
  'Fee Crew & Operator',
  'Transport & Logistik Event',
  'Properti / Props & Backdrop',
  'Maintenance Alat & Kamera',
  'Promosi & Iklan',
  'Lain-lain'
];

// Sample Initial Data for MOMU
const SAMPLE_BOOKINGS = [
  {
    id: 'MOMU-B-101',
    clientName: 'Sarah & Dimas',
    clientPhone: '081234567890',
    eventType: 'Wedding',
    packageName: 'MOMU Wedding Premiere 3 Jam',
    date: '2026-11-25',
    startTime: '18:00',
    endTime: '21:00',
    venue: 'Grand Ballroom Hotel Santika, Jakarta',
    totalFee: 2800000,
    deposit: 1500000,
    remaining: 1300000,
    status: 'Booked',
    crew: 'Rian & Dita',
    notes: 'Tema Rustic Elegant. Strip 3 pose + custom monogram Sarah & Dimas.',
    createdAt: '2026-11-10T10:00:00.000Z'
  },
  {
    id: 'MOMU-B-102',
    clientName: 'Clarissa Sweet 17th',
    clientPhone: '085712348899',
    eventType: 'Event',
    packageName: 'Unlimited 2 Jam Event',
    date: '2026-11-28',
    startTime: '15:00',
    endTime: '17:00',
    venue: 'Sky Garden Cafe & Lounge',
    totalFee: 1950000,
    deposit: 1950000,
    remaining: 0,
    status: 'Lunas',
    crew: 'Bagas',
    notes: 'Backdrop Silver Glitter, frame bernuansa Lavender Disco.',
    createdAt: '2026-11-12T14:30:00.000Z'
  },
  {
    id: 'MOMU-B-103',
    clientName: 'PT Mega Inovasi Nusantara',
    clientPhone: '082199887766',
    eventType: 'Event',
    packageName: 'Unlimited 3 Jam Event',
    date: '2026-12-05',
    startTime: '10:00',
    endTime: '13:00',
    venue: 'Auditorium Menara Mandiri Lt. 8',
    totalFee: 2500000,
    deposit: 1000000,
    remaining: 1500000,
    status: 'Booked',
    crew: 'Rian, Bagas & Tika',
    notes: 'Gathering Akhir Tahun. Frame wajib sertakan logo korporat & QR Drive.',
    createdAt: '2026-11-18T09:15:00.000Z'
  },
  {
    id: 'MOMU-B-104',
    clientName: 'Nadia & Kevin (Graduation)',
    clientPhone: '081344556677',
    eventType: 'Event',
    packageName: 'MOMU Basic Studio 30m',
    date: '2026-11-20',
    startTime: '14:00',
    endTime: '14:30',
    venue: 'MOMU Studio Room A',
    totalFee: 150000,
    deposit: 150000,
    remaining: 0,
    status: 'Selesai',
    crew: 'Dita',
    notes: 'Sesi foto kelulusan santai, add on cetak 2 lembar.',
    createdAt: '2026-11-19T11:00:00.000Z'
  }
];

const SAMPLE_TRANSACTIONS = [
  {
    id: 'TX-1001',
    type: 'pemasukan',
    category: 'DP Booking Photobooth',
    description: 'DP Wedding Sarah & Dimas (Event 25 Nov)',
    amount: 1500000,
    date: '2026-11-10',
    method: 'Transfer Bank BCA',
    bookingId: 'MOMU-B-101',
    createdAt: '2026-11-10T10:05:00.000Z'
  },
  {
    id: 'TX-1002',
    type: 'pengeluaran',
    category: 'Kertas Foto & Ribbon DNP',
    description: 'Beli 1 Roll Paper DNP RX1HS (700 lembar)',
    amount: 980000,
    date: '2026-11-11',
    method: 'Transfer Bank BCA',
    bookingId: null,
    createdAt: '2026-11-11T13:20:00.000Z'
  },
  {
    id: 'TX-1003',
    type: 'pemasukan',
    category: 'Pelunasan Event Photobooth',
    description: 'Pelunasan Penuh Clarissa Sweet 17th',
    amount: 1950000,
    date: '2026-11-12',
    method: 'QRIS',
    bookingId: 'MOMU-B-102',
    createdAt: '2026-11-12T14:35:00.000Z'
  },
  {
    id: 'TX-1004',
    type: 'pengeluaran',
    category: 'Properti / Props & Backdrop',
    description: 'Beli Fun Glasses, Bando Karakter, & Props Kayu',
    amount: 250000,
    date: '2026-11-14',
    method: 'Transfer Bank BCA',
    bookingId: null,
    createdAt: '2026-11-14T16:00:00.000Z'
  },
  {
    id: 'TX-1005',
    type: 'pemasukan',
    category: 'DP Booking Photobooth',
    description: 'DP PT Mega Inovasi Gathering (Event 5 Des)',
    amount: 1000000,
    date: '2026-11-18',
    method: 'Transfer Bank BCA',
    bookingId: 'MOMU-B-103',
    createdAt: '2026-11-18T09:20:00.000Z'
  },
  {
    id: 'TX-1006',
    type: 'pemasukan',
    category: 'Self-Photo Studio',
    description: 'Sesi Foto Wisuda Nadia & Kevin',
    amount: 150000,
    date: '2026-11-20',
    method: 'QRIS',
    bookingId: 'MOMU-B-104',
    createdAt: '2026-11-20T14:35:00.000Z'
  },
  {
    id: 'TX-1007',
    type: 'pengeluaran',
    category: 'Fee Crew & Operator',
    description: 'Uang Saku & Fee Operator Nadia Studio (Dita)',
    amount: 75000,
    date: '2026-11-20',
    method: 'Tunai / Cash',
    bookingId: null,
    createdAt: '2026-11-20T15:00:00.000Z'
  }
];

// Helper: Format to Indonesian Currency (Rupiah)
function formatRupiah(num) {
  if (isNaN(num)) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
}

// Helper: Format Date String to Readable Indonesian Date
function formatDateIndo(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const day = parseInt(parts[2], 10);
  const month = months[parseInt(parts[1], 10) - 1];
  const year = parts[0];
  return `${day} ${month} ${year}`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${parseInt(parts[2], 10)} ${shortMonths[parseInt(parts[1], 10) - 1]}`;
}

// Helper: Calculate Day Badge
function getRelativeDayBadge(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `<span class="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">HARI INI</span>`;
  } else if (diffDays === 1) {
    return `<span class="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">BESOK</span>`;
  } else if (diffDays > 1 && diffDays <= 7) {
    return `<span class="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full">${diffDays} hari lagi</span>`;
  } else if (diffDays > 7) {
    return `<span class="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">Mendatang</span>`;
  } else {
    return `<span class="bg-slate-100 text-slate-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">Sudah lewat</span>`;
  }
}

// Show Toast
function showToast(message, icon = 'check-circle') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMessage');
  toastMsg.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 2800);
}

// Init Load dari Supabase atau LocalStorage (fallback)
async function loadData() {
  if (isSupabaseConfigured()) {
    try {
      bookings     = await fetchBookings();
      transactions = await fetchTransactions();

      // Normalize event types
      bookings.forEach(b => {
        if (b.eventType && b.eventType.toLowerCase().includes('wedding')) {
          b.eventType = 'Wedding';
        } else {
          b.eventType = 'Event';
        }
      });

      console.log(`[Supabase] Loaded ${bookings.length} bookings, ${transactions.length} transactions`);
      return;
    } catch (err) {
      console.warn('[Supabase] Gagal load data, fallback ke localStorage:', err);
    }
  }

  // Fallback: LocalStorage
  const localBookings = localStorage.getItem(STORAGE_BOOKINGS_KEY);
  const localTransactions = localStorage.getItem(STORAGE_TRANSACTIONS_KEY);

  if (localBookings) {
    try {
      bookings = JSON.parse(localBookings);
    } catch (e) {
      bookings = [...SAMPLE_BOOKINGS];
    }
  } else {
    bookings = [...SAMPLE_BOOKINGS];
    saveBookings();
  }

  if (Array.isArray(bookings)) {
    let changed = false;
    bookings.forEach(b => {
      const orig = b.eventType;
      if (b.eventType && b.eventType.toLowerCase().includes('wedding')) {
        b.eventType = 'Wedding';
      } else {
        b.eventType = 'Event';
      }
      if (b.eventType !== orig) changed = true;
    });
    if (changed) saveBookings();
  }

  if (localTransactions) {
    try {
      transactions = JSON.parse(localTransactions);
    } catch (e) {
      transactions = [...SAMPLE_TRANSACTIONS];
    }
  } else {
    transactions = [...SAMPLE_TRANSACTIONS];
    saveTransactions();
  }
}

function saveBookings() {
  if (!isSupabaseConfigured()) {
    localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
  }
  // Supabase: save dilakukan per-operasi (insert/update/delete) di handler masing-masing
}

function saveTransactions() {
  if (!isSupabaseConfigured()) {
    localStorage.setItem(STORAGE_TRANSACTIONS_KEY, JSON.stringify(transactions));
  }
}

// Switch Active Tab
function switchTab(tabId) {
  const tabs = ['overview', 'agenda', 'finance', 'packages'];
  tabs.forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    const navBtn = document.getElementById(`nav-${t}`);
    if (el) {
      if (t === tabId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
    if (navBtn) {
      if (t === tabId) {
        navBtn.className = 'nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-rose-50 text-rose-600 shadow-sm shadow-rose-100';
      } else {
        navBtn.className = 'nav-btn w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/50 transition-all';
      }
    }
  });

  const pageTitle = document.getElementById('pageTitle');
  if (tabId === 'overview') {
    pageTitle.textContent = 'Beranda & Ringkasan MOMU';
    renderOverview();
  } else if (tabId === 'agenda') {
    pageTitle.textContent = 'Jadwal & Agenda Photobooth';
    renderAgenda();
  } else if (tabId === 'finance') {
    pageTitle.textContent = 'Catatan Keuangan & Arus Kas';
    renderFinance();
  } else if (tabId === 'packages') {
    pageTitle.textContent = 'Katalog Paket & Layanan MOMU';
  }

  lucide.createIcons();
}

// Toggle Mobile Menu
function toggleMobileMenu() {
  const drawer = document.getElementById('mobileDrawer');
  drawer.classList.toggle('hidden');
}

document.getElementById('mobileMenuBtn')?.addEventListener('click', toggleMobileMenu);
document.getElementById('closeDrawerBtn')?.addEventListener('click', toggleMobileMenu);

// ================= OVERVIEW CALCULATIONS & RENDERING =================
function renderOverview() {
  // Total Income
  const totalIncome = transactions
    .filter(t => t.type === 'pemasukan')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Total Expense
  const totalExpense = transactions
    .filter(t => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netProfit = totalIncome - totalExpense;

  // Active bookings (Booked or Lunas)
  const activeBookings = bookings.filter(b => b.status === 'Booked' || b.status === 'Lunas');
  const pendingPaymentBookings = bookings.filter(b => Number(b.remaining) > 0 && b.status !== 'Batal');

  // Update DOM metrics
  document.getElementById('statIncome').textContent = formatRupiah(totalIncome);
  document.getElementById('statExpense').textContent = formatRupiah(totalExpense);
  document.getElementById('statProfit').textContent = formatRupiah(netProfit);
  document.getElementById('sidebarBalance').textContent = formatRupiah(netProfit);

  const profitBadge = document.getElementById('statProfitBadge');
  if (netProfit >= 0) {
    profitBadge.className = 'flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-semibold';
    profitBadge.innerHTML = `<i data-lucide="trending-up" class="w-3.5 h-3.5"></i> <span>Arus Kas Surplus</span>`;
  } else {
    profitBadge.className = 'flex items-center gap-1.5 mt-2 text-[11px] text-rose-600 font-semibold';
    profitBadge.innerHTML = `<i data-lucide="alert-triangle" class="w-3.5 h-3.5"></i> <span>Arus Kas Defisit</span>`;
  }

  document.getElementById('statActiveBookings').textContent = activeBookings.length;
  document.getElementById('statPendingPayment').textContent = `${pendingPaymentBookings.length} event`;
  document.getElementById('badgeUpcomingCount').textContent = activeBookings.length;

  // Render Quick Upcoming List (sort by date ascending)
  const upcomingSorted = [...bookings]
    .filter(b => b.status !== 'Selesai' && b.status !== 'Batal')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 4);

  const quickUpcomingContainer = document.getElementById('quickUpcomingList');
  if (upcomingSorted.length === 0) {
    quickUpcomingContainer.innerHTML = `
      <div class="text-center py-6 text-slate-400 text-xs">
        Belum ada jadwal photobooth mendatang.
        <br><button onclick="openBookingModal()" class="text-rose-500 font-bold mt-2">+ Buat Jadwal Baru</button>
      </div>
    `;
  } else {
    quickUpcomingContainer.innerHTML = upcomingSorted.map(b => `
      <div class="p-3 rounded-xl border border-slate-100 hover:border-rose-200 bg-slate-50/50 hover:bg-white transition flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <span class="font-bold text-slate-900 text-xs truncate">${b.clientName}</span>
            ${getRelativeDayBadge(b.date)}
          </div>
          <div class="text-[11px] text-slate-500 flex items-center gap-2">
            <span><i data-lucide="calendar" class="w-3 h-3 inline text-slate-400"></i> ${formatDateShort(b.date)}</span>
            <span>•</span>
            <span class="truncate"><i data-lucide="map-pin" class="w-3 h-3 inline text-slate-400"></i> ${b.venue}</span>
          </div>
        </div>
        <button onclick="viewInvoice('${b.id}')" class="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg whitespace-nowrap">
          Resi
        </button>
      </div>
    `).join('');
  }

  // Render Quick Transactions (Recent 5)
  const recentTx = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const quickTxContainer = document.getElementById('quickTransactionTable');
  if (recentTx.length === 0) {
    quickTxContainer.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4 text-slate-400">Belum ada transaksi tercatat.</td>
      </tr>
    `;
  } else {
    quickTxContainer.innerHTML = recentTx.map(t => {
      const isIncome = t.type === 'pemasukan';
      return `
        <tr class="hover:bg-slate-50">
          <td class="py-2.5 font-medium text-slate-500">${formatDateShort(t.date)}</td>
          <td class="py-2.5">
            <div class="font-bold text-slate-800">${t.description}</div>
            <div class="text-[10px] text-slate-400">${t.method || 'Transfer'}</div>
          </td>
          <td class="py-2.5">
            <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
              ${t.category}
            </span>
          </td>
          <td class="py-2.5 text-right font-extrabold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}">
            ${isIncome ? '+' : '-'} ${formatRupiah(t.amount)}
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render Charts
  initOrUpdateCharts();
  lucide.createIcons();
}

// Chart.js Setup
function initOrUpdateCharts() {
  const months = ['Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov'];
  const incomeData = [2400000, 3100000, 4200000, 3800000, 4900000, 6400000];
  const expenseData = [900000, 1100000, 1400000, 1250000, 1600000, 1850000];

  // Financial Trend Bar/Line Chart
  const ctxFinancial = document.getElementById('financialChart');
  if (ctxFinancial) {
    if (financialChartInstance) {
      financialChartInstance.destroy();
    }
    financialChartInstance = new Chart(ctxFinancial, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Pemasukan (Rp)',
            data: incomeData,
            backgroundColor: '#10b981',
            borderRadius: 6,
            barThickness: 16
          },
          {
            label: 'Pengeluaran (Rp)',
            data: expenseData,
            backgroundColor: '#f43f5e',
            borderRadius: 6,
            barThickness: 16
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { size: 11, family: 'Plus Jakarta Sans', weight: 'bold' }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${formatRupiah(context.raw)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11, family: 'Plus Jakarta Sans' } }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { size: 10, family: 'Plus Jakarta Sans' },
              callback: value => 'Rp ' + (value / 1000000).toFixed(1) + ' jt'
            }
          }
        }
      }
    });
  }

  // Expense Category Doughnut Chart
  const ctxExpense = document.getElementById('expenseChart');
  if (ctxExpense) {
    if (expenseChartInstance) {
      expenseChartInstance.destroy();
    }

    // Aggregate expenses by category
    const expTotals = {};
    transactions
      .filter(t => t.type === 'pengeluaran')
      .forEach(t => {
        expTotals[t.category] = (expTotals[t.category] || 0) + Number(t.amount);
      });

    const categories = Object.keys(expTotals);
    const amounts = Object.values(expTotals);

    const bgColors = ['#f43f5e', '#fb7185', '#6366f1', '#f59e0b', '#10b981', '#94a3b8'];

    expenseChartInstance = new Chart(ctxExpense, {
      type: 'doughnut',
      data: {
        labels: categories.length ? categories : ['Belum Ada Pengeluaran'],
        datasets: [{
          data: amounts.length ? amounts : [1],
          backgroundColor: bgColors.slice(0, categories.length || 1),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` ${context.label}: ${formatRupiah(context.raw)}`;
              }
            }
          }
        }
      }
    });
  }
}

// ================= AGENDA & JADWAL LOGIC =================
function renderAgenda() {
  updateAgendaCounts();
  if (activeAgendaView === 'cards') {
    renderAgendaList();
  } else {
    renderCalendar();
  }
}

function updateAgendaCounts() {
  const allCount = bookings.length;
  const dpCount = bookings.filter(b => b.status === 'Booked').length;
  const lunasCount = bookings.filter(b => b.status === 'Lunas').length;
  const selesaiCount = bookings.filter(b => b.status === 'Selesai').length;

  document.getElementById('count-all-agenda').textContent = allCount;
  document.getElementById('count-dp-agenda').textContent = dpCount;
  document.getElementById('count-lunas-agenda').textContent = lunasCount;
  document.getElementById('count-selesai-agenda').textContent = selesaiCount;
}

function setAgendaFilter(filter) {
  activeAgendaFilter = filter;
  const buttons = document.querySelectorAll('.agenda-filter-btn');
  buttons.forEach(btn => {
    btn.className = 'agenda-filter-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100';
  });

  const activeBtn = document.getElementById(`filter-agenda-${filter}`);
  if (activeBtn) {
    activeBtn.className = 'agenda-filter-btn px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200';
  }

  renderAgendaList();
}

function setAgendaViewMode(mode) {
  activeAgendaView = mode;
  const cardsContainer = document.getElementById('agendaCardsView');
  const calendarContainer = document.getElementById('agendaCalendarView');
  const cardsBtn = document.getElementById('viewModeCardsBtn');
  const calendarBtn = document.getElementById('viewModeCalendarBtn');

  if (mode === 'cards') {
    cardsContainer.classList.remove('hidden');
    calendarContainer.classList.add('hidden');
    cardsBtn.className = 'p-1.5 rounded-lg text-slate-800 bg-white shadow-xs';
    calendarBtn.className = 'p-1.5 rounded-lg text-slate-400 hover:text-slate-800';
    renderAgendaList();
  } else {
    cardsContainer.classList.add('hidden');
    calendarContainer.classList.remove('hidden');
    calendarBtn.className = 'p-1.5 rounded-lg text-slate-800 bg-white shadow-xs';
    cardsBtn.className = 'p-1.5 rounded-lg text-slate-400 hover:text-slate-800';
    renderCalendar();
  }
}

function renderAgendaList() {
  const container = document.getElementById('agendaCardsView');
  const searchQuery = (document.getElementById('searchAgendaInput')?.value || '').toLowerCase();

  let filtered = bookings.filter(b => {
    if (activeAgendaFilter !== 'semua' && b.status !== activeAgendaFilter) {
      return false;
    }
    if (searchQuery) {
      const matchClient = b.clientName.toLowerCase().includes(searchQuery);
      const matchVenue = b.venue.toLowerCase().includes(searchQuery);
      const matchPackage = b.packageName.toLowerCase().includes(searchQuery);
      return matchClient || matchVenue || matchPackage;
    }
    return true;
  });

  // Sort: upcoming events first
  filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-8">
        <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
          <i data-lucide="calendar-x" class="w-6 h-6"></i>
        </div>
        <h4 class="font-bold text-slate-800 text-sm">Tidak ada jadwal yang sesuai filter</h4>
        <p class="text-xs text-slate-400 mt-1 mb-4">Coba sesuaikan pencarian atau tambahkan agenda baru.</p>
        <button onclick="openBookingModal()" class="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-sm">
          + Tambah Jadwal Photobooth
        </button>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(b => {
    let statusBadgeClass = 'badge-dp';
    let statusText = 'Booked / DP';
    if (b.status === 'Lunas') {
      statusBadgeClass = 'badge-lunas';
      statusText = 'Lunas';
    } else if (b.status === 'Selesai') {
      statusBadgeClass = 'badge-selesai';
      statusText = 'Selesai';
    } else if (b.status === 'Batal') {
      statusBadgeClass = 'badge-batal';
      statusText = 'Dibatalkan';
    }

    const hasRemaining = Number(b.remaining) > 0;
    const cleanPhone = b.clientPhone ? b.clientPhone.replace(/^0/, '62').replace(/[^0-9]/g, '') : '';

    return `
      <div class="card-soft bg-white p-5 flex flex-col justify-between border-t-4 ${b.status === 'Lunas' ? 'border-t-emerald-500' : (b.status === 'Selesai' ? 'border-t-indigo-500' : 'border-t-rose-500')}">
        <div>
          <!-- Header Card -->
          <div class="flex items-start justify-between gap-2 mb-2">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">${b.eventType}</span>
              <h4 class="text-base font-black text-slate-900 leading-tight">${b.clientName}</h4>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="badge ${statusBadgeClass}">${statusText}</span>
              ${getRelativeDayBadge(b.date)}
            </div>
          </div>

          <!-- Time & Venue -->
          <div class="space-y-1.5 py-2.5 my-2 border-y border-slate-100 text-xs text-slate-600">
            <div class="flex items-center gap-2">
              <i data-lucide="calendar" class="w-4 h-4 text-rose-500 shrink-0"></i>
              <span class="font-bold text-slate-800">${formatDateIndo(b.date)}</span>
            </div>
            <div class="flex items-center gap-2">
              <i data-lucide="clock" class="w-4 h-4 text-slate-400 shrink-0"></i>
              <span>${b.startTime || '12:00'} - ${b.endTime || '15:00'} WIB</span>
            </div>
            <div class="flex items-start gap-2">
              <i data-lucide="map-pin" class="w-4 h-4 text-slate-400 shrink-0 mt-0.5"></i>
              <span class="truncate">${b.venue}</span>
            </div>
            <div class="flex items-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4 text-amber-500 shrink-0"></i>
              <span class="font-semibold text-slate-700">${b.packageName}</span>
            </div>
          </div>

          <!-- Payment Info Box -->
          <div class="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
            <div class="flex justify-between text-slate-500">
              <span>Total Paket:</span>
              <span class="font-bold text-slate-800">${formatRupiah(b.totalFee)}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>DP / Terbayar:</span>
              <span class="font-semibold text-emerald-600">${formatRupiah(b.deposit)}</span>
            </div>
            ${hasRemaining ? `
              <div class="flex justify-between font-bold text-rose-600 pt-1 border-t border-slate-200">
                <span>Sisa Tagihan:</span>
                <span>${formatRupiah(b.remaining)}</span>
              </div>
            ` : `
              <div class="flex justify-between font-bold text-emerald-600 pt-1 border-t border-slate-200">
                <span>Status Pembayaran:</span>
                <span>Lunas Penuh</span>
              </div>
            `}
          </div>

          <!-- Crew & Notes -->
          ${b.crew ? `
            <div class="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
              <i data-lucide="users" class="w-3.5 h-3.5 text-slate-400"></i>
              <span>Crew: <b class="text-slate-700">${b.crew}</b></span>
            </div>
          ` : ''}

          ${b.notes ? `
            <div class="text-[11px] text-slate-400 mt-1 italic truncate">
              "${b.notes}"
            </div>
          ` : ''}
        </div>

        <!-- Action Footer -->
        <div class="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-1">
          <div class="flex items-center gap-1">
            ${cleanPhone ? `
              <a href="https://wa.me/${cleanPhone}?text=Halo%20Kak%20${encodeURIComponent(b.clientName)},%20kami%20dari%20MOMU%20Photobooth%20ingin%20konfirmasi%20jadwal%20event%20pada%20tanggal%20${b.date}." target="_blank" class="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs" title="Chat WhatsApp">
                <i data-lucide="message-circle" class="w-4 h-4"></i>
              </a>
            ` : ''}
            <button onclick="viewInvoice('${b.id}')" class="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1" title="Lihat Tanda Terima / Resi">
              <i data-lucide="receipt" class="w-3.5 h-3.5"></i> Resi
            </button>
          </div>

          <div class="flex items-center gap-1">
            ${b.status !== 'Selesai' ? `
              <button onclick="markBookingDone('${b.id}')" class="p-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs" title="Tandai Selesai">
                <i data-lucide="check" class="w-4 h-4"></i>
              </button>
            ` : ''}
            <button onclick="editBooking('${b.id}')" class="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs" title="Edit Booking">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button onclick="deleteBooking('${b.id}')" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs" title="Hapus Agenda">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

// ================= INTERACTIVE CALENDAR LOGIC =================
function renderCalendar() {
  const container = document.getElementById('calendarCellsContainer');
  const monthYearLabel = document.getElementById('calendarMonthYear');

  const year = calendarCurrentDate.getFullYear();
  const month = calendarCurrentDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  monthYearLabel.textContent = `${monthNames[month]} ${year}`;

  // First day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in month
  const totalDays = new Date(year, month + 1, 0).getDate();
  // Total days in prev month
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  let html = '';

  // Prev month filler cells
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    html += `<div class="calendar-day-cell other-month"><span class="text-xs font-bold text-slate-300">${d}</span></div>`;
  }

  // Current month cells
  const today = new Date();
  const isCurrentYearMonth = today.getFullYear() === year && today.getMonth() === month;

  for (let day = 1; day <= totalDays; day++) {
    const formattedDay = day < 10 ? '0' + day : '' + day;
    const formattedMonth = (month + 1) < 10 ? '0' + (month + 1) : '' + (month + 1);
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    const isToday = isCurrentYearMonth && today.getDate() === day;
    const dayBookings = bookings.filter(b => b.date === dateStr);

    html += `
      <div class="calendar-day-cell ${isToday ? 'today' : ''} cursor-pointer" onclick="openDateAgendaModal('${dateStr}')">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold ${isToday ? 'text-rose-600 font-black' : 'text-slate-700'}">${day}</span>
          ${dayBookings.length > 0 ? `<span class="w-2 h-2 rounded-full bg-rose-500"></span>` : ''}
        </div>
        <div class="space-y-1 overflow-hidden">
          ${dayBookings.map(b => `
            <div class="text-[10px] truncate px-1.5 py-0.5 rounded font-bold ${b.status === 'Lunas' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
              ${b.clientName}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Next month filler cells to complete grid (up to multiple of 7)
  const totalCellsSoFar = firstDayIndex + totalDays;
  const remainingCells = (7 - (totalCellsSoFar % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    html += `<div class="calendar-day-cell other-month"><span class="text-xs font-bold text-slate-300">${i}</span></div>`;
  }

  container.innerHTML = html;
  lucide.createIcons();
}

function changeCalendarMonth(delta) {
  calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + delta);
  renderCalendar();
}

function resetCalendarToCurrent() {
  calendarCurrentDate = new Date();
  renderCalendar();
}

function openDateAgendaModal(dateStr) {
  const eventsOnDate = bookings.filter(b => b.date === dateStr);
  if (eventsOnDate.length === 0) {
    if (confirm(`Belum ada agenda di tanggal ${formatDateIndo(dateStr)}. Ingin jadwalkan booking baru?`)) {
      openBookingModal();
      document.getElementById('bookingDate').value = dateStr;
    }
  } else {
    // Switch to cards and search for this date
    setAgendaViewMode('cards');
    document.getElementById('searchAgendaInput').value = eventsOnDate[0].clientName;
    renderAgendaList();
  }
}

// ================= BOOKING MODAL ACTIONS =================
function calculateBalance() {
  const total = Number(document.getElementById('bookingTotalFee').value || 0);
  const deposit = Number(document.getElementById('bookingDeposit').value || 0);
  const remaining = Math.max(0, total - deposit);
  document.getElementById('bookingRemaining').value = formatRupiah(remaining);

  const statusSelect = document.getElementById('bookingStatus');
  if (deposit >= total && total > 0) {
    statusSelect.value = 'Lunas';
  } else if (deposit > 0) {
    statusSelect.value = 'Booked';
  }
}

function openBookingModal(editId = null) {
  const form = document.getElementById('bookingForm');
  form.reset();

  const titleEl = document.getElementById('bookingModalTitle');
  const syncContainer = document.getElementById('autoFinanceCheckboxContainer');

  if (editId) {
    const item = bookings.find(b => b.id === editId);
    if (!item) return;

    titleEl.textContent = 'Edit Agenda Photobooth';
    document.getElementById('bookingId').value = item.id;
    document.getElementById('bookingClientName').value = item.clientName;
    document.getElementById('bookingClientPhone').value = item.clientPhone;
    document.getElementById('bookingEventType').value = item.eventType;
    document.getElementById('bookingPackageName').value = item.packageName;
    document.getElementById('bookingDate').value = item.date;
    document.getElementById('bookingStartTime').value = item.startTime;
    document.getElementById('bookingEndTime').value = item.endTime;
    document.getElementById('bookingVenue').value = item.venue;
    document.getElementById('bookingTotalFee').value = item.totalFee;
    document.getElementById('bookingDeposit').value = item.deposit;
    document.getElementById('bookingRemaining').value = formatRupiah(item.remaining);
    document.getElementById('bookingStatus').value = item.status;
    document.getElementById('bookingCrew').value = item.crew || '';
    document.getElementById('bookingNotes').value = item.notes || '';

    // Hide auto-sync when editing existing booking
    syncContainer.classList.add('hidden');
  } else {
    titleEl.textContent = 'Tambah Agenda Photobooth';
    document.getElementById('bookingId').value = '';
    // default date today or tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('bookingDate').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('bookingRemaining').value = 'Rp 0';
    syncContainer.classList.remove('hidden');
  }

  document.getElementById('bookingModal').classList.remove('hidden');
  lucide.createIcons();
}

function openBookingWithPackage(packageName, price) {
  openBookingModal();
  document.getElementById('bookingPackageName').value = packageName;
  document.getElementById('bookingTotalFee').value = price;
  calculateBalance();
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.add('hidden');
}

async function handleSaveBooking(e) {
  e.preventDefault();

  const id = document.getElementById('bookingId').value;
  const clientName = document.getElementById('bookingClientName').value.trim();
  const clientPhone = document.getElementById('bookingClientPhone').value.trim();
  const eventType = document.getElementById('bookingEventType').value;
  const packageName = document.getElementById('bookingPackageName').value.trim();
  const date = document.getElementById('bookingDate').value;
  const startTime = document.getElementById('bookingStartTime').value;
  const endTime = document.getElementById('bookingEndTime').value;
  const venue = document.getElementById('bookingVenue').value.trim();
  const totalFee = Number(document.getElementById('bookingTotalFee').value || 0);
  const deposit = Number(document.getElementById('bookingDeposit').value || 0);
  const remaining = Math.max(0, totalFee - deposit);
  const status = document.getElementById('bookingStatus').value;
  const crew = document.getElementById('bookingCrew').value.trim();
  const notes = document.getElementById('bookingNotes').value.trim();
  const syncToFinance = document.getElementById('syncToFinance').checked;

  const bookingPayload = {
    clientName, clientPhone, eventType, packageName,
    date, startTime, endTime, venue, totalFee, deposit, remaining,
    status, crew, notes
  };

  if (id) {
    // Edit existing
    if (isSupabaseConfigured()) {
      const updated = await updateBooking(id, bookingPayload);
      if (updated) {
        const index = bookings.findIndex(b => b.id === id);
        if (index !== -1) bookings[index] = { ...bookings[index], ...bookingPayload };
      }
    } else {
      const index = bookings.findIndex(b => b.id === id);
      if (index !== -1) bookings[index] = { ...bookings[index], ...bookingPayload };
      saveBookings();
    }
    showToast('Jadwal booking berhasil diperbarui!');
  } else {
    // Create new
    const newId = 'MOMU-B-' + Math.floor(1000 + Math.random() * 9000);
    const newBooking = {
      id: newId, ...bookingPayload,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      const inserted = await insertBooking(newBooking);
      if (inserted) bookings.push(inserted);
      else bookings.push(newBooking);
    } else {
      bookings.push(newBooking);
      saveBookings();
    }

    // Auto record DP/Payment in finances
    if (syncToFinance && deposit > 0) {
      const newTx = {
        id: 'TX-' + Math.floor(1000 + Math.random() * 9000),
        type: 'pemasukan',
        category: (deposit >= totalFee) ? 'Pelunasan Event Photobooth' : 'DP Booking Photobooth',
        description: `Pembayaran ${clientName} (${packageName})`,
        amount: deposit,
        date: date,
        method: 'Transfer Bank BCA',
        bookingId: newId,
        createdAt: new Date().toISOString()
      };

      if (isSupabaseConfigured()) {
        const insertedTx = await insertTransaction(newTx);
        if (insertedTx) transactions.unshift(insertedTx);
        else transactions.unshift(newTx);
      } else {
        transactions.unshift(newTx);
        saveTransactions();
      }
    }

    showToast('Agenda photobooth baru berhasil ditambahkan!');
  }

  closeBookingModal();
  renderOverview();
  renderAgenda();
  renderFinance();
}

function editBooking(id) {
  openBookingModal(id);
}

async function markBookingDone(id) {
  const item = bookings.find(b => b.id === id);
  if (item) {
    item.status = 'Selesai';
    if (isSupabaseConfigured()) {
      await updateBooking(id, { status: 'Selesai' });
    } else {
      saveBookings();
    }
    showToast(`Status booking ${item.clientName} ditandai Selesai!`);
    renderOverview();
    renderAgenda();
  }
}

async function deleteBooking(id) {
  const item = bookings.find(b => b.id === id);
  if (!item) return;

  if (confirm(`Apakah Anda yakin ingin menghapus agenda photobooth "${item.clientName}"?`)) {
    if (isSupabaseConfigured()) {
      await deleteBookingDB(id);
    }
    bookings = bookings.filter(b => b.id !== id);
    if (!isSupabaseConfigured()) saveBookings();
    showToast('Agenda photobooth telah dihapus.');
    renderOverview();
    renderAgenda();
  }
}

// ================= INVOICE / TANDA TERIMA LOGIC =================
let currentActiveInvoiceBooking = null;

function viewInvoice(id) {
  const item = bookings.find(b => b.id === id);
  if (!item) return;

  currentActiveInvoiceBooking = item;

  document.getElementById('invReceiptCode').textContent = `#${item.id}`;
  document.getElementById('invIssueDate').textContent = formatDateIndo(item.date);
  document.getElementById('invClientName').textContent = item.clientName;
  document.getElementById('invClientPhone').textContent = item.clientPhone;
  document.getElementById('invDateTime').textContent = `${formatDateIndo(item.date)} (${item.startTime || '12:00'} - ${item.endTime || '15:00'} WIB)`;
  document.getElementById('invVenue').textContent = item.venue;
  document.getElementById('invPackage').textContent = item.packageName;
  document.getElementById('invNotes').textContent = item.notes || 'Paket Photobooth MOMU Professional';
  document.getElementById('invFee').textContent = formatRupiah(item.totalFee);
  document.getElementById('invTotal').textContent = formatRupiah(item.totalFee);
  document.getElementById('invPaid').textContent = formatRupiah(item.deposit);
  document.getElementById('invBalance').textContent = formatRupiah(item.remaining);

  const badgeEl = document.getElementById('invStatusBadge');
  if (item.status === 'Lunas') {
    badgeEl.className = 'badge badge-lunas';
    badgeEl.textContent = 'LUNAS';
  } else if (item.status === 'Selesai') {
    badgeEl.className = 'badge badge-selesai';
    badgeEl.textContent = 'SELESAI';
  } else {
    badgeEl.className = 'badge badge-dp';
    badgeEl.textContent = 'BOOKED / DP';
  }

  document.getElementById('invoiceModal').classList.remove('hidden');
  lucide.createIcons();
}

function closeInvoiceModal() {
  document.getElementById('invoiceModal').classList.add('hidden');
}

function shareWhatsAppInvoice() {
  if (!currentActiveInvoiceBooking) return;
  const b = currentActiveInvoiceBooking;
  const cleanPhone = b.clientPhone ? b.clientPhone.replace(/^0/, '62').replace(/[^0-9]/g, '') : '';

  const message = `*KONFIRMASI BOOKING MOMU PHOTOBOOTH* 📸✨%0A` +
    `No. Resi: #${b.id}%0A` +
    `Nama Klien: ${b.clientName}%0A` +
    `Tanggal: ${formatDateIndo(b.date)} (${b.startTime} - ${b.endTime} WIB)%0A` +
    `Lokasi: ${b.venue}%0A` +
    `Paket: ${b.packageName}%0A` +
    `--------------------------------%0A` +
    `Total Biaya: ${formatRupiah(b.totalFee)}%0A` +
    `Terbayar (DP): ${formatRupiah(b.deposit)}%0A` +
    `*Sisa Pelunasan: ${formatRupiah(b.remaining)}*%0A` +
    `--------------------------------%0A` +
    `Rekening Transfer: BCA 8830-123-999 a/n MOMU PHOTOBOOTH%0A` +
    `Terima kasih telah mempercayakan momen spesial Anda kepada MOMU! ✨`;

  const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
  window.open(url, '_blank');
}

// ================= FINANCE & KEUANGAN LOGIC =================
function renderFinance() {
  const totalIn = transactions
    .filter(t => t.type === 'pemasukan')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalOut = transactions
    .filter(t => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netCash = totalIn - totalOut;

  document.getElementById('financeTotalIn').textContent = formatRupiah(totalIn);
  document.getElementById('financeTotalOut').textContent = formatRupiah(totalOut);
  document.getElementById('financeNetCash').textContent = formatRupiah(netCash);

  renderFinanceTable();
}

function setFinanceFilterType(type) {
  activeFinanceFilter = type;
  const btnAll = document.getElementById('financeFilterAll');
  const btnIn = document.getElementById('financeFilterIn');
  const btnOut = document.getElementById('financeFilterOut');

  btnAll.className = 'px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200';
  btnIn.className = 'px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200';
  btnOut.className = 'px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200';

  if (type === 'all') {
    btnAll.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white';
  } else if (type === 'pemasukan') {
    btnIn.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white';
  } else if (type === 'pengeluaran') {
    btnOut.className = 'px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white';
  }

  renderFinanceTable();
}

function renderFinanceTable() {
  const tableBody = document.getElementById('financeTableBody');
  const categoryFilter = document.getElementById('financeCategorySelect').value;
  const searchQuery = (document.getElementById('searchFinanceInput')?.value || '').toLowerCase();

  let filtered = transactions.filter(t => {
    if (activeFinanceFilter !== 'all' && t.type !== activeFinanceFilter) {
      return false;
    }
    if (categoryFilter !== 'all' && t.category !== categoryFilter) {
      return false;
    }
    if (searchQuery) {
      const matchDesc = t.description.toLowerCase().includes(searchQuery);
      const matchCat = t.category.toLowerCase().includes(searchQuery);
      const matchMethod = (t.method || '').toLowerCase().includes(searchQuery);
      return matchDesc || matchCat || matchMethod;
    }
    return true;
  });

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  document.getElementById('totalTxCount').textContent = filtered.length;

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-8 text-slate-400">
          Tidak ada data transaksi keuangan yang cocok dengan filter.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(t => {
    const isIncome = t.type === 'pemasukan';
    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 px-4 font-semibold text-slate-600">${formatDateShort(t.date)}</td>
        <td class="py-3 px-4">
          <span class="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${isIncome ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
            <i data-lucide="${isIncome ? 'arrow-down-left' : 'arrow-up-right'}" class="w-3 h-3"></i>
            ${isIncome ? 'Pemasukan' : 'Pengeluaran'}
          </span>
        </td>
        <td class="py-3 px-4 font-medium text-slate-800">${t.category}</td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-900">${t.description}</div>
          ${t.bookingId ? `<span class="text-[10px] text-slate-400 font-mono">Ref: ${t.bookingId}</span>` : ''}
        </td>
        <td class="py-3 px-4 text-slate-500">${t.method || 'Transfer BCA'}</td>
        <td class="py-3 px-4 text-right font-black text-sm ${isIncome ? 'text-emerald-600' : 'text-rose-600'}">
          ${isIncome ? '+' : '-'} ${formatRupiah(t.amount)}
        </td>
        <td class="py-3 px-4 text-center">
          <button onclick="deleteTransaction('${t.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" title="Hapus Transaksi">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  lucide.createIcons();
}

function openTransactionModal(defaultType = 'pemasukan') {
  document.getElementById('txForm').reset();
  document.getElementById('txId').value = '';
  document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
  setTxType(defaultType);
  document.getElementById('transactionModal').classList.remove('hidden');
  lucide.createIcons();
}

function closeTransactionModal() {
  document.getElementById('transactionModal').classList.add('hidden');
}

function setTxType(type) {
  document.getElementById('txType').value = type;
  const inBtn = document.getElementById('txTypeInBtn');
  const outBtn = document.getElementById('txTypeOutBtn');
  const catSelect = document.getElementById('txCategory');

  if (type === 'pemasukan') {
    inBtn.className = 'py-2 text-center rounded-lg font-bold transition bg-white text-emerald-600 shadow-xs';
    outBtn.className = 'py-2 text-center rounded-lg font-bold transition text-slate-600';
    catSelect.innerHTML = INCOME_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  } else {
    outBtn.className = 'py-2 text-center rounded-lg font-bold transition bg-white text-rose-600 shadow-xs';
    inBtn.className = 'py-2 text-center rounded-lg font-bold transition text-slate-600';
    catSelect.innerHTML = EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  }
}

async function handleSaveTransaction(e) {
  e.preventDefault();

  const id = document.getElementById('txId').value;
  const type = document.getElementById('txType').value;
  const date = document.getElementById('txDate').value;
  const category = document.getElementById('txCategory').value;
  const description = document.getElementById('txDescription').value.trim();
  const amount = Number(document.getElementById('txAmount').value || 0);
  const method = document.getElementById('txMethod').value;

  if (amount <= 0) {
    alert('Nominal transaksi harus lebih dari 0');
    return;
  }

  const newTx = {
    id: id || ('TX-' + Math.floor(1000 + Math.random() * 9000)),
    type, category, description, amount, date, method,
    bookingId: null,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const inserted = await insertTransaction(newTx);
    if (inserted) transactions.unshift(inserted);
    else transactions.unshift(newTx);
  } else {
    transactions.unshift(newTx);
    saveTransactions();
  }

  showToast('Transaksi keuangan berhasil dicatat!');
  closeTransactionModal();
  renderOverview();
  renderFinance();
}

async function deleteTransaction(id) {
  const item = transactions.find(t => t.id === id);
  if (!item) return;

  if (confirm(`Hapus catatan transaksi: "${item.description}" (${formatRupiah(item.amount)})?`)) {
    if (isSupabaseConfigured()) {
      await deleteTransactionDB(id);
    }
    transactions = transactions.filter(t => t.id !== id);
    if (!isSupabaseConfigured()) saveTransactions();
    showToast('Transaksi keuangan telah dihapus.');
    renderOverview();
    renderFinance();
  }
}

function exportFinanceCSV() {
  let csv = 'ID,Tanggal,Jenis,Kategori,Keterangan,Nominal,Metode\n';
  transactions.forEach(t => {
    csv += `"${t.id}","${t.date}","${t.type}","${t.category}","${t.description.replace(/"/g, '""')}","${t.amount}","${t.method || ''}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Laporan_Keuangan_MOMU_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Laporan keuangan berhasil diunduh (CSV)!');
}

// ================= BACKUP & RESTORE =================
function openBackupModal() {
  document.getElementById('backupModal').classList.remove('hidden');
  lucide.createIcons();
}

function closeBackupModal() {
  document.getElementById('backupModal').classList.add('hidden');
}

function exportDataBackup() {
  const backupData = {
    exportedAt: new Date().toISOString(),
    business: 'MOMU Photobooth',
    bookings,
    transactions
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Backup_MOMU_Photobooth_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Cadangan data berhasil diunduh!');
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data.bookings) && Array.isArray(data.transactions)) {
        bookings = data.bookings;
        transactions = data.transactions;
        saveBookings();
        saveTransactions();
        showToast('Data MOMU berhasil dipulihkan!');
        closeBackupModal();
        renderOverview();
        renderAgenda();
        renderFinance();
      } else {
        alert('Format file JSON tidak sesuai dengan backup MOMU.');
      }
    } catch (err) {
      alert('Gagal membaca file JSON backup: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function resetToSampleData() {
  if (confirm('Apakah Anda yakin ingin memuat kembali data contoh photobooth? Data Anda saat ini akan ditimpa.')) {
    bookings = [...SAMPLE_BOOKINGS];
    transactions = [...SAMPLE_TRANSACTIONS];
    saveBookings();
    saveTransactions();
    showToast('Data contoh photobooth berhasil dimuat!');
    closeBackupModal();
    renderOverview();
    renderAgenda();
    renderFinance();
  }
}

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', async () => {
  // Set date display in header
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  const headerDate = document.getElementById('currentDateDisplay');
  if (headerDate) headerDate.textContent = dateStr;

  // Tampilkan email user yang sedang login (dari Supabase)
  if (isSupabaseConfigured()) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
      const badge = document.getElementById('user-email-badge');
      if (badge) badge.textContent = user.email;
    }
  }

  // Load data (Supabase atau localStorage)
  await loadData();
  renderOverview();
  lucide.createIcons();

  // Setup Realtime Subscriptions
  if (isSupabaseConfigured()) {
    const realtimeBadge = document.getElementById('realtime-badge');

    subscribeBookings(async () => {
      bookings = await fetchBookings();
      renderOverview();
      renderAgenda();
      lucide.createIcons();
    });

    subscribeTransactions(async () => {
      transactions = await fetchTransactions();
      renderOverview();
      renderFinance();
      lucide.createIcons();
    });

    if (realtimeBadge) {
      setTimeout(() => {
        realtimeBadge.classList.remove('hidden');
        setTimeout(() => realtimeBadge.classList.add('hidden'), 4000);
      }, 1500);
    }
  }
});

// Logout via Supabase Auth — sesi diinvalidasi di server
async function handleLogout() {
  if (confirm('Yakin ingin keluar dari dashboard MOMU?')) {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  }
}
