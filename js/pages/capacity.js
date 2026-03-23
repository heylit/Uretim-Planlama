// ============ PAGE: CAPACITY ============
function renderCapacity() {
  const stations = DB.get('stations').filter(s => s.status === 'active'); 
  const range = getDateRange(capacityMode, capacityRef); 
  
  const totalCap = stations.reduce((s, st) => s + calcStationCapacityInRange(st.id, range.start, range.end), 0); 
  const totalLoad = stations.reduce((s, st) => s + calcStationLoadInRange(st.id, range.start, range.end), 0);
  const overallPct = totalCap > 0 ? Math.round(totalLoad / totalCap * 100) : 0;
  const criticalCount = stations.filter(st => { const cap = calcStationCapacityInRange(st.id, range.start, range.end); return cap > 0 && (calcStationLoadInRange(st.id, range.start, range.end) / cap * 100) > 80; }).length;
  
  const modeLabels = { day:'Gün', week:'Hafta', month:'Ay', year:'Yıl' }; 
  const modeBtns = ['day','week','month','year'].map(m => `<button onclick="capacityMode='${m}'; render();" class="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${capacityMode===m ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-primary-400'}">${modeLabels[m]}</button>`).join('');

  let detailView = '';
  if (capacityMode === 'day') {
    detailView = stations.map(st => {
      const load = calcStationLoadInRange(st.id, range.start, range.end); const cap = calcStationCapacityInRange(st.id, range.start, range.end); const pct = cap > 0 ? Math.round(load / cap * 100) : 0; const uc = utilizationColor(pct);
      return `<div class="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0"><span class="w-32 text-sm font-medium truncate">${st.name}</span><div class="flex-1 flex gap-1 h-6"><div class="${uc.bar} rounded shadow-sm transition-all" style="width:${Math.min(pct,100)}%;min-width:4px;"></div><div class="bg-slate-100 dark:bg-slate-700/50 rounded flex-1"></div></div><span class="text-xs w-32 text-right font-medium text-slate-500">${load.toFixed(1)} / ${cap.toFixed(1)} sa</span><span class="text-xs font-black w-12 text-right ${uc.text}">${pct}%</span></div>`;
    }).join('');
    detailView = `<div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"><h3 class="font-bold text-sm mb-4">Günlük Kapasite Raporu</h3>${detailView}</div>`;
  } else if (capacityMode === 'week') {
    const dayNames = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt']; const days = []; const d = new Date(range.start); while (d <= range.end) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
    const headerCells = days.map(dy => `<th class="py-3 px-2 text-center text-xs font-semibold">${dayNames[dy.getDay()]} ${dy.getDate()}.${dy.getMonth()+1}</th>`).join('');
    const stRows = stations.map(st => {
      const cells = days.map(dy => { 
          const dStart = new Date(dy); dStart.setHours(0,0,0,0); const dEnd = new Date(dy); dEnd.setHours(23,59,59,999); 
          const load = calcStationLoadInRange(st.id, dStart, dEnd); const cap = calcStationCapacityInRange(st.id, dStart, dEnd); const pct = cap > 0 ? Math.round(load / cap * 100) : 0; const uc = utilizationColor(pct); 
          return `<td class="py-3 px-2 text-center"><div class="text-xs font-black ${uc.text}">${pct}%</div><div class="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-1.5 mt-1 overflow-hidden"><div class="${uc.bar} h-full rounded-full" style="width:${Math.min(pct,100)}%"></div></div><div class="text-[9px] font-bold text-slate-400 mt-1">${load.toFixed(1)} / ${cap.toFixed(1)}sa</div></td>`; 
      }).join('');
      return `<tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"><td class="py-3 px-4 text-xs font-bold whitespace-nowrap">${st.name}</td>${cells}</tr>`;
    }).join('');
    detailView = `<div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm"><table class="w-full text-left"><thead><tr class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"><th class="py-3 px-4 text-xs font-bold text-slate-500 uppercase">İstasyon</th>${headerCells}</tr></thead><tbody>${stRows}</tbody></table></div>`;
  } else if (capacityMode === 'month') {
    const dayHeaders = []; for (let i = 0; i < range.days; i++) { const dd = new Date(range.start); dd.setDate(dd.getDate() + i); dayHeaders.push(dd); }
    const stRows = stations.map(st => {
      const cells = dayHeaders.map(dy => { 
          const dStart = new Date(dy); dStart.setHours(0,0,0,0); const dEnd = new Date(dy); dEnd.setHours(23,59,59,999); 
          const load = calcStationLoadInRange(st.id, dStart, dEnd); const cap = calcStationCapacityInRange(st.id, dStart, dEnd); const pct = cap > 0 ? Math.round(load / cap * 100) : 0; const uc = utilizationColor(pct); const bgHex = pct === 0 ? 'transparent' : uc.hex + '40'; 
          return `<div class="heatmap-cell border border-slate-100 dark:border-slate-700/50" style="background:${bgHex};" title="${st.name} - ${dy.getDate()}.${dy.getMonth()+1}: Yük ${load.toFixed(1)}sa, Kapasite ${cap.toFixed(1)}sa -> ${pct}%">${pct > 0 ? pct : ''}</div>`; 
      }).join('');
      return `<div class="flex items-center gap-1"><span class="w-28 text-[11px] font-bold truncate flex-shrink-0">${st.name}</span><div class="flex gap-0.5">${cells}</div></div>`;
    }).join('');
    const dayLabels = dayHeaders.map(d => `<div class="heatmap-cell text-slate-400 font-bold">${d.getDate()}</div>`).join('');
    detailView = `<div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 overflow-x-auto shadow-sm"><h3 class="font-bold text-sm mb-6">Aylık Kapasite Isı Haritası</h3><div class="space-y-1.5"><div class="flex items-center gap-1"><span class="w-28 flex-shrink-0"></span><div class="flex gap-0.5">${dayLabels}</div></div>${stRows}</div></div>`;
  } else {
    const monthNames = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']; const headerCells = monthNames.map(m => `<th class="py-3 px-2 text-center text-xs font-semibold">${m}</th>`).join(''); const yr = range.start.getFullYear();
    const stRows = stations.map(st => {
      const cells = monthNames.map((m, i) => { 
          const mStart = new Date(yr, i, 1); const mEnd = new Date(yr, i + 1, 0, 23, 59, 59); 
          const load = calcStationLoadInRange(st.id, mStart, mEnd); const cap = calcStationCapacityInRange(st.id, mStart, mEnd); const pct = cap > 0 ? Math.round(load / cap * 100) : 0; const uc = utilizationColor(pct); 
          return `<td class="py-3 px-2 text-center"><div class="text-xs font-black ${uc.text}">${pct}%</div><div class="text-[9px] font-bold text-slate-400 mt-1">${load.toFixed(0)}/${cap.toFixed(0)}sa</div></td>`; 
      }).join('');
      return `<tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"><td class="py-3 px-4 text-xs font-bold whitespace-nowrap">${st.name}</td>${cells}</tr>`;
    }).join('');
    detailView = `<div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm"><table class="w-full text-left"><thead><tr class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"><th class="py-3 px-4 text-xs font-bold text-slate-500 uppercase">İstasyon</th>${headerCells}</tr></thead><tbody>${stRows}</tbody></table></div>`;
  }

  return `<div class="max-w-7xl mx-auto space-y-4"><div class="flex flex-wrap items-center justify-between gap-3"><div class="flex gap-2">${modeBtns}</div><div class="flex items-center gap-2"><button onclick="navCapacity(-1)" class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors shadow-sm">‹ Önceki</button><button onclick="navCapacity(0)" class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors shadow-sm">Bugün</button><button onclick="navCapacity(1)" class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors shadow-sm">Sonraki ›</button></div></div><div class="grid grid-cols-4 gap-4">${kpiCard('clock','Toplam Kapasite',`${totalCap.toFixed(0)} sa`,`Vardiya saatlerine göre`,'blue')}${kpiCard('loader','Planlanan Yük',`${totalLoad.toFixed(1)} sa`,'Sipariş adetleri dahil','yellow')}${kpiCard('gauge','Doluluk Oranı',`${overallPct}%`,overallPct > 80 ? 'Kritik seviye!' : 'Normal seviye','green')}${kpiCard('alert-circle','Kritik İstasyonlar',criticalCount,'%80 üzeri yük','red')}</div>${detailView}</div>`;
}

function navCapacity(dir) {
  if (dir === 0) { capacityRef = new Date(); render(); return; } const d = new Date(capacityRef);
  if (capacityMode === 'day') d.setDate(d.getDate() + dir); else if (capacityMode === 'week') d.setDate(d.getDate() + dir * 7); else if (capacityMode === 'month') d.setMonth(d.getMonth() + dir); else d.setFullYear(d.getFullYear() + dir);
  capacityRef = d; render();
}

