// ============ DATA LAYER ============
const DB = {
  get(key) { try { return JSON.parse(localStorage.getItem('pp_' + key) || '[]'); } catch { return []; } },
  set(key, data) { localStorage.setItem('pp_' + key, JSON.stringify(data)); },
  nextId(key) { const items = this.get(key); return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1; }
};

