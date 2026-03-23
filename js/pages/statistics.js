// ============ PAGE: STATISTICS ============
function renderStatistics() {
  const completedSteps = DB.get('work_order_steps').filter(s => s.status === 'completed');
  const stats = completedSteps.map(getStepStats).filter(s => s && s.wo && s.st);

  if (stats.length === 0) return `<div class="max-w-7xl mx-auto"><div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center shadow-sm"><i data-lucide="bar-chart-3" class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4"></i><h3 class="text-lg font-bold text-slate-500">Henüz Veri Yok</h3><p class="text-sm text-slate-400 mt-2">İstatistikler, tamamlanmış (kapatılmış) üretim adımları olduğunda görüntülenecektir.</p></div></div>`;

  const totalPlanned = stats.reduce((s, x) => s + x.planned, 0);
  const totalActual = stats.reduce((s, x) => s + x.actual, 0);
  const overallEff = totalActual > 0 ? Math.round((totalPlanned / totalActual) * 100) : 0;

  const stations = DB.get('stations').filter(s => s.status === 'active');
  const stationAveragesHtml = stations.map(st => {
      const stStats = stats.filter(x => x.st.id === st.id);
      if(stStats.length === 0) return '';
      const p = stStats.reduce((s, x) => s + x.planned, 0);
      const a = stStats.reduce((s, x) => s + x.actual, 0);
      const eff = a > 0 ? Math.round((p / a) * 100) : 0;
      
      let col = 'text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700';
      if(eff >= 100) col = 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400';
      else if(eff >= 80) col = 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400';
      else if(eff > 0) col = 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400';

      return `<div class="p-4 border rounded-2xl ${col} text-center shadow-sm flex flex-col justify-center transition-transform hover:scale-105"><div class="text-[11px] font-bold uppercase mb-1 truncate opacity-80" title="${st.name}">${st.name}</div><div class="text-3xl font-black">%${eff}</div></div>`;
  }).join('');

  const modeLabels = { daily:'Günlük', weekly:'Haftalık', monthly:'Aylık', yearly:'Yıllık' };
  const modeBtns = ['daily','weekly','monthly','yearly'].map(m => `<button onclick="statsPeriod='${m}'; render();" class="px-4 py-1.5 text-xs rounded-lg font-bold transition-colors shadow-sm border border-slate-200 dark:border-slate-600 ${statsPeriod===m ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}">${modeLabels[m]}</button>`).join('');

  const detailRows = stats.map(x => {
      const deviation = x.actual - x.planned;
      return `<tr class="border-b border-slate-100 dark:border-slate-700/50 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <td class="py-3 px-4 font-mono font-bold text-primary-600">${x.wo.orderNo}</td>
          <td class="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">${x.st.name}</td>
          <td class="py-3 px-4 text-right">${(x.planned / 60).toFixed(1)} sa</td>
          <td class="py-3 px-4 text-right">${(x.actual / 60).toFixed(1)} sa</td>
          <td class="py-3 px-4 text-right font-bold ${deviation > 0 ? 'text-red-500' : 'text-green-500'}">${deviation > 0 ? '+' : ''}${(deviation / 60).toFixed(1)} sa</td>
          <td class="py-3 px-4 text-right font-black ${x.eff >= 100 ? 'text-green-600 dark:text-green-400' : 'text-amber-500'}">%${x.eff}</td>
      </tr>`;
  }).join('');

  return `<div class="max-w-7xl mx-auto space-y-8"><div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">${kpiCard('check-circle','Tamamlanan Adımlar',stats.length,'Toplam biten operasyon','green')}${kpiCard('clock','Toplam Planlanan',`${(totalPlanned/60).toFixed(1)} sa`,'Sipariş adedi ile çarpılmış','blue')}${kpiCard('timer','Gerçekleşen Süre',`${(totalActual/60).toFixed(1)} sa`,'Terminalden hesaplanan','yellow')}${kpiCard('trending-up','Genel Verimlilik',`%${overallEff}`,overallEff >= 100 ? 'Harika gidiyor!' : 'Geliştirilebilir','green')}</div>${stationAveragesHtml ? `<div><h3 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2"><i data-lucide="activity" class="w-4 h-4 text-primary-500"></i> İstasyon Bazında Ortalama Verimlilik</h3><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">${stationAveragesHtml}</div></div>` : ''}<div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"><div class="flex flex-wrap items-center justify-between gap-4 mb-6"><h3 class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2"><i data-lucide="line-chart" class="w-5 h-5 text-primary-500"></i> İstasyonların Zaman İçindeki Verimi (Trend)</h3><div class="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">${modeBtns}</div></div><div style="height:350px;"><canvas id="chart-efficiency-trend"></canvas></div></div><div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm"><div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2"><i data-lucide="table" class="w-4 h-4 text-slate-500"></i><h3 class="font-bold text-sm text-slate-700 dark:text-slate-300">Tamamlanan İşlemler Detay Tablosu</h3></div><table class="w-full text-left"><thead><tr class="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider"><th class="py-3 px-4">İş Emri</th><th class="py-3 px-4">İstasyon</th><th class="py-3 px-4 text-right">Planlanan</th><th class="py-3 px-4 text-right">Gerçekleşen</th><th class="py-3 px-4 text-right">Sapma</th><th class="py-3 px-4 text-right">Verimlilik</th></tr></thead><tbody>${detailRows}</tbody></table></div></div>`;
}

function initStatisticsCharts() {
  requestAnimationFrame(() => {
    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    const stations = DB.get('stations').filter(s => s.status === 'active');
    const allStats = DB.get('work_order_steps').filter(s => s.status === 'completed').map(getStepStats).filter(s => s && s.wo && s.st);

    if (allStats.length === 0) return;

    const labels = [];
    const formatters = [];
    const now = new Date();

    if (statsPeriod === 'daily') {
        for(let i=13; i>=0; i--) {
            const d = new Date(now); d.setDate(d.getDate() - i);
            labels.push(d.toLocaleDateString('tr-TR', {day:'numeric', month:'short'}));
            formatters.push(s => s.date.getDate() === d.getDate() && s.date.getMonth() === d.getMonth() && s.date.getFullYear() === d.getFullYear());
        }
    } else if (statsPeriod === 'weekly') {
        for(let i=7; i>=0; i--) {
            const d = new Date(now); d.setDate(d.getDate() - (i*7));
            const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
            const ws = new Date(d.setDate(diff));
            const we = new Date(ws); we.setDate(ws.getDate() + 6);
            labels.push(`${ws.getDate()} ${ws.toLocaleDateString('tr-TR',{month:'short'})}`);
            formatters.push(s => s.date >= ws && s.date <= we);
        }
    } else if (statsPeriod === 'monthly') {
        for(let i=11; i>=0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(d.toLocaleDateString('tr-TR', {month:'short', year:'numeric'}));
            formatters.push(s => s.date.getMonth() === d.getMonth() && s.date.getFullYear() === d.getFullYear());
        }
    } else if (statsPeriod === 'yearly') {
        for(let i=4; i>=0; i--) {
            const y = now.getFullYear() - i;
            labels.push(y.toString());
            formatters.push(s => s.date.getFullYear() === y);
        }
    }

    const colors = ['#3b82f6', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#14b8a6', '#eab308', '#6366f1'];
    const datasets = stations.map((st, i) => {
        const stStats = allStats.filter(x => x.st.id === st.id);
        const data = formatters.map(fmt => {
            const periodStats = stStats.filter(fmt);
            const p = periodStats.reduce((sum, x) => sum + x.planned, 0);
            const a = periodStats.reduce((sum, x) => sum + x.actual, 0);
            return a > 0 ? Math.round((p/a)*100) : null; 
        });
        return {
            label: st.name,
            data: data,
            borderColor: colors[i % colors.length],
            backgroundColor: colors[i % colors.length],
            tension: 0.4,
            spanGaps: true,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6
        };
    });

    const elTrend = document.getElementById('chart-efficiency-trend');
    if (elTrend) {
        chartInstances['effTrend'] = new Chart(elTrend, {
            type: 'line',
            data: { labels: labels.reverse(), datasets: datasets.map(d => ({...d, data: d.data.reverse()})) },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: { ticks: { color: textColor, font: {family: 'Inter', weight:'bold'} }, grid: { display: false } },
                    y: { title: { display: true, text: 'Verimlilik (%)', color: textColor, font:{weight:'bold', family:'Inter'} }, ticks: { color: textColor, font:{weight:'bold'} }, grid: { color: gridColor, borderDash: [5, 5] } }
                },
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, padding: 20, usePointStyle: true, font: {family: 'Inter', size: 12, weight:'bold'} } },
                    tooltip: { backgroundColor: isDark ? '#1e293b' : '#ffffff', titleColor: isDark ? '#f8fafc' : '#0f172a', bodyColor: isDark ? '#cbd5e1' : '#475569', borderColor: gridColor, borderWidth: 1, padding: 12, boxPadding: 6, callbacks: { label: (ctx) => ` ${ctx.dataset.label}: %${ctx.raw || 0}` } }
                }
            }
        });
    }
  });
}

