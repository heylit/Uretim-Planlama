// ============ PAGE: ORDERS ============
function renderOrders() {
  const orders = DB.get('customer_orders'); const filtered = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);
  const filters = [ { key:'all', label:'Tümü' }, { key:'new', label:'Yeni' }, { key:'production', label:'Üretimde' }, { key:'ready_to_ship', label:'Sevkiyat Bekliyor' }, { key:'shipped', label:'Sevk Edildi' } ];
  const filterBtns = filters.map(f => `<button onclick="orderFilter='${f.key}'; render();" class="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${orderFilter===f.key ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600'}">${f.label}</button>`).join('');
  const rows = filtered.map(o => `<tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm"><td class="py-3 px-4 font-mono font-medium text-primary-600">${o.orderNo}</td><td class="py-3 px-4">${o.customer}</td><td class="py-3 px-4">${o.product}</td><td class="py-3 px-4 text-right font-bold">${o.quantity}</td><td class="py-3 px-4">${formatDate(o.dueDate)}</td><td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(o.status)}">${statusLabel(o.status)}</span></td><td class="py-3 px-4">${o.workOrderId ? `<span class="text-xs font-mono text-primary-600">WO-${o.workOrderId}</span>` : '-'}</td><td class="py-3 px-4"><div class="flex items-center gap-1">${o.status === 'new' ? `<button onclick="planOrder(${o.id})" class="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100" title="Planla"><i data-lucide="play" class="w-3.5 h-3.5"></i></button>` : ''}<button onclick="editOrder(${o.id})" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button><button onclick="deleteOrder(${o.id})" class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button></div></td></tr>`).join('');
  return `<div class="max-w-7xl mx-auto space-y-4"><div class="flex flex-wrap items-center justify-between gap-3"><div class="flex gap-2 flex-wrap">${filterBtns}</div><button onclick="createOrder()" class="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"><i data-lucide="plus" class="w-4 h-4"></i> Yeni Sipariş</button></div><div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto"><table class="w-full text-left"><thead><tr class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-500 uppercase"><th class="py-3 px-4">Sipariş No</th><th class="py-3 px-4">Müşteri</th><th class="py-3 px-4">Ürün</th><th class="py-3 px-4 text-right">Miktar</th><th class="py-3 px-4">Teslim</th><th class="py-3 px-4">Durum</th><th class="py-3 px-4">İş Emri</th><th class="py-3 px-4">İşlem</th></tr></thead><tbody>${rows || `<tr><td colspan="8" class="text-center py-6 text-sm text-slate-500">Kayıt bulunamadı</td></tr>`}</tbody></table></div></div>`;
}

function orderFormHtml(o = {}) {
  const boms = DB.get('product_bom'); const productOptions = boms.map(b => `<option value="${b.productName}" ${o.product === b.productName ? 'selected' : ''}>${b.productName}</option>`).join('');
  return `<div class="space-y-3"><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Sipariş No</label><input id="f-orderNo" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 font-bold focus:ring-2 outline-none" value="${o.orderNo || ''}"></div><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Müşteri</label><input id="f-customer" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:ring-2 outline-none" value="${o.customer || ''}"></div><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Ürün (Reçeteli ve Rotalı)</label><select id="f-product" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:ring-2 outline-none"><option value="">Seçiniz...</option>${productOptions}</select></div><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Miktar</label><input id="f-quantity" type="number" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 font-bold text-center focus:ring-2 outline-none" value="${o.quantity || ''}"></div><div class="grid grid-cols-2 gap-3"><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Sipariş Tarihi</label><input id="f-orderDate" type="date" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700" value="${o.orderDate || new Date().toISOString().slice(0,10)}"></div><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Teslim Tarihi</label><input id="f-dueDate" type="date" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700" value="${o.dueDate || ''}"></div></div><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Durum</label><select id="f-status" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700"><option value="new" ${o.status==='new'?'selected':''}>Yeni</option><option value="planning" ${o.status==='planning'?'selected':''}>Planlama</option><option value="production" ${o.status==='production'?'selected':''}>Üretimde</option><option value="ready_to_ship" ${o.status==='ready_to_ship'?'selected':''}>Sevkiyata Hazır</option><option value="shipped" ${o.status==='shipped'?'selected':''}>Sevk Edildi</option></select></div><div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-start gap-2"><input type="checkbox" id="f-autoPlan" class="mt-0.5 w-4 h-4 text-primary-600 rounded" checked><label for="f-autoPlan" class="text-xs font-medium text-slate-600 dark:text-slate-400">Siparişi onaylayıp iş emri oluştur ve sıraya al.</label></div></div>`;
}

function createOrder() { 
  showModal('Yeni Sipariş', orderFormHtml(), () => { 
    const orders = DB.get('customer_orders'); const autoPlan = document.getElementById('f-autoPlan').checked; const newId = DB.nextId('customer_orders'); 
    orders.push({ id: newId, orderNo: document.getElementById('f-orderNo').value, customer: document.getElementById('f-customer').value, product: document.getElementById('f-product').value, quantity: parseInt(document.getElementById('f-quantity').value) || 0, orderDate: document.getElementById('f-orderDate').value, dueDate: document.getElementById('f-dueDate').value, status: document.getElementById('f-status').value, workOrderId: null }); 
    DB.set('customer_orders', orders); 
    closeModal(); 
    if (autoPlan) setTimeout(() => planOrder(newId), 300); 
    else { toast('Sipariş oluşturuldu'); render(); }
  }); 
}

function editOrder(id) { const orders = DB.get('customer_orders'); const o = orders.find(x => x.id === id); if (!o) return; showModal('Sipariş Düzenle', orderFormHtml(o), () => { o.orderNo = document.getElementById('f-orderNo').value; o.customer = document.getElementById('f-customer').value; o.product = document.getElementById('f-product').value; o.quantity = parseInt(document.getElementById('f-quantity').value) || 0; o.orderDate = document.getElementById('f-orderDate').value; o.dueDate = document.getElementById('f-dueDate').value; o.status = document.getElementById('f-status').value; DB.set('customer_orders', orders); closeModal(); toast('Sipariş güncellendi'); render(); }); }
function deleteOrder(id) { confirmDialog('Siparişi silmek?', () => { DB.set('customer_orders', DB.get('customer_orders').filter(o => o.id !== id)); toast('Sipariş silindi', 'info'); render(); }); }

function planOrder(id) {
  const orders = DB.get('customer_orders'); const o = orders.find(x => x.id === id); if (!o) return;
  const routes = DB.get('product_routes'); 
  const route = routes.find(r => r.productName === o.product && !r.isTemplate) || routes.find(r => r.productName === o.product);
  
  const wos = DB.get('work_orders'); const woId = DB.nextId('work_orders'); const woNo = `WO-2026-${String(woId).padStart(3,'0')}`;
  wos.push({ id: woId, orderNo: woNo, customerOrderId: o.id, customer: o.customer, product: o.product, quantity: o.quantity, priority: 'normal', status: 'pending', dueDate: o.dueDate, createdAt: new Date().toISOString().slice(0,10), queueIndex: wos.length }); 
  DB.set('work_orders', wos);
  
  if (route && route.steps.length > 0) {
    const allSteps = DB.get('work_order_steps'); 
    route.steps.forEach((tpl, idx) => { 
        const stepId = allSteps.length > 0 ? Math.max(...allSteps.map(s=>s.id)) + 1 : 1; 
        allSteps.push({ 
            id: stepId, workOrderId: woId, stationId: tpl.stationId, stepOrder: tpl.stepOrder || (idx + 1), 
            estimatedMinutes: tpl.estimatedMinutes, setupMinutes: tpl.setupMinutes || 0, 
            plannedStart: null, plannedEnd: null, actualStart: null, actualEnd: null, status: 'pending' 
        }); 
    });
    DB.set('work_order_steps', allSteps); 
    recalculateSchedules(); 
    toast(`İş emri oluşturuldu ve üretim sırasına yerleştirildi`, 'success');
  } else toast(`Rota bulunamadı`, 'warning');
  
  o.status = 'planning'; o.workOrderId = woId; DB.set('customer_orders', orders); navigateTo('work-orders');
}

