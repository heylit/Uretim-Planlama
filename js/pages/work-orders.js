// ============ PAGE: WORK ORDERS (DRAG & DROP) ============
let draggedWOId = null;

function dragWO(ev, id) { draggedWOId = id; ev.dataTransfer.effectAllowed = "move"; ev.target.style.opacity = "0.5"; }
function allowDropWO(ev) { ev.preventDefault(); const row = ev.target.closest('tr'); if(row && row.draggable) { row.classList.add('drag-over'); } }
function leaveDropWO(ev) { const row = ev.target.closest('tr'); if(row) { row.classList.remove('drag-over'); } }
function dropWO(ev, targetId) {
    ev.preventDefault(); const row = ev.target.closest('tr'); if(row) row.classList.remove('drag-over');
    if (draggedWOId === targetId) return;
    
    let wos = DB.get('work_orders');
    wos.forEach((w,i) => { if(w.queueIndex === undefined) w.queueIndex = i; });
    wos = wos.sort((a,b) => a.queueIndex - b.queueIndex);
    
    const draggedIdx = wos.findIndex(w => w.id === draggedWOId);
    const targetIdx = wos.findIndex(w => w.id === targetId);
    
    if(draggedIdx > -1 && targetIdx > -1) {
        const [draggedItem] = wos.splice(draggedIdx, 1);
        wos.splice(targetIdx, 0, draggedItem);
        wos.forEach((w, i) => w.queueIndex = i);
        DB.set('work_orders', wos);
        
        recalculateSchedules(); 
        toast('Üretim öncelik sırası değiştirildi ve Gantt planı güncellendi!', 'success');
        render();
    }
}

function startStep(stepId) {
  const steps = DB.get('work_order_steps'); const s = steps.find(x => x.id === stepId);
  s.status = 'in_progress'; s.actualStart = new Date().toISOString(); 
  const wos = DB.get('work_orders'); const wo = wos.find(w => w.id === s.workOrderId);
  wo.status = 'in_progress'; DB.set('work_orders', wos); DB.set('work_order_steps', steps);
  if(wo.customerOrderId) { const orders = DB.get('customer_orders'); const o = orders.find(x => x.id === wo.customerOrderId); if(o && o.status !== 'production') { o.status = 'production'; DB.set('customer_orders', orders); } }
  toast('Adım başlatıldı'); render();
}

function completeStep(stepId) {
  const steps = DB.get('work_order_steps'); const s = steps.find(x => x.id === stepId);
  s.status = 'completed'; s.actualEnd = new Date().toISOString(); DB.set('work_order_steps', steps);
  const wos = DB.get('work_orders'); const wo = wos.find(w => w.id === s.workOrderId);
  if (steps.filter(x => x.workOrderId === wo.id).every(x => x.status === 'completed')) { 
     wo.status = 'completed'; DB.set('work_orders', wos); 
     if(wo.customerOrderId) { const orders = DB.get('customer_orders'); const o = orders.find(x => x.id === wo.customerOrderId); if(o) { o.status = 'ready_to_ship'; DB.set('customer_orders', orders); } }
  }
  recalculateSchedules();
  toast('Adım tamamlandı, planlar güncellendi'); render();
}

function renderWorkOrders() {
  let wos = DB.get('work_orders'); 
  wos.forEach((w,i) => { if(w.queueIndex === undefined) w.queueIndex = i; });
  wos = wos.sort((a,b) => a.queueIndex - b.queueIndex);
  
  const steps = DB.get('work_order_steps'); const stations = DB.get('stations'); const logs = DB.get('production_logs');
  
  const rows = wos.map((wo, index) => {
    const woSteps = steps.filter(s => s.workOrderId === wo.id).sort((a,b) => a.stepOrder - b.stepOrder); const isExpanded = expandedWorkOrders.has(wo.id);
    let expandedHtml = '';
    if (isExpanded) {
      const stepsHtml = woSteps.map((s) => {
        const st = stations.find(x => x.id === s.stationId); const stepLogs = logs.filter(l => l.stepId === s.id); const totalProduced = stepLogs.reduce((sum, l) => sum + l.quantity, 0); const isComplete = s.status === 'completed'; const progressPct = wo.quantity > 0 ? Math.min(100, Math.round((totalProduced / wo.quantity) * 100)) : 0;
        return `<div class="flex items-center gap-4 py-3 px-4 border-t border-slate-100 dark:border-slate-700 text-sm"><span class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0">${s.stepOrder}</span><span class="w-32 font-medium">${st ? st.name : '?'}</span><div class="flex-1 max-w-[200px]"><div class="flex justify-between text-[10px] mb-1 text-slate-500"><span>İlerleme</span><span class="font-bold text-slate-700 dark:text-slate-300">${totalProduced} / ${wo.quantity}</span></div><div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5"><div class="${isComplete ? 'bg-green-500' : 'bg-primary-500'} h-1.5 rounded-full" style="width:${progressPct}%"></div></div></div><span class="w-40 text-[10px] text-center font-mono opacity-80">${formatDateTime(s.plannedStart)} <br> ${formatDateTime(s.plannedEnd)}</span><span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(s.status)}">${statusLabel(s.status)}</span><div class="flex gap-2 ml-auto">${s.status === 'pending' ? `<button onclick="startStep(${s.id})" class="px-3 py-1 rounded bg-green-500 text-white text-[10px] font-bold">Başlat</button>` : ''}${s.status === 'in_progress' ? `<button onclick="completeStep(${s.id})" class="px-3 py-1 rounded bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold">İşi Kapat</button>` : ''}<button onclick="deleteStep(${s.id})" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><i data-lucide="trash" class="w-3.5 h-3.5"></i></button></div></div>`;
      }).join('');
      expandedHtml = `<tr><td colspan="8" class="p-0"><div class="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700 shadow-inner">${stepsHtml}</div></td></tr>`;
    }
    return `<tr draggable="true" ondragstart="dragWO(event, ${wo.id})" ondragover="allowDropWO(event)" ondragleave="leaveDropWO(event)" ondrop="dropWO(event, ${wo.id})" ondragend="this.style.opacity='1'" class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm cursor-move transition-colors" title="Sırasını değiştirmek için sürükleyin"><td class="py-3 px-4"><div class="flex items-center gap-2"><i data-lucide="grip-vertical" class="w-4 h-4 text-slate-400"></i> <i data-lucide="${isExpanded ? 'chevron-down' : 'chevron-right'}" class="w-4 h-4 text-primary-500 cursor-pointer" onclick="toggleWO(${wo.id})"></i></div></td><td class="py-3 px-4 font-mono font-bold text-primary-600"><div class="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Kuyruk: ${index+1}</div>${wo.orderNo}</td><td class="py-3 px-4 font-medium">${wo.product}</td><td class="py-3 px-4 text-right font-black">${wo.quantity}</td><td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(wo.status)}">${statusLabel(wo.status)}</span></td><td class="py-3 px-4 text-xs font-medium">${formatDate(wo.dueDate)}</td><td class="py-3 px-4 text-center text-xs font-medium">${woSteps.length} Adım</td><td class="py-3 px-4" onclick="event.stopPropagation()"><button onclick="deleteWorkOrder(${wo.id})" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td></tr>${expandedHtml}`;
  }).join('');
  
  return `<div class="max-w-7xl mx-auto space-y-4"><div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-3 flex items-center gap-3 text-sm text-blue-800 dark:text-blue-300"><i data-lucide="info" class="w-5 h-5 text-blue-600"></i> <span>Aşağıdaki listeden iş emirlerini <b>tutup sürükleyerek</b> üretim önceliğini değiştirebilirsiniz. Sistem yeni sıraya göre İstasyon planlarını (Gantt) otomatik güncelleyecektir.</span></div><div class="flex justify-between items-end"><div><h2 class="text-lg font-bold">İş Emirleri & Üretim Sırası</h2></div><button onclick="createWorkOrder()" class="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow hover:bg-primary-700 transition-colors"><i data-lucide="plus" class="w-4 h-4"></i> Yeni İş Emri</button></div><div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto"><table class="w-full text-left"><thead><tr class="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900"><th class="py-3 px-4 w-12 text-center">Sırala</th><th class="py-3 px-4">İş Emri</th><th class="py-3 px-4">Ürün</th><th class="py-3 px-4 text-right">Miktar</th><th class="py-3 px-4">Durum</th><th class="py-3 px-4">Teslim</th><th class="py-3 px-4 text-center">Rota</th><th class="py-3 px-4">İşlem</th></tr></thead><tbody>${rows || `<tr><td colspan="8" class="text-center py-6 text-sm text-slate-500">Kayıt bulunamadı.</td></tr>`}</tbody></table></div></div>`;
}

function toggleWO(id) { expandedWorkOrders.has(id) ? expandedWorkOrders.delete(id) : expandedWorkOrders.add(id); render(); }
function woOrderChanged(orderId) { if (!orderId) return; const o = DB.get('customer_orders').find(x => x.id == orderId); if (o) { document.getElementById('f-woCustomer').value = o.customer || ''; document.getElementById('f-woProduct').value = o.product || ''; document.getElementById('f-woQty').value = o.quantity || ''; } }
function workOrderFormHtml(wo = {}) {
  const orders = DB.get('customer_orders'); const orderOpts = orders.map(o => `<option value="${o.id}" ${wo.customerOrderId===o.id?'selected':''}>${o.orderNo} - ${o.customer}</option>`).join('');
  const boms = DB.get('product_bom'); const productOpts = boms.map(b => `<option value="${b.productName}" ${wo.product === b.productName ? 'selected' : ''}>${b.productName}</option>`).join('');
  return `<div class="space-y-3"><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">İş Emri No</label><input id="f-woNo" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg font-bold text-primary-600 focus:ring-2 outline-none" value="${wo.orderNo || `WO-2026-${Math.floor(Math.random()*1000)}`}"></div><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Müşteri Siparişi</label><select id="f-woOrder" onchange="woOrderChanged(this.value)" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:ring-2 outline-none"><option value="">Seçiniz</option>${orderOpts}</select></div><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Müşteri</label><input id="f-woCustomer" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:ring-2 outline-none" value="${wo.customer || ''}"></div><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Ürün (Reçeteli)</label><select id="f-woProduct" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg font-bold focus:ring-2 outline-none"><option value="">Seçiniz...</option>${productOpts}</select></div><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Miktar</label><input id="f-woQty" type="number" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg font-bold text-center focus:ring-2 outline-none" value="${wo.quantity || ''}"></div></div>`;
}

function createWorkOrder() {
  showModal('Yeni İş Emri Oluştur', workOrderFormHtml(), () => {
    const wos = DB.get('work_orders'); const productName = document.getElementById('f-woProduct').value; const qty = parseInt(document.getElementById('f-woQty').value) || 0;
    if(!productName || qty <= 0) return toast('Ürün ve miktar giriniz', 'error');
    
    const woId = DB.nextId('work_orders'); 
    wos.push({ id: woId, orderNo: document.getElementById('f-woNo').value, customerOrderId: parseInt(document.getElementById('f-woOrder').value) || null, customer: document.getElementById('f-woCustomer').value, product: productName, quantity: qty, status: 'pending', createdAt: new Date().toISOString().slice(0,10), queueIndex: wos.length }); 
    DB.set('work_orders', wos);
    
    const routes = DB.get('product_routes'); const route = routes.find(r => r.productName === productName && !r.isTemplate) || routes.find(r => r.productName === productName);
    if (route && route.steps.length > 0) {
      const allSteps = DB.get('work_order_steps'); 
      route.steps.forEach((tpl, idx) => { 
          const stepId = allSteps.length > 0 ? Math.max(...allSteps.map(s=>s.id)) + 1 : 1; 
          allSteps.push({ id: stepId, workOrderId: woId, stationId: tpl.stationId, stepOrder: tpl.stepOrder || (idx + 1), estimatedMinutes: tpl.estimatedMinutes, setupMinutes: tpl.setupMinutes || 0, plannedStart: null, plannedEnd: null, status: 'pending' }); 
      });
      DB.set('work_order_steps', allSteps); 
      recalculateSchedules(); 
      toast('İş emri oluşturuldu ve planlandı');
    } 
    expandedWorkOrders.add(woId); closeModal(); render();
  });
}

function deleteWorkOrder(id) { confirmDialog('Silmek istediğinize emin misiniz?', () => { DB.set('work_orders', DB.get('work_orders').filter(w => w.id !== id)); DB.set('work_order_steps', DB.get('work_order_steps').filter(s => s.workOrderId !== id)); recalculateSchedules(); toast('Silindi', 'info'); render(); }); }
function deleteStep(stepId) { confirmDialog('Adımı silmek?', () => { DB.set('work_order_steps', DB.get('work_order_steps').filter(s => s.id !== stepId)); recalculateSchedules(); toast('Adım silindi', 'info'); render(); }); }

