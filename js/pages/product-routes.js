// ============ PAGE: PRODUCT ROUTES ============
let tempRouteState = { productName: '', steps: [] };

function renderProductRoutes() {
  const routes = DB.get('product_routes').filter(r => r.isTemplate); const stations = DB.get('stations');
  return `<div class="max-w-7xl mx-auto space-y-4"><div class="flex items-center justify-between mb-2"><div><h2 class="text-sm text-slate-500">Operasyonları (Seri/Paralel) ve Süreleri Tanımlayın</h2></div><button onclick="showAddRouteModal()" class="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 shadow transition-colors"><i data-lucide="plus" class="w-4 h-4"></i> Yeni Rota Şablonu</button></div>
    ${routes.length === 0 ? `<div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-16 text-center shadow-sm"><i data-lucide="route" class="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4"></i><p class="text-sm text-slate-500">Henüz rota şablonu tanımlanmadı</p></div>` : `
      <div class="grid grid-cols-1 gap-4">
        ${routes.map(route => {
          const totalMin = route.steps.reduce((s,st) => s + (st.estimatedMinutes||0) + (st.setupMinutes||0), 0);
          return `<div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"><div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center"><i data-lucide="route" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></i></div><div><div class="flex items-center gap-2"><h3 class="font-bold text-sm text-slate-800 dark:text-slate-200">${route.productName}</h3><span class="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded text-[10px] font-bold">Rota Şablonu</span></div><span class="text-xs text-slate-500">${route.steps.length} adım · ${(totalMin / 60).toFixed(1)} saat (1 Birim)</span></div></div><div class="flex items-center gap-2"><button onclick="editRoute(${route.id})" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button><button onclick="deleteRoute(${route.id})" class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button></div></div>
              <div class="p-4 bg-slate-50/50 dark:bg-slate-900/30"><div class="flex items-center gap-2 flex-wrap">
                  ${route.steps.map((step, i) => {
                    const station = stations.find(s => s.id === step.stationId);
                    const depIcon = step.dependency === 'parallel' ? '⚡' : '🔗';
                    return `<div class="flex items-center gap-2"><div class="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 shadow-sm"><span class="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold" title="${step.dependency === 'parallel' ? 'Paralel Başlar' : 'Önceki Sırayı Bekler'}">${depIcon} ${step.stepOrder || (i+1)}</span><span class="text-xs font-bold text-slate-700 dark:text-slate-300">${station ? station.name : 'Bilinmeyen'}</span><span class="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1.5 py-0.5">${((step.estimatedMinutes||0) / 60).toFixed(1)} sa</span></div>${i < route.steps.length - 1 ? '<i data-lucide="chevron-right" class="w-4 h-4 text-slate-400"></i>' : ''}</div>`;
                  }).join('')}
              </div></div></div>`;
        }).join('')}
      </div></div>`}`;
}

function showAddRouteModal(routeId) {
    const routes = DB.get('product_routes');
    if (routeId) { const r = routes.find(x => x.id === routeId); tempRouteState = JSON.parse(JSON.stringify(r)); } 
    else { tempRouteState = { id: null, productName: '', isTemplate: true, steps: [{ stationId: '', estimatedMinutes: 60, setupMinutes: 15, dependency: 'serial' }] }; }
    
    showModal(routeId ? 'Rota Şablonunu Düzenle' : 'Yeni Rota Şablonu', `<div class="space-y-4"><div><label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Rota Şablon Adı</label><input id="route-product-input" type="text" value="${tempRouteState.productName}" class="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 font-bold focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Örn: Standart İHA Rotası" onchange="tempRouteState.productName = this.value"></div><div><div class="flex items-center justify-between mb-2"><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Üretim Adımları (Operasyonlar)</label><button onclick="addRouteStepState()" class="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded border border-primary-200 dark:border-primary-800"><i data-lucide="plus" class="w-3 h-3"></i> Adım Ekle</button></div><div id="route-steps-container" class="space-y-3 max-h-[50vh] overflow-y-auto p-1 custom-scrollbar"></div></div></div>`, () => saveRouteState());
    renderRouteStepsState();
}

function addRouteStepState() { tempRouteState.steps.push({ stationId: '', estimatedMinutes: 60, setupMinutes: 15, dependency: 'serial' }); renderRouteStepsState(); }
function removeRouteStepState(index) { tempRouteState.steps.splice(index, 1); renderRouteStepsState(); }

function renderRouteStepsState() {
    const container = document.getElementById('route-steps-container'); if (!container) return;
    const stations = DB.get('stations');
    container.innerHTML = tempRouteState.steps.map((step, i) => {
        const stOpts = stations.map(s => `<option value="${s.id}" ${s.id == step.stationId ? 'selected' : ''}>${s.name} (${s.code})</option>`).join('');
        return `<div class="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 relative flex flex-wrap gap-2 items-end"><div class="w-14"><span class="text-[9px] font-bold text-slate-500 uppercase">Sıra</span><input type="number" onchange="tempRouteState.steps[${i}].stepOrder = parseInt(this.value)" value="${step.stepOrder || (i+1)}" class="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-700 text-center font-black text-primary-600 outline-none"></div><div class="flex-1 min-w-[120px]"><span class="text-[9px] font-bold text-slate-500 uppercase">Bağlantı Türü</span><select onchange="tempRouteState.steps[${i}].dependency = this.value" class="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-[10px] bg-white dark:bg-slate-700 font-bold ${step.dependency === 'parallel' ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-300'} outline-none"><option value="serial" ${step.dependency !== 'parallel' ? 'selected' : ''}>🔗 SERİ (Bekler)</option><option value="parallel" ${step.dependency === 'parallel' ? 'selected' : ''}>⚡ PARALEL (Bağımsız)</option></select></div><div class="flex-1 min-w-[150px]"><span class="text-[9px] font-bold text-slate-500 uppercase">İstasyon</span><select onchange="tempRouteState.steps[${i}].stationId = parseInt(this.value)" class="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-700 font-medium outline-none"><option value="">Seçiniz...</option>${stOpts}</select></div><div class="w-20"><span class="text-[9px] font-bold text-slate-500 uppercase">Süre(dk/Adet)</span><input type="number" onchange="tempRouteState.steps[${i}].estimatedMinutes = parseFloat(this.value)" value="${step.estimatedMinutes}" class="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-700 text-center font-bold outline-none"></div><button onclick="removeRouteStepState(${i})" class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 mb-0.5 rounded-lg border border-transparent hover:border-red-200 transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>`;
    }).join('');
    lucide.createIcons();
}

function saveRouteState() {
    if (!tempRouteState.productName) return toast('Ad gerekli', 'error'); if (tempRouteState.steps.length === 0) return toast('Adım gerekli', 'error');
    for(let i=0; i<tempRouteState.steps.length; i++) { const s = tempRouteState.steps[i]; if(!s.stationId || !s.estimatedMinutes) return toast('Eksik bilgi', 'error'); s.stepOrder = s.stepOrder || (i + 1); }
    const routes = DB.get('product_routes');
    if (tempRouteState.id) { const idx = routes.findIndex(r => r.id === tempRouteState.id); if (idx >= 0) routes[idx] = tempRouteState; } 
    else { tempRouteState.id = DB.nextId('product_routes'); tempRouteState.isTemplate = true; routes.push(tempRouteState); }
    DB.set('product_routes', routes); closeModal(); toast('Rota eklendi'); render();
}
function deleteRoute(id) { confirmDialog('Silmek istediğinize emin misiniz?', () => { DB.set('product_routes', DB.get('product_routes').filter(r => r.id !== id)); toast('Rota silindi', 'info'); render(); }); }

