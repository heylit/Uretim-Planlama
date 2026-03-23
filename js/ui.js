// ============ TOAST & MODAL ============
function toast(message, type = 'success') {
  const tc = document.getElementById('toast-container');
  const colors = { success:'bg-green-500', error:'bg-red-500', info:'bg-blue-500', warning:'bg-yellow-500' };
  const div = document.createElement('div');
  div.className = `${colors[type] || colors.info} text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all transform translate-x-0`;
  div.textContent = message; tc.appendChild(div);
  setTimeout(() => { div.style.opacity = '0'; setTimeout(() => div.remove(), 300); }, 3000);
}

function showModal(title, contentHtml, onSave) {
  const existing = document.getElementById('modal-overlay'); if (existing) existing.remove();
  const overlay = document.createElement('div'); overlay.id = 'modal-overlay'; overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-content shadow-2xl"><div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700"><h3 class="text-lg font-bold text-slate-800 dark:text-white">${title}</h3><button onclick="closeModal()" class="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><i data-lucide="x" class="w-5 h-5"></i></button></div><div class="p-4" id="modal-body">${contentHtml}</div><div class="flex justify-end gap-2 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-b-12px"><button onclick="closeModal()" class="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium">İptal</button><button id="modal-save-btn" class="px-5 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-bold shadow-sm">Kaydet</button></div></div>`;
  document.body.appendChild(overlay); overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  if (onSave) document.getElementById('modal-save-btn').addEventListener('click', onSave);
  lucide.createIcons();
}
function closeModal() { const m = document.getElementById('modal-overlay'); if (m) m.remove(); }
function confirmDialog(msg, onConfirm) {
  showModal('Onay', `<p class="text-sm text-slate-600 dark:text-slate-300">${msg}</p>`, () => { closeModal(); onConfirm(); });
  document.getElementById('modal-save-btn').textContent = 'Evet, Sil'; document.getElementById('modal-save-btn').className = 'px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium';
}

// ============ SIDEBAR & ROUTING ============
const NAV_ITEMS = [
  { id:'dashboard', label:'Dashboard', icon:'layout-dashboard' },
  { id:'orders', label:'Siparişler', icon:'shopping-cart' },
  { id:'work-orders', label:'İş Emirleri', icon:'clipboard-list' },
  { id:'shipping', label:'Sevkiyat', icon:'truck' },
  { id:'planning', label:'Üretim Planı (Gantt)', icon:'gantt-chart' },
  { id:'inventory', label:'Stok & Reçete (BOM)', icon:'package' },
  { id:'product-routes', label:'Ürün Rotaları', icon:'route' },
  { id:'shifts', label:'Vardiya Ayarları', icon:'clock' }, 
  { id:'stations', label:'İstasyonlar', icon:'factory' },
  { id:'employees', label:'Çalışanlar', icon:'users' },
  { id:'capacity', label:'Kapasite (Yük)', icon:'gauge' },
  { id:'statistics', label:'İstatistikler', icon:'line-chart' }
];

const PAGE_TITLES = { dashboard:'Dashboard', orders:'Siparişler', 'work-orders':'İş Emirleri Sıralaması', shipping:'Sevkiyat', planning:'Üretim Planı', inventory:'Stok & Reçete', shifts: 'Vardiya ve Çalışma Saatleri', stations:'İstasyon Yönetimi', employees:'Çalışan Yönetimi', capacity:'Kapasite Raporu', 'product-routes':'Ürün Rotaları Şablonları', statistics:'Gelişmiş İstatistikler' };

function renderSidebar() {
  const current = (window.location.hash || '#/').replace('#/', '') || 'dashboard';
  document.getElementById('sidebar-nav').innerHTML = NAV_ITEMS.map(item => `
    <a href="#/${item.id}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${current === item.id ? 'bg-slate-700/50 text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}">
      <i data-lucide="${item.icon}" class="w-[18px] h-[18px] flex-shrink-0"></i><span class="sidebar-text">${item.label}</span>
    </a>
  `).join('');
}

let sidebarOpen = true;
function toggleSidebar() { sidebarOpen = !sidebarOpen; document.getElementById('sidebar').style.width = sidebarOpen ? '256px' : '0px'; }
function toggleDarkMode() { document.documentElement.classList.toggle('dark'); localStorage.setItem('pp_dark', document.documentElement.classList.contains('dark')); }
if (localStorage.getItem('pp_dark') === 'true') document.documentElement.classList.add('dark');
function getCurrentPage() { return (window.location.hash || '#/').replace('#/', '') || 'dashboard'; }
function navigateTo(page) { window.location.hash = '#/' + page; }

let chartInstances = {};
function destroyCharts() { Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch {} }); chartInstances = {}; }

let orderFilter = 'all';
let expandedWorkOrders = new Set();
let expandedStations = new Set();
let dashboardPeriod = 'week';
let planningMode = 'week'; let planningRef = new Date();
let capacityMode = 'week'; let capacityRef = new Date();
let statsPeriod = 'daily'; 

function render() {
  destroyCharts(); const page = getCurrentPage(); renderSidebar();
  document.getElementById('header-title').textContent = PAGE_TITLES[page] || 'Dashboard';
  const app = document.getElementById('app');
  switch (page) {
    case 'dashboard': app.innerHTML = renderDashboard(); initDashboardCharts(); break;
    case 'orders': app.innerHTML = renderOrders(); break;
    case 'work-orders': app.innerHTML = renderWorkOrders(); break;
    case 'shipping': app.innerHTML = renderShipping(); break;
    case 'planning': app.innerHTML = renderPlanning(); initPlanningDrag(); break;
    case 'inventory': app.innerHTML = renderInventory(); break;
    case 'shifts': app.innerHTML = renderShifts(); break;
    case 'stations': app.innerHTML = renderStations(); break;
    case 'employees': app.innerHTML = renderEmployees(); break;
    case 'capacity': app.innerHTML = renderCapacity(); break;
    case 'product-routes': app.innerHTML = renderProductRoutes(); break;
    case 'statistics': app.innerHTML = renderStatistics(); initStatisticsCharts(); break;
    default: app.innerHTML = renderDashboard(); initDashboardCharts();
  }
  lucide.createIcons();
}
window.addEventListener('hashchange', render);

