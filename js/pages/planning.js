// ============ PAGE: PLANNING (GANTT) ============
function renderPlanning() {
  const stations = DB.get('stations').filter(s => s.status === 'active'); const steps = DB.get('work_order_steps'); const wos = DB.get('work_orders');
  const range = getDateRange(planningMode === 'year' ? 'year' : planningMode === 'month' ? 'month' : 'week', planningRef);
  const modeLabels = { week:'Hafta', month:'Ay', year:'Yıl' }; const modeBtns = ['week','month','year'].map(m => `<button onclick="planningMode='${m}'; render();" class="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${planningMode===m ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}">${modeLabels[m]}</button>`).join('');

  let columns = []; const dayNames = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt']; const monthNames = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  if (planningMode === 'week') { for (let i = 0; i < 7; i++) { const d = new Date(range.start); d.setDate(d.getDate() + i); columns.push({ label: `${dayNames[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`, start: new Date(d), end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59) }); } }
  else if (planningMode === 'month') { for (let i = 0; i < range.days; i++) { const d = new Date(range.start); d.setDate(d.getDate() + i); columns.push({ label: `${d.getDate()}`, start: new Date(d), end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59) }); } }
  else { for (let m = 0; m < 12; m++) columns.push({ label: monthNames[m], start: new Date(range.start.getFullYear(), m, 1), end: new Date(range.start.getFullYear(), m + 1, 0, 23, 59, 59) }); }

  const totalMs = range.end.getTime() - range.start.getTime();
  
  const stationRows = stations.map(st => {
    const stSteps = steps.filter(s => s.stationId === st.id && s.plannedStart && s.plannedEnd && s.status !== 'completed');
    const bars = stSteps.map(s => {
      const wo = wos.find(w => w.id === s.workOrderId); const ss = new Date(s.plannedStart), se = new Date(s.plannedEnd);
      if (se < range.start || ss > range.end) return '';
      const clampStart = Math.max(ss.getTime(), range.start.getTime()); const clampEnd = Math.min(se.getTime(), range.end.getTime());
      const left = ((clampStart - range.start.getTime()) / totalMs * 100); const width = ((clampEnd - clampStart) / totalMs * 100);
      const color = priorityBarColor(wo ? wo.priority : 'normal'); const label = wo ? `${wo.orderNo}` : `#${s.workOrderId}`;
      const qty = wo ? wo.quantity : 1; const totalMin = (s.estimatedMinutes * qty) + (s.setupMinutes || 0);
      const titleText = `${label}: İşlem ${totalMin}dk (${s.estimatedMinutes}dk x ${qty} Adet)${s.setupMinutes ? ' + Hazırlık ' + s.setupMinutes + 'dk' : ''}&#10;${formatDateTime(s.plannedStart)} → ${formatDateTime(s.plannedEnd)}`;
      return `<div class="gantt-bar shadow-sm" data-step-id="${s.id}" style="left:${left}%;width:${Math.max(width, 0.5)}%;background:${color};" title="${titleText}"><span class="text-[9px] text-white font-bold px-1 truncate block leading-[20px] drop-shadow-md">${width > 3 ? label : ''}</span></div>`;
    }).join('');
    return `<div class="flex border-b border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors" style="min-height:36px;"><div class="w-32 flex-shrink-0 px-3 py-2 text-[11px] font-bold border-r border-slate-200 dark:border-slate-700/50 flex items-center truncate">${st.name}</div><div class="flex-1 relative">${bars}</div></div>`;
  }).join('');

  const colWidth = 100 / columns.length; const gridLines = columns.map((c, i) => `<div class="absolute top-0 bottom-0 border-l border-slate-200/50 dark:border-slate-700/30" style="left:${i * colWidth}%"></div>`).join(''); const colHeaders = columns.map(c => `<div class="text-center text-[10px] font-medium text-slate-500 truncate" style="width:${colWidth}%">${c.label}</div>`).join('');

  return `<div class="max-w-full mx-auto space-y-4"><div class="flex flex-wrap items-center justify-between gap-3"><div class="flex gap-2">${modeBtns}</div><div class="flex items-center gap-2"><button onclick="navPlanning(-1)" class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors shadow-sm">‹ Önceki</button><button onclick="navPlanning(0)" class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors shadow-sm">Bugün</button><button onclick="navPlanning(1)" class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold transition-colors shadow-sm">Sonraki ›</button></div></div><div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm"><div class="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"><div class="w-32 flex-shrink-0 px-3 py-2 text-xs font-semibold text-slate-500 border-r border-slate-200 dark:border-slate-700">İstasyon</div><div class="flex-1 flex items-center">${colHeaders}</div></div><div class="relative" id="gantt-grid"><div class="absolute inset-0 pointer-events-none" style="left:128px">${gridLines}</div>${stationRows}</div></div></div>`;
}

function navPlanning(dir) {
  if (dir === 0) { planningRef = new Date(); render(); return; } const d = new Date(planningRef);
  if (planningMode === 'week') d.setDate(d.getDate() + dir * 7); else if (planningMode === 'month') d.setMonth(d.getMonth() + dir); else d.setFullYear(d.getFullYear() + dir);
  planningRef = d; render();
}

function initPlanningDrag() {
  const grid = document.getElementById('gantt-grid'); if (!grid) return;
  let dragBar = null, startX = 0, origLeft = 0, barParent = null;
  grid.addEventListener('mousedown', e => {
    const bar = e.target.closest('.gantt-bar'); if (!bar) return; e.preventDefault();
    dragBar = bar; barParent = bar.parentElement; startX = e.clientX; origLeft = parseFloat(bar.style.left); bar.style.cursor = 'grabbing'; bar.style.zIndex = '30';
  });
  document.addEventListener('mousemove', e => {
    if (!dragBar || !barParent) return; const parentWidth = barParent.getBoundingClientRect().width; const dx = e.clientX - startX; const dpct = (dx / parentWidth) * 100;
    dragBar.style.left = Math.max(0, Math.min(100 - parseFloat(dragBar.style.width), origLeft + dpct)) + '%';
  });
  document.addEventListener('mouseup', e => {
    if (!dragBar || !barParent) return;
    const stepId = parseInt(dragBar.dataset.stepId); const newLeft = parseFloat(dragBar.style.left);
    const range = getDateRange(planningMode === 'year' ? 'year' : planningMode === 'month' ? 'month' : 'week', planningRef);
    const totalMs = range.end.getTime() - range.start.getTime(); const steps = DB.get('work_order_steps'); const step = steps.find(s => s.id === stepId);
    if (step) {
      const duration = new Date(step.plannedEnd).getTime() - new Date(step.plannedStart).getTime(); const newStart = new Date(range.start.getTime() + (newLeft / 100) * totalMs); const newEnd = new Date(newStart.getTime() + duration);
      step.plannedStart = newStart.toISOString(); step.plannedEnd = newEnd.toISOString(); DB.set('work_order_steps', steps); toast('Adım taşındı');
    }
    dragBar.style.cursor = 'grab'; dragBar.style.zIndex = '10'; dragBar = null; barParent = null; render();
  });
}

