/**
 * pdfCalendar.ts — calendario HTML para la portada del PDF.
 * Pinta los días con evidencias según su estado.
 * FIX: usa background-color + print-color-adjust:exact para Chrome print.
 */

const ESTADO_COLOR: Record<string, string> = {
  aprobada:  '#22c55e',
  enviada:   '#f59e0b',
  reabierta: '#6366f1',
  observada: '#ef4444',
  borrador:  '#94a3b8',
};
const PRIORITY = ['aprobada', 'enviada', 'reabierta', 'observada', 'borrador'];
const DAYS     = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS   = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio',
                  'Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function bestEstado(list: string[]): string {
  return PRIORITY.find((e) => list.includes(e)) ?? 'borrador';
}

const CELL_PRINT = '-webkit-print-color-adjust:exact;print-color-adjust:exact;';

/** Construye el HTML del calendario marcando días con evidencias. */
export function buildCalendarHtml(evidencias: any[]): string {
  const byMonth = new Map<string, Map<number, string[]>>();

  for (const ev of evidencias) {
    if (!ev.fecha_ejecucion) continue;
    // Safe parse: soporta '2026-06-26' y '2026-06-26T00:00:00Z'
    const dateStr = String(ev.fecha_ejecucion).substring(0, 10);
    const parts   = dateStr.split('-').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) continue;
    const [y, m, d] = parts;
    const key = `${y}-${m}`;
    if (!byMonth.has(key)) byMonth.set(key, new Map());
    const dm = byMonth.get(key)!;
    if (!dm.has(d)) dm.set(d, []);
    dm.get(d)!.push((ev.estado || 'borrador').toLowerCase());
  }

  if (!byMonth.size) {
    return '<p style="color:#94a3b8;font-size:11px;margin:4px 0;">Sin fechas registradas</p>';
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, dm]) => {
      const [y, m]  = key.split('-').map(Number);
      const firstDay  = new Date(y, m - 1, 1).getDay();
      const totalDays = new Date(y, m, 0).getDate();
      let day = 1;
      let rows = '';

      for (let r = 0; r < 6 && day <= totalDays; r++) {
        rows += '<tr>';
        for (let c = 0; c < 7; c++) {
          if ((r === 0 && c < firstDay) || day > totalDays) {
            rows += `<td style="border:1px solid #e2e8f0;padding:7px;${CELL_PRINT}"></td>`;
          } else {
            const estados = dm.get(day);
            const bg      = estados ? (ESTADO_COLOR[bestEstado(estados)] ?? '#94a3b8') : 'transparent';
            const txtColor = estados ? '#fff' : '#1e293b';
            const bold     = estados ? '700' : '400';
            // Si hay múltiples evidencias ese día, mostrar un superíndice con el conteo
            const multi = estados && estados.length > 1
              ? `<sup style="font-size:7px;margin-left:1px;">${estados.length}</sup>`
              : '';
            rows += `<td style="border:1px solid #e2e8f0;padding:7px;text-align:center;`
                  + `background-color:${bg};color:${txtColor};font-weight:${bold};`
                  + `font-size:12px;${CELL_PRINT}">${day}${multi}</td>`;
            day++;
          }
        }
        rows += '</tr>';
      }

      const header = DAYS.map(
        (d) => `<th style="background-color:#7c3aed;color:#fff;padding:7px 2px;text-align:center;`
              + `font-size:11px;${CELL_PRINT}">${d}</th>`,
      ).join('');

      return `
        <p style="text-align:center;font-weight:700;color:#7c3aed;font-size:13px;margin:10px 0 5px;">
          ${MONTHS[m - 1].toUpperCase()} ${y}
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
          <thead><tr>${header}</tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    })
    .join('');
}
