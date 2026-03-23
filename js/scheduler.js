// ============ AKILLI ZAMAN VE VARDİYA MOTORU ============
function getStationBlocks(stationId, date) {
   const st = DB.get('stations').find(s=>s.id===stationId);
   if(!st || !st.shiftIds || st.shiftIds.length === 0) return [];
   const allShifts = DB.get('shifts');
   const dayOfWeek = date.getDay();
   let blocks = [];

   st.shiftIds.forEach(shId => {
      const shift = allShifts.find(s => s.id === parseInt(shId));
      if(shift && shift.days.includes(dayOfWeek)) {
         const [sh, sm] = shift.startTime.split(':').map(Number);
         let [eh, em] = shift.endTime.split(':').map(Number);

         let isNextDay = false;
         if(eh < sh || (eh === sh && em <= sm)) isNextDay = true;
         if(eh === 0 && em === 0) { eh = 24; isNextDay = false; }

         let bStart = new Date(date); bStart.setHours(sh, sm, 0, 0);
         let bEnd = new Date(date);
         if(isNextDay) bEnd.setDate(bEnd.getDate() + 1);
         bEnd.setHours(eh === 24 ? 23 : eh, eh === 24 ? 59 : em, eh === 24 ? 59 : 0, 0);

         blocks.push({start: bStart, end: bEnd});
      }
   });
   blocks.sort((a,b) => a.start - b.start);
   return blocks;
}

// İSTASYON BOŞLUK DOLDURMA ALGORİTMASI (Gelişmiş Gap-Filling)
function findNextAvailableSlot(stationId, afterDate, durationMinutes, allStepsArray) {
  const steps = allStepsArray || DB.get('work_order_steps');
  const stationSteps = steps.filter(s => s.stationId === stationId && s.plannedStart && s.plannedEnd && s.status !== 'completed');

  let remaining = durationMinutes;
  let cursor = new Date(afterDate).getTime();

  let plannedStart = null;
  let plannedEnd = null;
  let sanityLimit = 365;

  while (remaining > 0 && sanityLimit > 0) {
      sanityLimit--;
      let d = new Date(cursor);
      let blocks = getStationBlocks(stationId, d);

      for (let block of blocks) {
          if (remaining <= 0) break;
          let bs = block.start.getTime();
          let be = block.end.getTime();

          if (cursor >= be) continue;
          let cs = Math.max(bs, cursor);

          // O vardiyadaki diğer planlanmış işleri bul
          let overlaps = stationSteps.filter(s => {
              let ss = new Date(s.plannedStart).getTime();
              let se = new Date(s.plannedEnd).getTime();
              return se > cs && ss < be;
          }).sort((a,b) => new Date(a.plannedStart).getTime() - new Date(b.plannedStart).getTime());

          for (let step of overlaps) {
              if (remaining <= 0) break;
              let ss = new Date(step.plannedStart).getTime();
              let se = new Date(step.plannedEnd).getTime();

              if (cs < ss) {
                  let gap = (ss - cs) / 60000;
                  if (gap > 0) {
                      if (!plannedStart) plannedStart = new Date(cs);
                      let take = Math.min(remaining, gap);
                      remaining -= take;
                      cs += take * 60000;
                      plannedEnd = new Date(cs);
                  }
              }
              if (cs < se) cs = se;
          }

          // Vardiya bitmeden süre kaldıysa
          if (remaining > 0 && cs < be) {
              if (!plannedStart) plannedStart = new Date(cs);
              let gap = (be - cs) / 60000;
              let take = Math.min(remaining, gap);
              remaining -= take;
              cs += take * 60000;
              plannedEnd = new Date(cs);
          }
          cursor = cs;
      }

      if (remaining > 0) {
          let nd = new Date(cursor);
          nd.setDate(nd.getDate() + 1);
          nd.setHours(0,0,0,0);
          cursor = nd.getTime();
      }
  }

  if(!plannedStart) {
      plannedStart = new Date(afterDate); plannedStart.setHours(8,0,0,0);
      plannedEnd = new Date(plannedStart.getTime() + durationMinutes * 60000);
  }

  return { start: plannedStart, end: plannedEnd };
}

function calcStationLoadInRange(stationId, start, end) {
  const steps = DB.get('work_order_steps');
  const inRangeSteps = steps.filter(s => s.stationId === stationId && s.status !== 'completed' && s.plannedStart && s.plannedEnd);

  let totalMins = 0;
  inRangeSteps.forEach(s => {
      let ss = new Date(Math.max(new Date(s.plannedStart).getTime(), new Date(start).getTime()));
      let se = new Date(Math.min(new Date(s.plannedEnd).getTime(), new Date(end).getTime()));
      if (se > ss) totalMins += (se.getTime() - ss.getTime()) / 60000;
  });
  return totalMins / 60;
}

function calcStationCapacityInRange(stationId, start, end) {
    let capMins = 0;
    let cursor = new Date(start); cursor.setHours(0,0,0,0);
    let endLimit = new Date(end);

    while(cursor <= endLimit) {
        let blocks = getStationBlocks(stationId, cursor);
        blocks.forEach(b => {
            let bs = new Date(Math.max(b.start.getTime(), start.getTime()));
            let be = new Date(Math.min(b.end.getTime(), end.getTime()));
            if (be > bs) capMins += (be.getTime() - bs.getTime()) / 60000;
        });
        cursor.setDate(cursor.getDate() + 1);
    }
    return capMins / 60;
}

// BÜTÜN İŞLERİ SIRALAYAN VE PLANLAYAN ANA MOTOR
function recalculateSchedules() {
    let wos = DB.get('work_orders');
    wos.forEach((w,i) => { if(w.queueIndex === undefined) w.queueIndex = i; });
    wos = wos.sort((a,b) => a.queueIndex - b.queueIndex);

    const allSteps = DB.get('work_order_steps');
    const routes = DB.get('product_routes');

    // Henüz başlamamış olanların planlarını sıfırla
    allSteps.forEach(s => {
        if(s.status === 'pending') { s.plannedStart = null; s.plannedEnd = null; }
    });

    let globalNextStart = new Date();

    wos.forEach(wo => {
        if(wo.status === 'completed' || wo.status === 'shipped') return;
        const woSteps = allSteps.filter(s => s.workOrderId === wo.id).sort((a,b) => parseInt(a.stepOrder||1) - parseInt(b.stepOrder||1));
        const route = routes.find(r => r.productName === wo.product && !r.isTemplate) || routes.find(r => r.productName === wo.product);

        let currentWoStart = new Date(globalNextStart);

        woSteps.forEach(step => {
            const rStep = route?.steps.find(x => x.stationId === step.stationId && x.stepOrder === step.stepOrder);
            const isParallel = rStep && rStep.dependency === 'parallel';

            const totalDuration = (step.estimatedMinutes * (wo.quantity||1)) + (step.setupMinutes || 0);

            if (step.status === 'completed') {
                currentWoStart = new Date(step.actualEnd || currentWoStart);
            } else if (step.status === 'in_progress') {
                // Çalışan işi bozmayalım, planlanan bitişine göre devam etsin
                let st = new Date(step.actualStart); if(isNaN(st)) st = new Date();
                const slot = findNextAvailableSlot(step.stationId, st, totalDuration, allSteps.filter(s=>s.id !== step.id));
                step.plannedStart = slot.start.toISOString();
                step.plannedEnd = slot.end.toISOString();
                currentWoStart = new Date(step.plannedEnd);
            } else {
                // Akıllı boşluk doldurma algoritması
                const slot = findNextAvailableSlot(step.stationId, currentWoStart, totalDuration, allSteps);
                step.plannedStart = slot.start.toISOString();
                step.plannedEnd = slot.end.toISOString();

                // Eğer SERİ ise, bir sonraki aşama kesinlikle bu işin bitişinden sonra başlamalı
                if (!isParallel) {
                    currentWoStart = new Date(slot.end);
                }
            }
        });
    });

    DB.set('work_orders', wos);
    DB.set('work_order_steps', allSteps);
}
