// ============ PAGE: DASHBOARD ============
function renderDashboard() {
  const stations = DB.get('stations'); const orders = DB.get('customer_orders'); const wos = DB.get('work_orders');
  const activeStations = stations.filter(s => s.status === 'active').length; const pendingWOs = wos.filter(w => w.status === 'pending').length; const inProgressWOs = wos.filter(w => w.status === 'in_progress').length; const urgentWOs = wos.filter(w => w.priority === 'urgent' && w.status !== 'completed').length;
  const range = getDateRange(dashboardPeriod, new Date()); 
  
  const totalCapacity = stations.filter(s => s.status === 'active').reduce((sum, st) => sum + calcStationCapacityInRange(st.id, range.start, range.end), 0);
  const totalLoad = stations.filter(s => s.status === 'active').reduce((sum, st) => sum + calcStationLoadInRange(st.id, range.start, range.end), 0);
  
  const overallUtil = totalCapacity > 0 ? Math.round(totalLoad / totalCapacity * 100) : 0; const uc = utilizationColor(overallUtil);

  let stationBars = stations.filter(s => s.status === 'active').map(st => {
    const load = calcStationLoadInRange(st.id, range.start, range.end); const cap = calcStationCapacityInRange(st.id, range.start, range.end); const pct = cap > 0 ? Math.round(load / cap * 100) : 0; const c = utilizationColor(pct);
    return `<div class="flex items-center gap-3 text-sm"><span class="w-28 text-xs font-medium truncate">${st.name}</span><div class="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden"><div class="${c.bar} h-full rounded-full transition-all" style="width:${Math.min(pct,100)}%"></div></div><span class="w-12 text-right text-xs font-bold ${c.text}">${pct}%</span></div>`;
  }).join('');

  const periodLabels = { day:'Gün', week:'Hafta', month:'Ay', year:'Yıl' };
  const periodBtns = ['day','week','month','year'].map(p => `<button onclick="dashboardPeriod='${p}'; render();" class="px-3 py-1 text-xs rounded-md font-medium ${dashboardPeriod===p ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}">${periodLabels[p]}</button>`).join('');

  return `<div class="max-w-7xl mx-auto space-y-6"><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">${kpiCard('factory','Aktif İstasyon',`${activeStations}/${stations.length}`,'İstasyon çalışıyor','blue')}${kpiCard('shopping-cart','Toplam Sipariş',orders.length,`${orders.filter(o=>o.status==='production').length} üretimde`,'green')}${kpiCard('clipboard-list','İş Emirleri',wos.length,`${pendingWOs} beklemede, ${inProgressWOs} devam`,'yellow')}${kpiCard('alert-triangle','Acil Emirler',urgentWOs,'Dikkat gerektiriyor','red')}</div><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 lg:col-span-2"><div class="flex items-center justify-between mb-4"><h3 class="font-bold text-sm">Doluluk Oranı (Kalan İşler)</h3><div class="flex gap-1">${periodBtns}</div></div><div class="flex items-start gap-6"><div class="text-center flex-shrink-0"><div class="text-5xl font-bold ${uc.text}">${overallUtil}%</div><div class="text-xs text-slate-500 mt-1">Genel Doluluk</div><div class="text-xs text-slate-400 mt-0.5">${totalLoad.toFixed(1)} / ${totalCapacity.toFixed(1)} sa</div></div><div class="flex-1 space-y-2.5">${stationBars}</div></div></div><div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"><h3 class="font-bold text-sm mb-4">Sipariş Durumu</h3><div style="height:200px;"><canvas id="chart-order-status"></canvas></div></div></div><div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"><h3 class="font-bold text-sm mb-4">İstasyon Kapasite Yükü</h3><div style="height:260px;"><canvas id="chart-station-cap"></canvas></div></div></div>`;
}

function kpiCard(icon, title, value, sub, color) {
  const colors = { blue:'bg-blue-50 text-blue-600', green:'bg-green-50 text-green-600', yellow:'bg-yellow-50 text-yellow-600', red:'bg-red-50 text-red-600' };
  return `<div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-start gap-3"><div class="${colors[color]} p-2.5 rounded-lg"><i data-lucide="${icon}" class="w-5 h-5"></i></div><div><div class="text-xs text-slate-500 dark:text-slate-400 font-medium">${title}</div><div class="text-2xl font-bold mt-0.5">${value}</div><div class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">${sub}</div></div></div>`;
}

function initDashboardCharts() {
  requestAnimationFrame(() => {
    const orders = DB.get('customer_orders'); const isDark = document.documentElement.classList.contains('dark'); const textColor = isDark ? '#94a3b8' : '#64748b';
    const statusCounts = {}; orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
    const donutEl = document.getElementById('chart-order-status');
    if (donutEl) { chartInstances['orderStatus'] = new Chart(donutEl, { type: 'doughnut', data: { labels: Object.keys(statusCounts).map(statusLabel), datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#3b82f6','#eab308','#22c55e','#a855f7','#14b8a6','#ef4444','#94a3b8'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position:'bottom', labels: { color: textColor, font: { size: 10 } } } }, cutout: '65%' } }); }

    const stations = DB.get('stations').filter(s => s.status === 'active');
    const range = getDateRange(dashboardPeriod, new Date());
    const barEl = document.getElementById('chart-station-cap');
    
    if (barEl) {
      const loads = stations.map(st => calcStationLoadInRange(st.id, range.start, range.end));
      const caps = stations.map(st => calcStationCapacityInRange(st.id, range.start, range.end));
      chartInstances['stationCap'] = new Chart(barEl, { type: 'bar', data: { labels: stations.map(s => s.name), datasets: [ { label: 'Planlanan Yük (sa)', data: loads, backgroundColor: '#3b82f6', borderRadius: 4 }, { label: 'Maks. Kapasite (sa)', data: caps, backgroundColor: isDark ? '#334155' : '#e2e8f0', borderRadius: 4 } ] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: textColor, font: { size: 11 } }, grid: { display: false } }, y: { ticks: { color: textColor }, grid: { color: isDark ? '#334155' : '#e2e8f0' } } }, plugins: { legend: { labels: { color: textColor, font: { size: 11 } } } } } });
    }
  });
}


