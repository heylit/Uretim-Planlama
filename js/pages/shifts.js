// ============ PAGE: SHIFTS (VARDİYALAR) ============
function renderShifts() {
    const shifts = DB.get('shifts');
    const dayNames = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
    
    const rows = shifts.map(sh => {
        const activeDays = [1,2,3,4,5,6,0].map(d => {
            const isActive = sh.days.includes(d);
            return `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-400 opacity-50'}">${dayNames[d]}</span>`;
        }).join(' ');
        
        return `<tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm">
            <td class="py-3 px-4 font-bold text-primary-600">${sh.name}</td>
            <td class="py-3 px-4 font-mono font-bold">${sh.startTime}</td>
            <td class="py-3 px-4 font-mono font-bold">${sh.endTime}</td>
            <td class="py-3 px-4 flex gap-1 flex-wrap">${activeDays}</td>
            <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1">
                    <button onclick="editShift(${sh.id})" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button onclick="deleteShift(${sh.id})" class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    return `<div class="max-w-7xl mx-auto space-y-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-3 flex items-center gap-3 text-sm text-blue-800 dark:text-blue-300 mb-4">
            <i data-lucide="clock" class="w-5 h-5 text-blue-600"></i> 
            <span>Burada tanımladığınız vardiyaları <b>İstasyonlar</b> sayfasında makinelere atayarak her makinenin çalışma saatlerini ve günlük kapasitesini kusursuz hesaplatabilirsiniz. (Gece vardiyaları desteklenmektedir)</span>
        </div>
        <div class="flex justify-between items-end">
            <h2 class="text-lg font-bold">Vardiya ve Mesai Ayarları</h2>
            <button onclick="createShift()" class="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow hover:bg-primary-700 transition-colors"><i data-lucide="plus" class="w-4 h-4"></i> Yeni Vardiya</button>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm">
            <table class="w-full text-left">
                <thead><tr class="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50"><th class="py-3 px-4">Vardiya Adı</th><th class="py-3 px-4">Başlangıç</th><th class="py-3 px-4">Bitiş</th><th class="py-3 px-4">Çalışma Günleri</th><th class="py-3 px-4 text-right">İşlem</th></tr></thead>
                <tbody>${rows || `<tr><td colspan="5" class="text-center py-6 text-sm text-slate-500">Vardiya kaydı bulunamadı.</td></tr>`}</tbody>
            </table>
        </div>
    </div>`;
}

function shiftFormHtml(sh = {}) {
    const days = sh.days || [1,2,3,4,5]; 
    const isDayChecked = (d) => days.includes(d) ? 'checked' : '';
    return `<div class="space-y-4">
        <div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Vardiya Adı</label><input id="f-shName" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 font-bold focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Örn: 1. Vardiya" value="${sh.name || ''}"></div>
        <div class="grid grid-cols-2 gap-4">
            <div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Başlangıç Saati</label><input type="time" id="f-shStart" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 font-mono font-bold text-center focus:ring-2 focus:ring-primary-500 outline-none" value="${sh.startTime || '08:00'}"></div>
            <div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Bitiş Saati</label><input type="time" id="f-shEnd" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 font-mono font-bold text-center focus:ring-2 focus:ring-primary-500 outline-none" value="${sh.endTime || '16:00'}"></div>
        </div>
        <div>
            <label class="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-2">Çalışma Günleri</label>
            <div class="flex flex-wrap gap-2">
                <label class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"><input type="checkbox" class="sh-day-chk accent-primary-600 w-4 h-4" value="1" ${isDayChecked(1)}> <span class="text-xs font-bold">Pzt</span></label>
                <label class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"><input type="checkbox" class="sh-day-chk accent-primary-600 w-4 h-4" value="2" ${isDayChecked(2)}> <span class="text-xs font-bold">Sal</span></label>
                <label class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"><input type="checkbox" class="sh-day-chk accent-primary-600 w-4 h-4" value="3" ${isDayChecked(3)}> <span class="text-xs font-bold">Çar</span></label>
                <label class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"><input type="checkbox" class="sh-day-chk accent-primary-600 w-4 h-4" value="4" ${isDayChecked(4)}> <span class="text-xs font-bold">Per</span></label>
                <label class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"><input type="checkbox" class="sh-day-chk accent-primary-600 w-4 h-4" value="5" ${isDayChecked(5)}> <span class="text-xs font-bold">Cum</span></label>
                <label class="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-orange-100 transition shadow-sm"><input type="checkbox" class="sh-day-chk accent-orange-600 w-4 h-4" value="6" ${isDayChecked(6)}> <span class="text-xs font-bold text-orange-700 dark:text-orange-400">Cmt</span></label>
                <label class="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-orange-100 transition shadow-sm"><input type="checkbox" class="sh-day-chk accent-orange-600 w-4 h-4" value="0" ${isDayChecked(0)}> <span class="text-xs font-bold text-orange-700 dark:text-orange-400">Paz</span></label>
            </div>
        </div>
    </div>`;
}

function createShift() {
    showModal('Yeni Vardiya / Mesai Oluştur', shiftFormHtml(), () => {
        const name = document.getElementById('f-shName').value.trim();
        const start = document.getElementById('f-shStart').value;
        const end = document.getElementById('f-shEnd').value;
        let days = []; document.querySelectorAll('.sh-day-chk:checked').forEach(c => days.push(parseInt(c.value)));
        
        if(!name || !start || !end || days.length === 0) return toast('Lütfen tüm alanları doldurun ve en az 1 gün seçin', 'error');
        
        const shifts = DB.get('shifts');
        shifts.push({ id: DB.nextId('shifts'), name, startTime: start, endTime: end, days });
        DB.set('shifts', shifts);
        closeModal(); toast('Vardiya şablonu eklendi.'); render();
    });
}

function editShift(id) {
    const shifts = DB.get('shifts'); const sh = shifts.find(x => x.id === id); if(!sh) return;
    showModal('Vardiyayı Düzenle', shiftFormHtml(sh), () => {
        sh.name = document.getElementById('f-shName').value.trim();
        sh.startTime = document.getElementById('f-shStart').value;
        sh.endTime = document.getElementById('f-shEnd').value;
        let days = []; document.querySelectorAll('.sh-day-chk:checked').forEach(c => days.push(parseInt(c.value)));
        
        if(!sh.name || !sh.startTime || !sh.endTime || days.length === 0) return toast('Lütfen tüm alanları doldurun ve en az 1 gün seçin', 'error');
        sh.days = days;
        DB.set('shifts', shifts);
        closeModal(); toast('Vardiya güncellendi'); 
        if(confirm("Vardiya saatleri değiştiği için tüm üretim çizelgesinin (Gantt) yeniden hesaplanmasını ister misiniz?")) { recalculateSchedules(); }
        render();
    });
}

function deleteShift(id) {
    confirmDialog('Bu vardiyayı silmek istediğinize emin misiniz? (Bu vardiyayı kullanan istasyonlar etkilenebilir)', () => {
        DB.set('shifts', DB.get('shifts').filter(s => s.id !== id));
        toast('Vardiya silindi', 'info'); render();
    });
}

