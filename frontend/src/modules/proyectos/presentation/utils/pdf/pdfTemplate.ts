/**
 * pdfTemplate.ts v3
 * - @page margin:0, .page height:297mm fijo → header/footer siempre absolutos
 * - Logo superior pequeño (48px)
 * - Sin leyenda de colores en portada
 * - Fotos: 4 por hoja (2×2 grid)
 * - Asistencia: 1 por hoja, imagen a máximo alto disponible
 */

export const isAsistencia = (s: any): boolean =>
  (s.requisito_nombre || s.file_name || '').toLowerCase().includes('asistencia');

// ─── CSS compartido ────────────────────────────────────────────────────────
export function getSharedCss(): string {
  return `
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing:border-box; font-family:'Segoe UI',Arial,sans-serif;
        -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    body { margin:0; color:#1e293b; font-size:11px; background:#fff; }

    /* Cada .page ocupa exactamente una hoja A4 */
    .page {
      width: 210mm;
      height: 297mm;
      padding: 8mm 11mm 8mm 11mm;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }
    .break { page-break-before: always; break-before: page; }

    /* Header: logo + línea divisora — ocupa espacio fijo superior */
    .page-header { flex-shrink: 0; margin-bottom: 4px; }
    .page-header .logo-wrap { text-align: center; margin-bottom: 4px; }
    .page-header .logo-wrap img { max-height: 48px; max-width: 200px; object-fit: contain; display: inline-block; }
    hr.div { border:none; border-top:2px solid #7c3aed; margin:3px 0 5px; }

    /* Contenido: crece para ocupar el espacio disponible */
    .page-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

    /* Footer: logo inferior centrado + metadatos — siempre al fondo */
    .page-footer {
      flex-shrink: 0;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      margin-top: 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .page-footer img { max-height: 52px; max-width: 200px; object-fit: contain; }
    .page-footer .footer-meta { display:flex; justify-content:space-between; width:100%; }
    .footer-txt { font-size:8px; color:#64748b; }

    /* Tablas de info */
    table.info { width:100%; border-collapse:collapse; margin-bottom:6px; }
    table.info td { border:1px solid #e2e8f0; padding:4px 7px; font-size:10px; vertical-align:top; }
    table.info td:first-child { font-weight:700; color:#7c3aed; background-color:#f8f4ff; width:34%; }
    .sec { font-size:11px; font-weight:700; color:#7c3aed; background-color:#f8f4ff;
           padding:3px 7px; margin:5px 0 4px; border-left:3px solid #7c3aed; flex-shrink:0; }
    .badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:9px; font-weight:700; }
    .badge-aprobada  { background-color:#dcfce7; color:#15803d; }
    .badge-enviada   { background-color:#fef3c7; color:#b45309; }
    .badge-reabierta { background-color:#e0e7ff; color:#4338ca; }
    .badge-observada,.badge-borrador { background-color:#fee2e2; color:#b91c1c; }

    /* Fotografías: 2 por hoja, apiladas verticalmente, tamaño controlado */
    .photos-stack {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }
    .photo-cell {
      display: flex;
      flex-direction: column;
      flex: 1;
      max-height: 48%;
      overflow: hidden;
    }
    .photo-cell .photo-lbl { font-size:8px; color:#475569; font-style:italic; margin-bottom:3px; flex-shrink:0; }
    .photo-cell img { flex:1; width:100%; max-height:95mm; object-fit:contain; min-height:0; }

    /* Asistencia: hoja vertical A4, imagen rotada 90° para verse horizontal */
    .asist-img {
      flex: 1; min-height: 0; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
    }
    .asist-img img {
      transform: rotate(90deg);
      /* Intercambia ancho/alto para llenar el área disponible tras la rotación */
      width: 218mm;       /* → se convierte en alto visual tras rotate */
      height: 186mm;      /* → se convierte en ancho visual tras rotate */
      /* Compensa el desplazamiento del layout box */
      margin: 16mm -16mm;
      object-fit: contain;
    }`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const header = (logoTopB64: string | null) => `
  <div class="page-header">
    <div class="logo-wrap">${logoTopB64 ? `<img src="${logoTopB64}" />` : ''}</div>
    <hr class="div" />
  </div>`;

const footer = (logoBotB64: string | null, accionNombre: string) => `
  <div class="page-footer">
    ${logoBotB64 ? `<img src="${logoBotB64}" />` : ''}
    <div class="footer-meta">
      <span class="footer-txt">${accionNombre}</span>
      <span class="footer-txt">${new Date().toLocaleDateString('es-CO')}</span>
    </div>
  </div>`;

// ─── PORTADA ───────────────────────────────────────────────────────────────
export interface PortadaParams {
  proyectoNombre: string; metaNombre: string; componenteNombre: string;
  accionNombre: string; grupoNombre?: string; calendarHtml: string;
  logoTopB64: string | null; logoBottomB64: string | null;
}
export function portadaHtml(p: PortadaParams): string {
  return `
  <div class="page">
    ${header(p.logoTopB64)}
    <div class="page-body">
      <table class="info" style="margin-top:6px;">
        <tr><td>Proyecto</td><td>${p.proyectoNombre}</td></tr>
        <tr><td>Meta / Objetivo</td><td>${p.metaNombre || '—'}</td></tr>
        ${p.componenteNombre ? `<tr><td>Componente</td><td>${p.componenteNombre}</td></tr>` : ''}
        <tr><td>Acción / Actividad</td><td>${p.accionNombre}</td></tr>
        ${p.grupoNombre ? `<tr><td>Grupo / Cohorte</td><td><strong>${p.grupoNombre}</strong></td></tr>` : ''}
      </table>
      <hr class="div" />
      <div class="sec">CRONOGRAMA DE SESIONES</div>
      ${p.calendarHtml}
    </div>
    ${footer(p.logoBottomB64, p.accionNombre)}
  </div>`;
}

// ─── INFORME DE EVIDENCIA ──────────────────────────────────────────────────
export function evidenciaPageHtml(
  ev: any, logoTopB64: string | null, logoBotB64: string | null, accionNombre: string,
): string {
  const reqs: any[]     = ev.accion?.requisitos || [];
  const soportes: any[] = ev.soportes || [];
  const totalReqs       = reqs.length;
  const cargados        = reqs.filter((r: any) =>
    soportes.filter((s: any) => s.requisito_id === r.id || s.requisito_nombre === r.nombre).length >= (r.min_archivos || 1),
  ).length;

  const reqsHtml = totalReqs > 0 ? `
    <div class="sec">REQUISITOS — ${cargados} de ${totalReqs} completados</div>
    <table style="width:100%;border-collapse:collapse;font-size:10px;">
      <thead><tr>
        <th style="background-color:#f8fafc;border:1px solid #e2e8f0;padding:4px;text-align:left;">Requisito</th>
        <th style="background-color:#f8fafc;border:1px solid #e2e8f0;padding:4px;text-align:center;width:60px;">Archivos</th>
        <th style="background-color:#f8fafc;border:1px solid #e2e8f0;padding:4px;text-align:center;width:44px;">OK</th>
      </tr></thead>
      <tbody>${reqs.map((r: any) => {
        const cnt = soportes.filter((s: any) => s.requisito_id === r.id || s.requisito_nombre === r.nombre).length;
        const ok  = cnt >= (r.min_archivos || 1);
        return `<tr>
          <td style="border:1px solid #e2e8f0;padding:4px;">${r.nombre}${r.obligatorio ? ' *' : ''}</td>
          <td style="border:1px solid #e2e8f0;padding:4px;text-align:center;">${cnt}</td>
          <td style="border:1px solid #e2e8f0;padding:4px;text-align:center;">${ok ? '✅' : '—'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table>` : '';

  return `
  <div class="page break">
    ${header(logoTopB64)}
    <div class="page-body">
      <div style="text-align:center;font-weight:700;font-size:12px;color:#7c3aed;margin:4px 0;">INFORME DE EVIDENCIA</div>
      <table class="info">
        <tr><td>Evidencia</td><td>${ev.nombre}</td></tr>
        <tr><td>Fecha Ejecución</td><td>${ev.fecha_ejecucion || '—'}</td></tr>
        ${ev.cantidad_ejecutada != null ? `<tr><td>Cantidad Ejecutada</td><td>${ev.cantidad_ejecutada}</td></tr>` : ''}
      </table>
      ${ev.observacion_coordinador ? `<div class="sec">OBSERVACIONES</div>
        <p style="font-size:10px;color:#334155;line-height:1.5;font-style:italic;margin:0 0 4px;">${ev.observacion_coordinador}</p>` : ''}
      ${reqsHtml}
    </div>
    ${footer(logoBotB64, accionNombre)}
  </div>`;
}

// ─── FOTOGRAFÍAS regulares (4 por hoja, grilla 2×2) ───────────────────────
export function fotosPageHtml(
  fotos: { label: string; b64: string | null }[],
  logoTopB64: string | null, logoBotB64: string | null, accionNombre: string,
): string {
  if (!fotos.length) return '';
  // Grupos de 2
  const chunks: typeof fotos[] = [];
  for (let i = 0; i < fotos.length; i += 2) chunks.push(fotos.slice(i, i + 2));

  return chunks.map((group, pi) => `
  <div class="page break">
    ${header(logoTopB64)}
    <div class="page-body">
      <div class="sec">FOTOGRAFÍAS DE LA SESIÓN</div>
      <div class="photos-stack">
        ${group.map((f, i) => !f.b64 ? '' : `
          <div class="photo-cell">
            <div class="photo-lbl">Fotografía ${pi * 2 + i + 1}. ${f.label}</div>
            <img src="${f.b64}" />
          </div>`).join('')}
      </div>
    </div>
    ${footer(logoBotB64, accionNombre)}
  </div>`).join('');
}

// ─── LISTA DE ASISTENCIA (1 por hoja, imagen ocupa todo el espacio) ────────
export function asistenciaPageHtml(
  fotos: { label: string; b64: string | null }[],
  logoTopB64: string | null, logoBotB64: string | null, accionNombre: string,
): string {
  if (!fotos.length) return '';
  return fotos.map((f) => !f.b64 ? '' : `
  <div class="page break">
    ${header(logoTopB64)}
    <div class="page-body">
      <div class="sec">LISTA DE ASISTENCIA</div>
      <div class="asist-img"><img src="${f.b64}" /></div>
    </div>
    ${footer(logoBotB64, accionNombre)}
  </div>`).join('');
}

// ─── DOCUMENTOS DE SOPORTE ─────────────────────────────────────────────────
export function docsPageHtml(
  docs: { nombre: string; tipo: string; tamaño?: number }[],
  logoTopB64: string | null, logoBotB64: string | null, accionNombre: string,
): string {
  if (!docs.length) return '';
  return `
  <div class="page break">
    ${header(logoTopB64)}
    <div class="page-body">
      <div class="sec">DOCUMENTOS DE SOPORTE</div>
      <table style="width:100%;border-collapse:collapse;margin-top:4px;">
        <thead><tr>
          <th style="background-color:#f8fafc;border:1px solid #e2e8f0;padding:5px;text-align:left;font-size:10px;">Documento</th>
          <th style="background-color:#f8fafc;border:1px solid #e2e8f0;padding:5px;font-size:10px;width:80px;">Tipo</th>
          <th style="background-color:#f8fafc;border:1px solid #e2e8f0;padding:5px;text-align:right;font-size:10px;width:70px;">Tamaño</th>
        </tr></thead>
        <tbody>${docs.map((d) => {
          const icon = d.tipo.includes('pdf') ? '📄' : d.tipo.includes('sheet') || d.tipo.includes('excel') ? '📊' : '📎';
          const ext  = d.tipo.split('/').pop()?.replace('vnd.openxmlformats-officedocument.','').replace('spreadsheetml.sheet','xlsx').replace('wordprocessingml.document','docx').toUpperCase() || 'DOC';
          const kb   = d.tamaño ? `${(d.tamaño / 1024).toFixed(0)} KB` : '—';
          return `<tr>
            <td style="border:1px solid #e2e8f0;padding:5px;font-size:10px;">${icon} ${d.nombre}</td>
            <td style="border:1px solid #e2e8f0;padding:5px;font-size:10px;color:#64748b;">${ext}</td>
            <td style="border:1px solid #e2e8f0;padding:5px;text-align:right;font-size:10px;color:#64748b;">${kb}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
    ${footer(logoBotB64, accionNombre)}
  </div>`;
}
