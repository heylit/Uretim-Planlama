// ============ YARDIMCI FONKSİYONLAR ============
function formatDate(d) { if (!d) return '-'; const p = d.split('-'); return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : d; }
function formatDateTime(dt) { if (!dt) return '-'; const [date, time] = dt.split('T'); return formatDate(date) + ' ' + (time ? time.substring(0,5) : ''); }
function priorityBarColor(p) { return { urgent:'#ef4444', high:'#f97316', normal:'#3b82f6', low:'#9ca3af' }[p] || '#3b82f6'; }
function statusLabel(s) { return { new:'Yeni', planning:'Planlama', production:'Üretimde', ready_to_ship:'Üretim Bitti', shipped:'Sevk Edildi', completed:'Tamamlandı', cancelled:'İptal', pending:'Beklemede', in_progress:'Devam Ediyor' }[s] || s; }
function statusColor(s) { return { new:'bg-blue-100 text-blue-700', planning:'bg-yellow-100 text-yellow-700', production:'bg-indigo-100 text-indigo-700', ready_to_ship:'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', shipped:'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300', completed:'bg-slate-100 text-slate-600', cancelled:'bg-red-100 text-red-700', pending:'bg-yellow-100 text-yellow-700', in_progress:'bg-green-100 text-green-700' }[s] || 'bg-gray-100 text-gray-700'; }
function roleLabel(r) { return { operator:'Operatör', technician:'Teknisyen', engineer:'Mühendis', warehouse:'Depo Sorumlusu', supervisor:'Süpervizör' }[r] || r; }
function empStatusLabel(s) { return { active:'Aktif', on_leave:'İzinli', inactive:'Pasif' }[s] || s; }
function empStatusColor(s) { return { active:'bg-green-100 text-green-700', on_leave:'bg-yellow-100 text-yellow-700', inactive:'bg-red-100 text-red-700' }[s] || 'bg-gray-100 text-gray-700'; }
function stationTypeLabel(t) { return { assembly:'Montaj', machining:'İşleme', welding:'Kaynak', painting:'Boya', packaging:'Paketleme' }[t] || t; }
function utilizationColor(pct) {
  if (pct <= 30) return { text:'text-green-600', bg:'bg-green-100', bar:'bg-green-500', hex:'#22c55e' };
  if (pct <= 60) return { text:'text-blue-600', bg:'bg-blue-100', bar:'bg-blue-500', hex:'#3b82f6' };
  if (pct <= 80) return { text:'text-yellow-600', bg:'bg-yellow-100', bar:'bg-yellow-500', hex:'#eab308' };
  if (pct <= 100) return { text:'text-orange-600', bg:'bg-orange-100', bar:'bg-orange-500', hex:'#f97316' };
  return { text:'text-red-600', bg:'bg-red-100', bar:'bg-red-500', hex:'#ef4444' };
}

function getDateRange(mode, refDate) {
  const d = new Date(refDate);
  if (mode === 'day') { const s = new Date(d); s.setHours(0,0,0,0); const e = new Date(d); e.setHours(23,59,59,999); return { start: s, end: e, days: 1 }; }
  if (mode === 'week') { const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const s = new Date(d); s.setDate(diff); s.setHours(0,0,0,0); const e = new Date(s); e.setDate(s.getDate() + 6); e.setHours(23,59,59,999); return { start: s, end: e, days: 5 }; }
  if (mode === 'month') { const s = new Date(d.getFullYear(), d.getMonth(), 1); const e = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); return { start: s, end: e, days: Math.round((e - s) / 86400000) + 1 }; }
  const s = new Date(d.getFullYear(), 0, 1); const e = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999); return { start: s, end: e, days: Math.round((e - s) / 86400000) + 1 };
}
