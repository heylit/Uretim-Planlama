// ============ PAGE: STATIONS (İSTASYONLAR) ============

// Calculate total daily shift hours for a station
function stationDailyHours(st) {
    const allShifts = DB.get('shifts');
    const assigned = allShifts.filter(sh => (st.shiftIds || []).includes(sh.id));
    let totalMins = 0;
    assigned.forEach(sh => {
        const [sh2, sm] = sh.startTime.split(':').map(Number);
        let [eh, em] = sh.endTime.split(':').map(Number);
        if (eh === 0 && em === 0) { eh = 24; em = 0; }
        let mins = (eh * 60 + em) - (sh2 * 60 + sm);
        if (mins <= 0) mins += 24 * 60;
        totalMins += mins;
    });
    return (totalMins / 60).toFixed(1);
}

function renderStations() {
    const stations = DB.get('stations');
    const shifts = DB.get('shifts');
    const employees = DB.get('employees');

    const noShiftWarning = `<span class="flex items-center gap-1 text-amber-600 text-[11px] font-bold"><i data-lucide="alert-triangle" class="w-3 h-3"></i> Vardiya Yok</span>`;

    const rows = stations.map(st => {
        const assignedShifts = shifts.filter(sh => (st.shiftIds || []).includes(sh.id));
        const shiftBadges = assignedShifts.length
            ? assignedShifts.map(sh => `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">${sh.name}</span>`).join(' ')
            : noShiftWarning;
        const dailyHrs = assignedShifts.length ? `<span class="text-[10px] text-slate-400 ml-1">(${stationDailyHours(st)} sa/gün)</span>` : '';
        const isActive = st.status === 'active';
        const assignedEmpCount = employees.filter(e => e.stationId === st.id && e.status === 'active').length;
        return `<tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm ${!isActive ? 'opacity-60' : ''}">
            <td class="py-3 px-4">
                <div class="font-bold">${st.name}</div>
                <div class="text-[10px] text-slate-400 font-mono mt-0.5">${st.code || ''}</div>
            </td>
            <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">${stationTypeLabel(st.type)}</span></td>
            <td class="py-3 px-4">
                <div class="flex flex-wrap gap-1 items-center">${shiftBadges}${dailyHrs}</div>
            </td>
            <td class="py-3 px-4 text-center">
                <span class="text-xs font-bold ${assignedEmpCount > 0 ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}">${assignedEmpCount > 0 ? assignedEmpCount + ' kişi' : '—'}</span>
            </td>
            <td class="py-3 px-4">
                <button onclick="toggleStationStatus(${st.id})" title="${isActive ? 'Pasife Al' : 'Aktife Al'}"
                    class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${isActive ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'}">
                    ${isActive ? '✓ Aktif' : '✗ Pasif'}
                </button>
            </td>
            <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1">
                    <button onclick="editStation(${st.id})" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button onclick="deleteStation(${st.id})" class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    const activeCount = stations.filter(s => s.status === 'active').length;
    const noShiftCount = stations.filter(s => s.status === 'active' && !(s.shiftIds && s.shiftIds.length)).length;
    const warningBanner = noShiftCount > 0
        ? `<div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 flex items-center gap-3 text-sm text-amber-800 dark:text-amber-300"><i data-lucide="alert-triangle" class="w-5 h-5 text-amber-500 flex-shrink-0"></i><span><b>${noShiftCount} aktif istasyona</b> vardiya atanmamış — bu istasyonlar planlama ve kapasite hesaplamalarında göz ardı edilir. <a href="#/shifts" class="underline font-bold">Vardiya Ayarları</a> sayfasından vardiya ekleyip buradan istasyona atayın.</span></div>`
        : '';

    return `<div class="max-w-7xl mx-auto space-y-4">
        ${warningBanner}
        <div class="flex justify-between items-center">
            <div>
                <h2 class="text-lg font-bold">İstasyon Yönetimi</h2>
                <p class="text-xs text-slate-500 mt-0.5">${activeCount} aktif / ${stations.length} toplam istasyon</p>
            </div>
            <button onclick="createStation()" class="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow hover:bg-primary-700 transition-colors"><i data-lucide="plus" class="w-4 h-4"></i> Yeni İstasyon</button>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm">
            <table class="w-full text-left">
                <thead><tr class="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                    <th class="py-3 px-4">İstasyon Adı / Kod</th>
                    <th class="py-3 px-4">Tür</th>
                    <th class="py-3 px-4">Atanan Vardiyalar</th>
                    <th class="py-3 px-4 text-center">Çalışanlar</th>
                    <th class="py-3 px-4">Durum</th>
                    <th class="py-3 px-4 text-right">İşlem</th>
                </tr></thead>
                <tbody>${rows || `<tr><td colspan="6" class="text-center py-8 text-sm text-slate-500"><i data-lucide="factory" class="w-8 h-8 mx-auto mb-2 text-slate-300"></i><br>İstasyon kaydı bulunamadı.</td></tr>`}</tbody>
            </table>
        </div>
    </div>`;
}

function stationFormHtml(st = {}) {
    const shifts = DB.get('shifts');
    const selectedShiftIds = st.shiftIds || [];
    const shiftChecks = shifts.map(sh => {
        const checked = selectedShiftIds.includes(sh.id) ? 'checked' : '';
        return `<label class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm">
            <input type="checkbox" class="st-shift-chk accent-primary-600 w-4 h-4" value="${sh.id}" ${checked}>
            <span class="text-xs font-bold">${sh.name}</span>
        </label>`;
    }).join('');

    const typeOptions = ['assembly','machining','welding','painting','packaging']
        .map(t => `<option value="${t}" ${st.type === t ? 'selected' : ''}>${stationTypeLabel(t)}</option>`).join('');
    const statusOptions = ['active','inactive']
        .map(s => `<option value="${s}" ${(st.status || 'active') === s ? 'selected' : ''}>${s === 'active' ? 'Aktif' : 'Pasif'}</option>`).join('');

    return `<div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2"><label class="text-xs font-medium text-slate-600 dark:text-slate-400">İstasyon Adı</label><input id="f-stName" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 font-bold focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Örn: Montaj Hattı A" value="${st.name || ''}"></div>
            <div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Kod</label><input id="f-stCode" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 font-mono focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Örn: MH-001" value="${st.code || ''}"></div>
            <div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Tür</label><select id="f-stType" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none">${typeOptions}</select></div>
        </div>
        <div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Durum</label><select id="f-stStatus" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none">${statusOptions}</select></div>
        <div>
            <label class="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-2">Atanan Vardiyalar</label>
            <div class="flex flex-wrap gap-2">${shiftChecks || '<span class="text-xs text-slate-400">Henüz vardiya tanımlanmamış. Önce Vardiyalar sayfasından vardiya ekleyin.</span>'}</div>
        </div>
    </div>`;
}

function toggleStationStatus(id) {
    const stations = DB.get('stations');
    const st = stations.find(x => x.id === id);
    if (!st) return;
    st.status = st.status === 'active' ? 'inactive' : 'active';
    DB.set('stations', stations);
    toast(st.status === 'active' ? `${st.name} aktife alındı` : `${st.name} pasife alındı`, st.status === 'active' ? 'success' : 'info');
    render();
}

function createStation() {
    showModal('Yeni İstasyon Ekle', stationFormHtml(), () => {
        const name = document.getElementById('f-stName').value.trim();
        const code = document.getElementById('f-stCode').value.trim();
        const type = document.getElementById('f-stType').value;
        const status = document.getElementById('f-stStatus').value;
        const shiftIds = [];
        document.querySelectorAll('.st-shift-chk:checked').forEach(c => shiftIds.push(parseInt(c.value)));

        if (!name) return toast('İstasyon adı zorunludur', 'error');

        const stations = DB.get('stations');
        stations.push({ id: DB.nextId('stations'), name, code, type, shiftIds, status });
        DB.set('stations', stations);
        closeModal(); toast('İstasyon eklendi.'); render();
    });
}

function editStation(id) {
    const stations = DB.get('stations');
    const st = stations.find(x => x.id === id);
    if (!st) return;
    showModal('İstasyonu Düzenle', stationFormHtml(st), () => {
        st.name = document.getElementById('f-stName').value.trim();
        st.code = document.getElementById('f-stCode').value.trim();
        st.type = document.getElementById('f-stType').value;
        st.status = document.getElementById('f-stStatus').value;
        st.shiftIds = [];
        document.querySelectorAll('.st-shift-chk:checked').forEach(c => st.shiftIds.push(parseInt(c.value)));

        if (!st.name) return toast('İstasyon adı zorunludur', 'error');

        DB.set('stations', stations);
        closeModal(); toast('İstasyon güncellendi.'); render();
    });
}

function deleteStation(id) {
    confirmDialog('Bu istasyonu silmek istediğinize emin misiniz? (Bu istasyona atanmış çalışanlar etkilenebilir)', () => {
        DB.set('stations', DB.get('stations').filter(s => s.id !== id));
        toast('İstasyon silindi', 'info'); render();
    });
}
