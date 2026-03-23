const DB = {
  get(key) { const data = localStorage.getItem('pp_' + key); try { return data ? JSON.parse(data) : []; } catch(e) { return []; } },
  set(key, data) { localStorage.setItem('pp_' + key, JSON.stringify(data)); },
  nextId(key) { const items = this.get(key); return items.length > 0 ? Math.max(...items.map(i => i.id || 0)) + 1 : 1; }
};

let currentUser = null; let currentStationId = null; let currentStepId = null;

function safeDate(d) { if(!d) return new Date(); const dt = new Date(d); return isNaN(dt.getTime()) ? new Date() : dt; }
function toast(message, type = 'success') {
  const tc = document.getElementById('toast-container'); const div = document.createElement('div');
  div.className = `${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white px-4 py-3 rounded-xl shadow-xl text-sm font-bold text-center mb-2 fade-in`;
  div.textContent = message; tc.appendChild(div); setTimeout(() => div.remove(), 3000);
}

// ==== VERİ MOTORU (OFİS v6.2 UYUMLU) ====
function getPlannedTimeFromRoute(productName, stationId) {
    const routes = DB.get('product_routes');
    const route = routes.find(r => r.productName === productName && !r.isTemplate) || routes.find(r => r.productName === productName);
    if (!route) return 0;
    const step = route.steps.find(s => parseInt(s.stationId) === parseInt(stationId));
    return step ? (parseInt(step.estimatedMinutes) || 0) : 0;
}

function getRequiredMaterialsForStep(wo, step) {
    const routes = DB.get('product_routes');
    const route = routes.find(r => r.productName === wo.product && !r.isTemplate) || routes.find(r => r.productName === wo.product);
    if(!route) return [];
    
    const rStep = route.steps.find(x => parseInt(x.stationId) === parseInt(step.stationId) && parseInt(x.stepOrder) === parseInt(step.stepOrder));
    if (rStep && rStep.materials && rStep.materials.length > 0) {
        return rStep.materials.map(m => ({ materialId: m.materialId, neededQty: m.qtyPerUnit * wo.quantity }));
    }
    return []; 
}

function getUserPerformance(userId) {
  const logs = DB.get('production_logs').filter(l => l.employeeId === userId);
  const steps = DB.get('work_order_steps'); const wos = DB.get('work_orders');
  let tPlan = 0; let tAct = 0;
  logs.forEach(log => {
    const step = steps.find(s => s.id === log.stepId); const wo = wos.find(w => w.id === step?.workOrderId);
    if(step && wo) { tPlan += (getPlannedTimeFromRoute(wo.product, step.stationId) / (wo.quantity || 1)) * log.quantity; tAct += (parseInt(log.duration) || 0); }
  });
  const todayQty = logs.filter(l => l.date?.startsWith(new Date().toISOString().slice(0,10))).reduce((s,l) => s + (parseInt(l.quantity)||0), 0);
  return { efficiency: tAct > 0 ? Math.round((tPlan / tAct) * 100) : 0, todayQty };
}

function goBack() { if (currentStepId) currentStepId = null; else if (currentStationId) currentStationId = null; render(); }
function login(empId) { currentUser = DB.get('employees').find(e => e.id === empId); render(); }
function logout() { currentUser = null; currentStationId = null; currentStepId = null; render(); }

function render() {
  const app = document.getElementById('app'); const sub = document.getElementById('header-subtitle'); const btn = document.getElementById('back-btn'); const prof = document.getElementById('user-profile');
  if (!currentUser) { prof.classList.add('hidden'); sub.textContent = "KİMLİK DOĞRULAMA"; app.innerHTML = renderLogin(); } 
  else {
    prof.classList.remove('hidden');
    if (currentUser.role === 'warehouse') { sub.textContent = "DEPO ONAY EKRANI"; app.innerHTML = renderWarehouse(); }
    else if (!currentStationId) { sub.textContent = "DURUM PANOSU"; app.innerHTML = renderOperatorDashboard(); }
    else if (!currentStepId) { btn.classList.remove('hidden'); sub.textContent = "İŞ LİSTESİ"; app.innerHTML = renderJobs(currentStationId); }
    else { btn.classList.remove('hidden'); sub.textContent = "ÜRETİM GİRİŞİ"; app.innerHTML = renderTerminal(currentStepId); }
  }
  lucide.createIcons();
}

function renderLogin() {
  return `<div class="mt-4 space-y-3 max-w-sm mx-auto">${DB.get('employees').filter(e => e.status === 'active').map(e => `<button onclick="login(${e.id})" class="w-full bg-white p-5 rounded-2xl shadow-sm border flex items-center gap-4 active:scale-95 transition"><div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-black">${e.name[0]}</div><div class="text-left font-bold text-slate-800">${e.name}<span class="block text-[10px] text-slate-400 uppercase font-black">${e.role === 'warehouse' ? 'DEPO' : 'ÜRETİM'}</span></div></button>`).join('')}</div>`;
}

function renderOperatorDashboard() {
  const perf = getUserPerformance(currentUser.id);
  const stations = DB.get('stations').filter(s => DB.get('station_assignments').filter(a => a.employeeId === currentUser.id).map(a => a.stationId).includes(s.id));
  const steps = DB.get('work_order_steps'); const wos = DB.get('work_orders'); const reqs = DB.get('material_requests'); const allStations = DB.get('stations');
  const routes = DB.get('product_routes');

  return `<div class="space-y-6">
      <div class="stat-card p-5 rounded-3xl text-white shadow-xl flex justify-between items-center">
        <div class="text-left"><div class="text-[9px] text-blue-400 font-black uppercase tracking-widest">Başarı Skorum</div><div class="text-4xl font-black">%${perf.efficiency}</div></div>
        <div class="text-right"><div class="text-[9px] text-slate-400 font-black uppercase tracking-widest">Bugün Çıkan</div><div class="text-2xl font-black">${perf.todayQty} ad</div></div>
      </div>
      <div class="space-y-4">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tezgah Durumları ve Kuyruk</p>
        ${stations.map(st => {
          const stationJobs = steps.filter(s => s.stationId === st.id && s.status !== 'completed');
          const queue = stationJobs.slice(0, 3).map((s, i) => {
             const wo = wos.find(w => w.id === s.workOrderId); const req = reqs.find(r => r.stepId === s.id);
             
             const route = routes.find(r => r.productName === wo?.product && !r.isTemplate) || routes.find(r => r.productName === wo?.product);
             const rStep = route?.steps.find(x => parseInt(x.stationId) === parseInt(s.stationId) && parseInt(x.stepOrder) === parseInt(s.stepOrder));
             const isParallel = rStep && rStep.dependency === 'parallel';

             const blocking = isParallel ? [] : steps.filter(x => x.workOrderId === s.workOrderId && parseInt(x.stepOrder||1) < parseInt(s.stepOrder||1) && x.status !== 'completed');
             
             let statusBadge = `<span class="text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">Sırada</span>`;
             if(isParallel && s.status === 'pending') statusBadge = `<span class="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">⚡ Paralel</span>`;
             
             if (blocking.length > 0) {
                 const bName = allStations.find(x => x.id === blocking.sort((a,b) => parseInt(a.stepOrder||1) - parseInt(b.stepOrder||1))[0].stationId)?.name || 'Önceki';
                 statusBadge = `<span class="text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded truncate max-w-[90px] inline-block"><i data-lucide="lock" class="w-3 h-3 inline"></i> ${bName}</span>`;
             } else if (s.status === 'in_progress') {
                 statusBadge = `<span class="text-indigo-600 font-black animate-pulse bg-indigo-50 px-1.5 py-0.5 rounded">⚙️ Çalışıyor</span>`;
             } else if (req) {
                 if (req.status === 'pending') statusBadge = `<span class="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">🕒 Depoda</span>`;
                 else if (req.status === 'prepared') statusBadge = `<span class="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">📦 Hazır</span>`;
             }

             return `<div class="flex justify-between items-center text-[10px] py-1 border-b border-slate-50 last:border-0"><span class="font-bold ${blocking.length>0?'text-slate-400':'text-slate-700'} truncate max-w-[120px]">${i+1}. ${wo?.product}</span>${statusBadge}</div>`;
          }).join('');

          return `<button onclick="currentStationId=${st.id}; render();" class="w-full bg-white p-5 rounded-3xl shadow-sm border flex flex-col text-left active:scale-95 transition"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><i data-lucide="factory" class="w-5 h-5"></i></div><div class="font-black text-lg text-slate-800">${st.name}</div></div><div class="bg-slate-50 p-2 px-3 rounded-xl w-full">${queue || '<span class="text-[10px] text-slate-400 italic">Bekleyen iş yok</span>'}</div></button>`;
        }).join('')}
      </div>
    </div>`;
}

function renderWarehouse() {
  const reqs = DB.get('material_requests').filter(r => r.status === 'pending').sort((a,b) => new Date(a.requiredDateTime) - new Date(b.requiredDateTime));
  const mats = DB.get('materials'); const wos = DB.get('work_orders'); const sts = DB.get('stations'); const emps = DB.get('employees');
  if(reqs.length === 0) return `<div class="text-center mt-20 text-slate-400 font-bold">Talep yok.</div>`;
  return `<div class="space-y-4">${reqs.map(req => {
    const wo = wos.find(w => w.id === req.woId); const reqBy = emps.find(e => e.id === req.requestedBy); let canApprove = true;
    const matHtml = (req.materials || []).map(rm => { const m = mats.find(x => x.id === rm.materialId); const ok = m && m.stock >= rm.neededQty; if(!ok) canApprove = false; return `<div class="flex justify-between text-xs py-1 border-b border-slate-100 last:border-0 ${ok?'':'text-red-600 font-bold'}"><span>${m?.name}</span><span>${rm.neededQty} / ${m?.stock||0} ${m?.unit||''}</span></div>`; }).join('');
    return `<div class="bg-white p-5 rounded-3xl border-l-8 border-amber-400 shadow-xl"><div class="flex justify-between mb-3 text-[10px] font-black uppercase text-slate-400"><span>${req.priority}</span><span>${new Date(req.requiredDateTime).toLocaleDateString('tr-TR')} ${req.requiredTime}</span></div><h3 class="font-black text-slate-800 leading-tight">${wo?.product}</h3><div class="text-[10px] text-slate-500 font-bold mt-1">İsteyen: ${reqBy?.name||'?'} • İstasyon: ${sts.find(s=>s.id===req.stationId)?.name}</div><div class="bg-slate-50 p-3 rounded-xl mb-4 mt-2 border">${matHtml}</div>${canApprove ? `<button onclick="approveRequest(${req.id})" class="w-full bg-slate-900 text-white font-black py-4 rounded-xl">HAZIRLA VE ONAYLA</button>` : `<div class="text-red-600 text-center text-xs font-black p-3">STOK YETERSİZ</div>`}</div>`;
  }).join('')}</div>`;
}

function approveRequest(id) {
  const reqs = DB.get('material_requests'); const req = reqs.find(r => r.id === id); const mats = DB.get('materials');
  req.materials.forEach(rm => { const m = mats.find(x => x.id === rm.materialId); if(m) m.stock -= rm.neededQty; });
  req.status = 'prepared'; DB.set('materials', mats); DB.set('material_requests', reqs); render();
}

function renderJobs(stId) {
  const allSteps = DB.get('work_order_steps'); const steps = allSteps.filter(s => s.stationId === stId && s.status !== 'completed');
  const wos = DB.get('work_orders'); const orders = DB.get('customer_orders'); const logs = DB.get('production_logs'); const allSts = DB.get('stations');
  const routes = DB.get('product_routes');

  const sorted = steps.map(s => {
    const wo = wos.find(w => w.id === s.workOrderId);
    const order = orders.find(o => o.id === wo?.customerOrderId);
    
    const route = routes.find(r => r.productName === wo?.product && !r.isTemplate) || routes.find(r => r.productName === wo?.product);
    const rStep = route?.steps.find(x => parseInt(x.stationId) === parseInt(s.stationId) && parseInt(x.stepOrder) === parseInt(s.stepOrder));
    const isParallel = rStep && rStep.dependency === 'parallel';

    const blocking = isParallel ? [] : allSteps.filter(prev => prev.workOrderId === s.workOrderId && parseInt(prev.stepOrder||1) < parseInt(s.stepOrder||1) && prev.status !== 'completed');
    let bMsg = ""; if(blocking.length > 0) { const bStep = blocking.sort((a,b) => parseInt(a.stepOrder||1) - parseInt(b.stepOrder||1))[0]; bMsg = allSts.find(x => x.id === bStep.stationId)?.name || 'Önceki'; }
    return { ...s, wo, order, isLocked: blocking.length > 0, bMsg, isParallel };
  }).sort((a,b) => safeDate(a.order?.dueDate) - safeDate(b.order?.dueDate));

  return `<div class="space-y-3">${sorted.map(s => {
    const done = logs.filter(l => l.stepId === s.id).reduce((sum, l) => sum + (parseInt(l.quantity)||0), 0);
    if (s.isLocked) return `<div class="w-full bg-slate-50 p-5 rounded-2xl shadow-inner border opacity-70 cursor-not-allowed relative overflow-hidden"><div class="absolute top-0 right-0 bg-red-100 text-red-500 text-[8px] font-black px-3 py-1 rounded-bl-lg uppercase flex items-center gap-1"><i data-lucide="lock" class="w-3 h-3"></i> ${s.bMsg} Bekleniyor</div><div class="mt-2 text-[10px] font-black text-slate-400">#${s.wo?.orderNo}</div><div class="font-black text-lg text-slate-500">${s.wo?.product}</div></div>`;
    return `<button onclick="currentStepId=${s.id}; render();" class="w-full bg-white p-5 rounded-2xl shadow-sm border ${s.status==='in_progress'?'border-blue-400 ring-2 ring-blue-50':''} text-left active:scale-95 transition"><div class="flex justify-between items-center mb-1"><div class="flex gap-1 items-center"><span class="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">#${s.wo?.orderNo}</span>${s.isParallel && s.status==='pending' ? '<span class="text-[9px] font-black text-green-600 bg-green-50 px-1 py-0.5 rounded">Paralel</span>' : ''}</div><span class="text-[10px] font-bold text-slate-400 uppercase">${safeDate(s.order?.dueDate).toLocaleDateString('tr-TR')}</span></div><div class="font-black text-lg text-slate-800">${s.wo?.product}</div><div class="flex justify-between text-[11px] font-black mt-3 text-slate-600"><span>%${Math.round((done/(s.wo?.quantity||1))*100)} Yapıldı</span><span>${done}/${s.wo?.quantity}</span></div></button>`;
  }).join('')}</div>`;
}

function renderTerminal(stepId) {
  const s = DB.get('work_order_steps').find(x => x.id === stepId); const wo = DB.get('work_orders').find(w => w.id === s.workOrderId);
  const req = DB.get('material_requests').find(r => r.stepId === stepId); const logs = DB.get('production_logs').filter(l => l.stepId === stepId);
  const done = logs.reduce((sum, l) => sum + (parseInt(l.quantity)||0), 0); const remaining = (wo?.quantity || 0) - done;
  
  const plannedPerUnit = getPlannedTimeFromRoute(wo?.product, s.stationId) / (wo?.quantity || 1);
  const reqMats = getRequiredMaterialsForStep(wo, s);
  const needsMat = reqMats.length > 0;
  const allMats = DB.get('materials');
  
  let html = `<div class="bg-white p-5 rounded-3xl border shadow-sm mb-4"><h2 class="text-xl font-black text-slate-800 leading-tight">${wo?.product}</h2><div class="flex justify-between text-[11px] font-black mt-4 text-slate-500 uppercase tracking-widest"><span> YAPILAN: ${done} / ${wo?.quantity}</span><span>KALAN: ${remaining}</span></div></div>`;

  if (s.status === 'pending') {
    if (needsMat) {
        if(!req) {
          // İSTEMEDEN ÖNCE MALZEMELERİ LİSTELE
          const preReqMatsHtml = reqMats.map(rm => {
              const m = allMats.find(x => x.id === rm.materialId);
              return `<div class="flex justify-between text-[11px] py-1.5 border-b border-amber-100/50 last:border-0"><span class="font-medium text-amber-900">${m?.name}</span><span class="font-bold text-amber-700">${rm.neededQty} ${m?.unit||''}</span></div>`;
          }).join('');

          html += `<div class="bg-white p-5 rounded-2xl border-2 border-amber-400 space-y-4">
            <div>
               <h3 class="font-black text-amber-600 text-sm uppercase flex items-center gap-1"><i data-lucide="package"></i> Malzeme Talebi</h3>
               <p class="text-[10px] text-slate-500 font-bold mt-1 leading-tight">Bu aşama için depodan aşağıdaki malzemelerin çekilmesi gerekiyor.</p>
            </div>
            
            <div class="bg-amber-50 p-3 rounded-xl border border-amber-100">
               <div class="text-[9px] font-black text-amber-700 uppercase mb-2 opacity-70">İstenecek Malzemeler</div>
               ${preReqMatsHtml}
            </div>

            <div class="grid grid-cols-2 gap-3 mt-4"><div><label class="text-[9px] font-bold text-slate-400 uppercase">Gün</label><input type="date" id="req-date" value="${new Date().toISOString().slice(0,10)}" min="${new Date().toISOString().slice(0,10)}" class="w-full p-2 bg-slate-50 border rounded-lg font-bold"></div><div><label class="text-[9px] font-bold text-slate-400 uppercase">Saat</label><input type="time" id="req-time" value="08:00" class="w-full p-2 bg-slate-50 border rounded-lg font-bold text-center"></div></div><select id="req-priority" class="w-full p-3 bg-slate-50 border rounded-xl font-bold text-sm"><option value="normal">Normal</option><option value="urgent">Acil</option><option value="critical">Çok Acil</option></select>
            <button onclick="sendRequest(${stepId})" class="w-full bg-amber-500 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition">DEPODAN İSTE</button>
          </div>`;
        } else if (req.status === 'pending') {
          // BEKLERKEN DETAYLI LİSTE
          const pendingMatsHtml = (req.materials || []).map(rm => {
              const m = allMats.find(x => x.id === rm.materialId);
              return `<div class="flex justify-between text-[11px] py-1 border-b border-blue-100 last:border-0"><span class="font-medium text-blue-900">${m?.name}</span><span class="font-bold text-blue-700">${rm.neededQty} ${m?.unit||''}</span></div>`;
          }).join('');

          html += `<div class="bg-blue-50 p-6 rounded-3xl border-2 border-blue-200 text-center space-y-4">
             <i data-lucide="loader" class="animate-spin mx-auto text-blue-500 w-8 h-8"></i>
             <p class="font-black text-blue-800 uppercase text-xs">Depo Hazırlıyor</p>
             <div class="text-left bg-white p-3 rounded-xl border border-blue-100">${pendingMatsHtml}</div>
          </div>`;
        } else {
          // MALZEMELER GELDİ VE ONAYLANDI (HAZIR)
          const readyMatsHtml = (req.materials || []).map(rm => {
              const m = allMats.find(x => x.id === rm.materialId);
              return `<div class="flex justify-between text-[11px] py-1 border-b border-green-100 last:border-0"><span class="font-medium text-green-900">${m?.name}</span><span class="font-bold text-green-700">${rm.neededQty} ${m?.unit||''}</span></div>`;
          }).join('');

          html += `<div class="bg-green-50 p-6 rounded-3xl border-2 border-green-200 text-center mb-4 space-y-3">
             <i data-lucide="package-check" class="mx-auto text-green-500 w-8 h-8"></i>
             <p class="font-black text-green-800 uppercase text-xs">Malzemeler Hazır</p>
             <div class="text-left bg-white p-3 rounded-xl border border-green-100 shadow-sm">${readyMatsHtml}</div>
          </div>`;

          html += `<button onclick="startJob(${stepId})" class="w-full bg-green-500 text-white font-black text-xl py-10 rounded-3xl shadow-xl active:scale-95 transition flex items-center justify-center gap-3"><i data-lucide="play-circle"></i> ÜRETİME BAŞLA</button>`;
        }
    } else {
        html += `<div class="bg-indigo-50 p-4 rounded-2xl mb-4 border border-indigo-100 text-center"><i data-lucide="route" class="w-8 h-8 text-indigo-400 mx-auto mb-2"></i><p class="text-[10px] font-bold text-indigo-700">Bu aşama için özel malzeme gerekmiyor.</p></div><button onclick="startJob(${stepId})" class="w-full bg-green-500 text-white font-black text-xl py-10 rounded-3xl shadow-xl active:scale-95 transition flex items-center justify-center gap-3"><i data-lucide="play-circle"></i> DOĞRUDAN BAŞLA</button>`;
    }
  } else {
    const now = new Date();
    let startTime = new Date(s.actualStart);
    if(logs.length > 0) startTime = new Date(logs[logs.length-1].date);
    const autoDur = Math.max(1, Math.round((now - startTime) / 60000));
    
    const currentTargetTotal = plannedPerUnit * remaining;
    const currentEff = autoDur > 0 ? Math.round((currentTargetTotal / autoDur) * 100) : 0;

    html += `
    <div class="space-y-4">
      <div class="bg-white p-5 rounded-3xl shadow-lg border-2 border-blue-500 space-y-5">
        <div class="bg-slate-900 text-white p-4 rounded-2xl shadow-inner grid grid-cols-2 gap-4">
           <div><div class="text-[8px] text-slate-400 font-bold uppercase mb-1">Standart Süre</div><div class="text-xl font-black">${plannedPerUnit.toFixed(1)} <span class="text-[10px] font-normal">DK/AD</span></div></div>
           <div class="text-right"><div class="text-[8px] text-blue-400 font-bold uppercase mb-1">Geçen Süre</div><div class="text-2xl font-black text-blue-400" id="live-timer">${autoDur} <span class="text-[10px] font-normal">DK</span></div><input type="hidden" id="t-dur" value="${autoDur}"></div>
        </div>
        <div>
          <label class="text-[10px] font-black text-slate-400 uppercase mb-3 block text-center">ŞİMDİ TESLİM EDİLEN MİKTAR</label>
          <div class="flex items-center gap-3 mb-6">
             <button onclick="changeQty(-1)" class="w-14 h-14 bg-slate-100 rounded-xl font-black text-2xl active:bg-slate-200">-</button>
             <input type="number" id="t-qty" value="${remaining}" data-planned="${plannedPerUnit}" data-dur="${autoDur}" oninput="updateLiveStats()" class="flex-1 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-4xl font-black text-center text-slate-800 outline-none">
             <button onclick="changeQty(1)" class="w-14 h-14 bg-slate-100 rounded-xl font-black text-2xl active:bg-slate-200">+</button>
          </div>
        </div>
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
           <div class="text-[10px] font-bold text-slate-500 mt-1">Anlık Verimliliğin: <span id="eff-display" class="${currentEff >= 100 ? 'text-green-500' : 'text-amber-500'} font-black">%${currentEff}</span></div>
        </div>
        <button onclick="saveProductionEntry(${stepId})" class="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-lg active:scale-95 transition flex justify-center items-center gap-2"><i data-lucide="save"></i> KAYDET VE DEVAM ET</button>
      </div>
      <button onclick="closeStepFinal(${stepId})" class="w-full text-red-600 font-black text-xs p-4 flex items-center justify-center gap-1 uppercase opacity-70"><i data-lucide="power" class="w-4 h-4"></i> İSTASYONU KAPAT</button>
    </div>`;
  }
  return html;
}

window.changeQty = function(v) { const inp = document.getElementById('t-qty'); inp.value = Math.max(1, (parseInt(inp.value)||0)+v); updateLiveStats(); };
window.updateLiveStats = function() {
  const inp = document.getElementById('t-qty'); const effDisplay = document.getElementById('eff-display');
  const eff = parseFloat(inp.dataset.dur) > 0 ? Math.round((parseFloat(inp.dataset.planned) * (parseInt(inp.value)||0) / parseFloat(inp.dataset.dur)) * 100) : 0;
  if(effDisplay) { effDisplay.textContent = '%' + eff; effDisplay.className = eff >= 100 ? 'text-green-500 font-black' : 'text-amber-500 font-black'; }
};

function saveProductionEntry(stepId) {
  const qty = parseInt(document.getElementById('t-qty').value); const dur = parseInt(document.getElementById('t-dur').value); 
  if(!qty || qty <= 0) return toast('Miktar girin!', 'error');
  const logs = DB.get('production_logs'); logs.push({ id: DB.nextId('production_logs'), stepId, employeeId: currentUser.id, date: new Date().toISOString(), duration: dur, quantity: qty }); DB.set('production_logs', logs); toast(`+${qty} adet kaydedildi.`);
  const wo = DB.get('work_orders').find(w => w.id === DB.get('work_order_steps').find(x => x.id === stepId).workOrderId);
  if(logs.filter(l => l.stepId === stepId).reduce((s, l) => s + (parseInt(l.quantity)||0), 0) >= wo.quantity) { if(confirm("Tüm parçalar bitti. İstasyon kapatılsın mı?")) closeStepFinal(stepId); } else render();
}

function closeStepFinal(stepId) {
  const steps = DB.get('work_order_steps'); const s = steps.find(x => x.id === stepId); s.status = 'completed'; s.actualEnd = new Date().toISOString(); DB.set('work_order_steps', steps);
  const wos = DB.get('work_orders'); const wo = wos.find(w => w.id === s.workOrderId);
  if (steps.filter(x => x.workOrderId === wo.id).every(x => x.status === 'completed')) {
    const allWOs = DB.get('work_orders'); allWOs.find(x => x.id === wo.id).status = 'completed'; DB.set('work_orders', allWOs);
    const ords = DB.get('customer_orders'); const o = ords.find(x => x.id === wo.customerOrderId); if(o) { o.status = 'ready_to_ship'; DB.set('customer_orders', ords); }
  }
  toast('Kapatıldı.'); currentStepId = null; render();
}

function sendRequest(stepId) {
  const date = document.getElementById('req-date').value; const time = document.getElementById('req-time').value;
  const s = DB.get('work_order_steps').find(x => x.id === stepId); const wo = DB.get('work_orders').find(w => w.id === s.workOrderId);
  const reqMats = getRequiredMaterialsForStep(wo, s); if(reqMats.length === 0) return toast('Malzeme gerekmiyor.', 'error');
  const reqs = DB.get('material_requests');
  reqs.push({ id: DB.nextId('material_requests'), stepId, woId: wo.id, stationId: currentStationId, requestedBy: currentUser.id, requiredDateTime: `${date}T${time}:00`, requiredTime: time, priority: document.getElementById('req-priority').value, status: 'pending', materials: reqMats });
  DB.set('material_requests', reqs); toast('Talep gönderildi.'); render();
}

function startJob(stepId) {
  const steps = DB.get('work_order_steps'); const s = steps.find(x => x.id === stepId); s.status = 'in_progress'; s.actualStart = new Date().toISOString(); DB.set('work_order_steps', steps);
  const wos = DB.get('work_orders'); const wo = wos.find(w => w.id === s.workOrderId); wo.status = 'in_progress'; DB.set('work_orders', wos);
  const ords = DB.get('customer_orders'); const o = ords.find(x => x.id === wo.customerOrderId); if(o) { o.status = 'production'; DB.set('customer_orders', ords); }
  render();
}

render();
