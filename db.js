// js/db.js
const DB = {
  get(key) { 
    try { return JSON.parse(localStorage.getItem('pp_' + key) || '[]'); } 
    catch { return []; } 
  },
  set(key, data) { localStorage.setItem('pp_' + key, JSON.stringify(data)); },
  nextId(key) { const items = this.get(key); return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1; }
};

function seedData() {
  if (localStorage.getItem('pp_initialized_v81')) return;

  DB.set('shifts', [
    { id:1, name:'1. Vardiya (Gündüz)', startTime:'08:00', endTime:'16:00', days:[1,2,3,4,5] },
    { id:2, name:'2. Vardiya (Akşam)', startTime:'16:00', endTime:'00:00', days:[1,2,3,4,5] }
  ]);

  DB.set('stations', [
    { id:1, name:'Montaj Hattı A', code:'MH-001', type:'assembly', shiftIds:[1], status:'active', capacityType:'human', capacityCount: 4 },
    { id:2, name:'CNC İşleme', code:'CNC-001', type:'machining', shiftIds:[1,2], status:'active', capacityType:'machine', capacityCount: 3 }, 
    { id:3, name:'Kaynak Atölyesi', code:'KY-001', type:'welding', shiftIds:[1], status:'active', capacityType:'machine', capacityCount: 2 }
  ]);

  DB.set('materials', [
    { id:1, code:'M-001', name:'Karbon Gövde', unit:'adet', stock:100 },
    { id:2, code:'M-005', name:'Çelik Mil (mm)', unit:'mm', stock:15000 }
  ]);

  DB.set('product_routes', [
    { id:1, productName:'Standart Silindir Rotası', isTemplate: true, steps:[
      { stepOrder: 1, dependency: 'serial', stationId:2, estimatedMinutes:20, setupMinutes: 45 },
      { stepOrder: 2, dependency: 'serial', stationId:3, estimatedMinutes:15, setupMinutes: 20 },
      { stepOrder: 3, dependency: 'serial', stationId:1, estimatedMinutes:30, setupMinutes: 0 }
    ]}
  ]);

  DB.set('employees', [
    { id:1, name:'Ali Yılmaz', code:'EMP-001', role:'operator', phone:'0532 111 2233', status:'active' },
    { id:2, name:'Ayşe Demir', code:'EMP-002', role:'warehouse', phone:'0533 222 3344', status:'active' }
  ]);

  DB.set('station_assignments', []);
  DB.set('product_bom', []);
  DB.set('customer_orders', []);
  DB.set('work_orders', []);
  DB.set('work_order_steps', []);
  DB.set('production_logs', []);
  DB.set('shipments', []); 
  
  localStorage.setItem('pp_initialized_v81', 'true');
}

// Uygulama başlarken varsayılan verileri yükle
seedData();
