// ============ MERKEZİ İSTATİSTİK FONKSİYONU ============
function getStepStats(step) {
    const wos = DB.get('work_orders');
    const wo = wos.find(w => w.id === step.workOrderId);
    if (!wo) return null;

    const routes = DB.get('product_routes');
    const route = routes.find(r => r.productName === wo.product && !r.isTemplate) || routes.find(r => r.productName === wo.product);
    const rStep = route?.steps.find(s => parseInt(s.stationId) === parseInt(step.stationId));
    
    const qty = wo.quantity || 1;
    const estMin = rStep ? (parseInt(rStep.estimatedMinutes) || 0) : 0;
    const setupMin = rStep ? (parseInt(rStep.setupMinutes) || 0) : 0;
    
    const plannedTime = (estMin * qty) + setupMin;

    const logs = DB.get('production_logs').filter(l => l.stepId === step.id);
    let actualTime = 0;
    let lastDate = step.actualEnd || step.actualStart || new Date().toISOString();
    
    if (logs.length > 0 && logs.some(l => l.duration)) {
        actualTime = logs.reduce((sum, l) => sum + (parseInt(l.duration) || 0), 0);
        lastDate = logs[logs.length-1].date;
    } else if (step.actualStart && step.actualEnd) {
        actualTime = Math.max(0, (new Date(step.actualEnd) - new Date(step.actualStart)) / 60000);
    }

    return {
        stepId: step.id,
        stationId: step.stationId,
        wo: wo,
        st: DB.get('stations').find(s => s.id === step.stationId),
        planned: plannedTime,
        actual: actualTime,
        eff: actualTime > 0 ? Math.round((plannedTime / actualTime) * 100) : 0,
        date: new Date(lastDate)
    };
}


