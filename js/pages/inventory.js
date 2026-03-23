// ============ INVENTORY / BOM ============
function renderInventory() {
  const materials = DB.get('materials'); const boms = DB.get('product_bom');
  const matRows = materials.map(m => `<tr class="border-b border-slate-100 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"><td class="py-2 px-3 font-mono text-primary-600">${m.code}</td><td class="py-2 px-3 font-medium">${m.name}</td><td class="py-2 px-3">${m.unit}</td><td class="py-2 px-3 text-right font-bold ${m.stock < 10 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}">${m.stock}</td><td class="py-2 px-3 text-right"><button onclick="editMaterial(${m.id})" class="p-1 text-slate-500 hover:bg-slate-200 rounded"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button><button onclick="deleteMaterial(${m.id})" class="p-1 text-red-500 hover:bg-red-50 rounded"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button></td></tr>`).join('');
  const bomCards = boms.map((b, bIndex) => {
    const items = b.materials.map(bm => { 
        const mat = materials.find(m => m.id === bm.materialId); 
        const stepLbl = bm.stepOrder ? `<span class="bg-indigo-50 text-indigo-600 px-1.5 rounded text-[9px] font-bold border border-indigo-100">Sıra ${bm.stepOrder}'da Çekilecek</span>` : `<span class="bg-slate-100 text-slate-500 px-1.5 rounded text-[9px] font-bold">Aşama Seçilmedi</span>`;
        return `<div class="flex justify-between items-center text-xs py-1.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0"><div class="flex flex-col"><span class="text-slate-600 dark:text-slate-300 font-medium">${mat ? mat.name : '?'}</span>${stepLbl}</div><span class="font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-primary-700 dark:text-primary-300">${bm.qtyPerUnit} ${mat ? mat.unit : ''}</span></div>`; 
    }).join('');
    return `<div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm"><div class="flex justify-between items-start mb-3"><div><h4 class="font-bold text-sm text-primary-700 dark:text-primary-400 flex items-center gap-2"><i data-lucide="box" class="w-4 h-4"></i> ${b.productName}</h4><div class="text-[10px] text-slate-500 mt-1 font-medium bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700 inline-block">Bağlı Rota Şablonu: ${b.baseRouteName || 'Yok'}</div></div><div class="flex gap-1"><button onclick="editBOM(${bIndex})" class="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button><button onclick="deleteBOM(${bIndex})" class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button></div></div>${items}</div>`;
  }).join('');

  return `<div class="max-w-7xl mx-auto space-y-6"><div class="grid grid-cols-1 lg:grid-cols-2 gap-6"><div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden self-start shadow-sm"><div class="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center"><h3 class="font-bold text-sm flex items-center gap-2"><i data-lucide="layers" class="w-4 h-4 text-primary-500"></i> Depo Stok Durumu</h3><button onclick="showMaterialModal()" class="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 shadow-sm flex items-center gap-1"><i data-lucide="plus" class="w-3 h-3"></i> Yeni Malzeme</button></div><table class="w-full text-left"><thead><tr class="text-xs font-semibold text-slate-500 border-b border-slate-200 dark:border-slate-700 uppercase bg-slate-50 dark:bg-slate-900/50"><th class="py-3 px-4">Kod</th><th class="py-3 px-4">Malzeme</th><th class="py-3 px-4">Birim</th><th class="py-3 px-4 text-right">Mevcut</th><th class="py-3 px-4 text-right">İşlem</th></tr></thead><tbody>${matRows || '<tr><td colspan="5" class="text-center py-6 text-sm text-slate-500">Kayıtlı malzeme bulunamadı.</td></tr>'}</tbody></table></div><div><div class="flex justify-between items-center mb-4"><h3 class="font-bold text-sm flex items-center gap-2"><i data-lucide="file-json" class="w-4 h-4 text-primary-500"></i> Ürün Reçeteleri (BOM)</h3><button onclick="showBOMModal()" class="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 shadow-sm flex items-center gap-1"><i data-lucide="plus" class="w-3 h-3"></i> Yeni Reçete</button></div><div class="space-y-4">${bomCards || '<div class="text-sm text-slate-500 text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">Kayıtlı reçete bulunamadı.</div>'}</div></div></div></div>`;
}

function showMaterialModal(id = null) {
   const materials = DB.get('materials'); const m = materials.find(x => x.id === id) || {};
   showModal(id ? 'Malzeme Düzenle' : 'Yeni Malzeme Ekle', `<div class="space-y-3"><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Malzeme Kodu</label><input id="f-matCode" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 focus:ring-2 outline-none" value="${m.code || ''}"></div><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Malzeme Adı</label><input id="f-matName" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 focus:ring-2 outline-none" value="${m.name || ''}"></div><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Birim</label><select id="f-matUnit" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 focus:ring-2 outline-none"><option value="adet" ${m.unit==='adet'?'selected':''}>Adet</option><option value="mm" ${m.unit==='mm'?'selected':''}>Milimetre (mm)</option><option value="kg" ${m.unit==='kg'?'selected':''}>Kilogram (kg)</option><option value="set" ${m.unit==='set'?'selected':''}>Set</option></select></div><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Mevcut Stok</label><input id="f-matStock" type="number" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 focus:ring-2 outline-none" value="${m.stock || 0}"></div></div>`, () => {
      m.code = document.getElementById('f-matCode').value; m.name = document.getElementById('f-matName').value; m.unit = document.getElementById('f-matUnit').value; m.stock = parseInt(document.getElementById('f-matStock').value) || 0;
      if(!id) { m.id = DB.nextId('materials'); materials.push(m); } DB.set('materials', materials); closeModal(); render(); toast('Malzeme kaydedildi');
   });
}
function editMaterial(id) { showMaterialModal(id); }
function deleteMaterial(id) { confirmDialog('Malzemeyi silmek istediğinize emin misiniz?', () => { DB.set('materials', DB.get('materials').filter(m => m.id !== id)); render(); toast('Malzeme silindi', 'info'); }); }

let tempBOMRouteSteps = [];
window.getStationName = function(id) { const st = DB.get('stations').find(s => s.id == id); return st ? st.name : 'Bilinmeyen İstasyon'; }
window.bomRouteChanged = function(routeName) { const routes = DB.get('product_routes'); const route = routes.find(r => r.productName === routeName && r.isTemplate); tempBOMRouteSteps = route ? route.steps : []; if(window.renderTempBOMItems) window.renderTempBOMItems(); }
window.bomItemRow = function(materials, routeSteps = [], selectedMatId = '', qty = 1, selectedStepOrder = '') {
   const matOpts = materials.map(m => `<option value="${m.id}" ${m.id == selectedMatId ? 'selected' : ''}>${m.name} (${m.unit})</option>`).join('');
   const stepOpts = routeSteps.map(s => `<option value="${s.stepOrder}" ${s.stepOrder == selectedStepOrder ? 'selected' : ''}>Sıra ${s.stepOrder} - ${window.getStationName(s.stationId)}</option>`).join('');
   return `<div class="flex items-center gap-2 mt-2 bom-item-row p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"><select class="bom-mat-select flex-1 px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 font-medium outline-none focus:ring-1"><option value="">Malzeme Seç...</option>${matOpts}</select><input type="number" class="bom-mat-qty w-20 px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 text-center font-bold outline-none focus:ring-1" placeholder="Miktar" value="${qty}" step="0.1" min="0.1"><select class="bom-step-select flex-1 px-2 py-1.5 text-[10px] border border-indigo-200 dark:border-indigo-800/50 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-tight outline-none focus:ring-1"><option value="">-- Depodan Ne Zaman Çekilecek? --</option>${stepOpts}</select><button onclick="this.parentElement.remove()" class="text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><i data-lucide="x" class="w-4 h-4"></i></button></div>`;
}

function showBOMModal(index = null) {
   const boms = DB.get('product_bom'); const materials = DB.get('materials'); const routes = DB.get('product_routes').filter(r => r.isTemplate); 
   if (routes.length === 0) return toast('Önce "Ürün Rotaları" sekmesinden bir rota şablonu oluşturun!', 'warning');
   const b = index !== null ? boms[index] : { productName: '', baseRouteName: '', materials: [] };
   const baseRoute = routes.find(r => r.productName === b.baseRouteName); tempBOMRouteSteps = baseRoute ? baseRoute.steps : [];
   const routeOpts = routes.map(r => `<option value="${r.productName}" ${r.productName === b.baseRouteName ? 'selected' : ''}>${r.productName}</option>`).join('');

   window.renderTempBOMItems = function() {
       let itemsHtml = b.materials.map(m => window.bomItemRow(materials, tempBOMRouteSteps, m.materialId, m.qtyPerUnit, m.stepOrder)).join('');
       if(!itemsHtml) itemsHtml = window.bomItemRow(materials, tempBOMRouteSteps);
       document.getElementById('bom-items').innerHTML = itemsHtml; lucide.createIcons();
   };

   showModal(index !== null ? 'Reçete ve Dağıtım Düzenle' : 'Yeni Reçete (BOM) & Rota Dağıtımı', `<div class="space-y-4"><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Ürün Adı</label><input id="f-bomProduct" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 font-bold focus:ring-2 outline-none" placeholder="Örn: Polis İHA" value="${b.productName}"></div><div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Bu Ürün Hangi Rotayı (Şablonu) Kullanacak?</label><select id="f-bomRoute" onchange="window.bomRouteChanged(this.value)" class="w-full mt-1 px-3 py-2 text-sm border border-blue-200 dark:border-blue-800/50 rounded-lg bg-blue-50 text-blue-800 font-bold dark:bg-blue-900/30 dark:text-blue-300 focus:ring-2 outline-none"><option value="">-- Rota Şablonu Seçiniz --</option>${routeOpts}</select></div><div class="pt-2 border-t border-slate-200 dark:border-slate-700"><div class="flex justify-between items-center mb-2"><label class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Malzemeler ve İstasyon Dağıtımı</label><button onclick="document.getElementById('bom-items').insertAdjacentHTML('beforeend', window.bomItemRow(DB.get('materials'), tempBOMRouteSteps)); lucide.createIcons();" class="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded border border-primary-200 dark:border-primary-800"><i data-lucide="plus" class="w-3 h-3"></i> Malzeme Ekle</button></div><p class="text-[10px] text-slate-400 mb-3 italic">Not: Bir malzemeyi hangi aşamada seçerseniz, terminaldeki operatör o aşamaya gelene kadar o malzeme depodan istenmez.</p><div id="bom-items" class="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 min-h-[100px] max-h-[35vh] overflow-y-auto custom-scrollbar"></div></div></div>`, () => {
      const pname = document.getElementById('f-bomProduct').value.trim(); const rname = document.getElementById('f-bomRoute').value;
      if(!pname) return toast('Ürün adı yazın', 'error'); if(!rname) return toast('Rota şablonu seçin', 'error'); 
      const newMats = [];
      document.querySelectorAll('.bom-item-row').forEach(r => { const mId = parseInt(r.querySelector('.bom-mat-select').value); const qty = parseFloat(r.querySelector('.bom-mat-qty').value); const sOrd = parseInt(r.querySelector('.bom-step-select').value) || null; if(mId && qty > 0) newMats.push({ materialId: mId, qtyPerUnit: qty, stepOrder: sOrd }); });
      if(newMats.length === 0) return toast('En az 1 malzeme ekleyin', 'error');
      
      const newBOM = { productId: b.productId || DB.nextId('product_bom'), productName: pname, baseRouteName: rname, materials: newMats };
      if(index !== null) boms[index] = newBOM; else boms.push(newBOM);
      DB.set('product_bom', boms); 
      
      const baseRoute = DB.get('product_routes').find(r => r.productName === rname && r.isTemplate);
      if (baseRoute) {
          const specificRoute = { id: DB.nextId('product_routes') + 1000, productName: pname, baseRouteName: rname, isTemplate: false, steps: JSON.parse(JSON.stringify(baseRoute.steps)) };
          const minStep = Math.min(...specificRoute.steps.map(s => parseInt(s.stepOrder) || 1));
          specificRoute.steps.forEach(s => { s.materials = newMats.filter(m => m.stepOrder === s.stepOrder || (!m.stepOrder && s.stepOrder === minStep)).map(m => ({ materialId: m.materialId, qtyPerUnit: m.qtyPerUnit })); });
          const allRoutes = DB.get('product_routes'); const existingIdx = allRoutes.findIndex(r => r.productName === pname && !r.isTemplate);
          if (existingIdx >= 0) allRoutes[existingIdx] = specificRoute; else allRoutes.push(specificRoute);
          DB.set('product_routes', allRoutes);
      }
      closeModal(); render(); toast('Reçete ve Rota Dağıtımı başarıyla kaydedildi!');
   });
   window.renderTempBOMItems();
}
function editBOM(index) { showBOMModal(index); }
function deleteBOM(index) { confirmDialog('Reçeteyi silmek istediğinize emin misiniz?', () => { const boms = DB.get('product_bom'); const pname = boms[index].productName; boms.splice(index, 1); DB.set('product_bom', boms); const routes = DB.get('product_routes').filter(r => !(r.productName === pname && !r.isTemplate)); DB.set('product_routes', routes); render(); toast('Reçete silindi', 'info'); }); }

