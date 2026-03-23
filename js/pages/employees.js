// ============ PAGE: EMPLOYEES (ÇALIŞANLAR) ============
function renderEmployees() {
    const employees = DB.get('employees');
    const stations = DB.get('stations');

    const rows = employees.map(emp => {
        const station = stations.find(s => s.id === emp.stationId);
        return `<tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-sm">
            <td class="py-3 px-4 font-bold">${emp.name}</td>
            <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">${roleLabel(emp.role)}</span></td>
            <td class="py-3 px-4 text-slate-600 dark:text-slate-300">${station ? station.name : '<span class="text-slate-400">—</span>'}</td>
            <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-[11px] font-bold ${empStatusColor(emp.status)}">${empStatusLabel(emp.status)}</span></td>
            <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1">
                    <button onclick="editEmployee(${emp.id})" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button onclick="deleteEmployee(${emp.id})" class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    return `<div class="max-w-7xl mx-auto space-y-4">
        <div class="flex justify-between items-end">
            <h2 class="text-lg font-bold">Çalışan Yönetimi</h2>
            <button onclick="createEmployee()" class="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow hover:bg-primary-700 transition-colors"><i data-lucide="plus" class="w-4 h-4"></i> Yeni Çalışan</button>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto shadow-sm">
            <table class="w-full text-left">
                <thead><tr class="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                    <th class="py-3 px-4">Ad Soyad</th>
                    <th class="py-3 px-4">Rol</th>
                    <th class="py-3 px-4">İstasyon</th>
                    <th class="py-3 px-4">Durum</th>
                    <th class="py-3 px-4 text-right">İşlem</th>
                </tr></thead>
                <tbody>${rows || `<tr><td colspan="5" class="text-center py-6 text-sm text-slate-500">Çalışan kaydı bulunamadı.</td></tr>`}</tbody>
            </table>
        </div>
    </div>`;
}

function employeeFormHtml(emp = {}) {
    const stations = DB.get('stations');
    const stationOptions = `<option value="">— İstasyon Seçin —</option>` +
        stations.map(s => `<option value="${s.id}" ${emp.stationId === s.id ? 'selected' : ''}>${s.name}</option>`).join('');

    const roleOptions = ['operator','technician','engineer','warehouse','supervisor']
        .map(r => `<option value="${r}" ${emp.role === r ? 'selected' : ''}>${roleLabel(r)}</option>`).join('');
    const statusOptions = ['active','on_leave','inactive']
        .map(s => `<option value="${s}" ${(emp.status || 'active') === s ? 'selected' : ''}>${empStatusLabel(s)}</option>`).join('');

    return `<div class="space-y-4">
        <div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Ad Soyad</label><input id="f-empName" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 font-bold focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Örn: Ahmet Yılmaz" value="${emp.name || ''}"></div>
        <div class="grid grid-cols-2 gap-4">
            <div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Rol</label><select id="f-empRole" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none">${roleOptions}</select></div>
            <div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Durum</label><select id="f-empStatus" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none">${statusOptions}</select></div>
        </div>
        <div><label class="text-xs font-medium text-slate-600 dark:text-slate-400">Atanan İstasyon</label><select id="f-empStation" class="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none">${stationOptions}</select></div>
    </div>`;
}

function createEmployee() {
    showModal('Yeni Çalışan Ekle', employeeFormHtml(), () => {
        const name = document.getElementById('f-empName').value.trim();
        const role = document.getElementById('f-empRole').value;
        const status = document.getElementById('f-empStatus').value;
        const stationVal = document.getElementById('f-empStation').value;
        const stationId = stationVal ? parseInt(stationVal) : null;

        if (!name) return toast('Çalışan adı zorunludur', 'error');

        const employees = DB.get('employees');
        employees.push({ id: DB.nextId('employees'), name, role, stationId, status });
        DB.set('employees', employees);
        closeModal(); toast('Çalışan eklendi.'); render();
    });
}

function editEmployee(id) {
    const employees = DB.get('employees');
    const emp = employees.find(x => x.id === id);
    if (!emp) return;
    showModal('Çalışanı Düzenle', employeeFormHtml(emp), () => {
        emp.name = document.getElementById('f-empName').value.trim();
        emp.role = document.getElementById('f-empRole').value;
        emp.status = document.getElementById('f-empStatus').value;
        const stationVal = document.getElementById('f-empStation').value;
        emp.stationId = stationVal ? parseInt(stationVal) : null;

        if (!emp.name) return toast('Çalışan adı zorunludur', 'error');

        DB.set('employees', employees);
        closeModal(); toast('Çalışan güncellendi.'); render();
    });
}

function deleteEmployee(id) {
    confirmDialog('Bu çalışanı silmek istediğinize emin misiniz?', () => {
        DB.set('employees', DB.get('employees').filter(e => e.id !== id));
        toast('Çalışan silindi', 'info'); render();
    });
}
