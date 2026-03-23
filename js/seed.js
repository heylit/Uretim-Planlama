// ============ SEED DATA ============
function seedData() {
  if (localStorage.getItem('pp_initialized_v68')) return;

  const shifts = [
    { id:1, name:'1. Vardiya (Gündüz)', startTime:'08:00', endTime:'16:00', days:[1,2,3,4,5] },
    { id:2, name:'2. Vardiya (Akşam)', startTime:'16:00', endTime:'00:00', days:[1,2,3,4,5] }
  ];

  const stations = [
    { id:1, name:'Montaj Hattı A', code:'MH-001', type:'assembly', shiftIds:[1], status:'active' },
    { id:2, name:'CNC İşleme', code:'CNC-001', type:'machining', shiftIds:[1,2], status:'active' }, 
    { id:3, name:'Kaynak Atölyesi', code:'KY-001', type:'welding', shiftIds:[1], status:'active' }
  ];

  const materials = [
    { id:1, code:'M-001', name:'Karbon Gövde', unit:'adet', stock:100 },
    { id:5, code:'M-005', name:'Çelik Mil (mm)', unit:'mm', stock:15000 }
  ];

  const product_routes = [
    { id:1, productName:'Standart Silindir Rotası', isTemplate: true, steps:[
      { stepOrder: 1, dependency: 'serial', stationId:2, estimatedMinutes:20, setupMinutes: 45 },
      { stepOrder: 2, dependency: 'serial', stationId:3, estimatedMinutes:15, setupMinutes: 20 },
      { stepOrder: 3, dependency: 'serial', stationId:1, estimatedMinutes:30, setupMinutes: 0 }
    ]}
  ];

  DB.set('shifts', shifts);
  DB.set('stations', stations);
  DB.set('employees', []);
  DB.set('station_assignments', []);
  DB.set('materials', materials);
  DB.set('product_bom', []);
  DB.set('product_routes', product_routes);
  DB.set('customer_orders', []);
  DB.set('work_orders', []);
  DB.set('work_order_steps', []);
  DB.set('production_logs', []);
  DB.set('shipments', []); 
  
  localStorage.setItem('pp_initialized_v68', 'true');
}
seedData();

