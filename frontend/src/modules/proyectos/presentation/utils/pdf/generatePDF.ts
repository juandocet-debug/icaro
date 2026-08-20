/**
 * generatePDF.ts — orquestador principal del PDF institucional v3.
 * - Fotos regulares: maximo 2/hoja, completas y sin deformacion
 * - Listas de asistencia: 1/hoja, agrupadas después de las fotos de cada evidencia
 * - Header/footer absolutamente fijos (height:297mm por página)
 */
import { Platform } from 'react-native';
import { imageSourceToBase64, imageUrlToBase64 } from './pdfImages';
import { buildCalendarHtml } from './pdfCalendar';
import { getSharedCss, portadaHtml, evidenciaPageHtml, fotosPageHtml, planSesionPageHtml, asistenciaPageHtml, docsPageHtml, isAsistencia, isPlanSesion } from './pdfTemplate';
import { LOGO_SUPERIOR_B64, LOGO_INFERIOR_B64 } from './pdfLogos';
import { env } from '../../../../../config/env';

// Las listas contienen texto pequeno y firmas. 4096 px conserva hasta cerca
// de 480 DPI en la hoja A4 y la calidad 1 evita una segunda pérdida JPEG.
const ASISTENCIA_PDF_MAX_PX = 4096;
const ASISTENCIA_PDF_QUALITY = 1;

const toAbsUrl = (url: string) =>
  !url ? '' : url.startsWith('http') ? url : `${(env as any).apiUrl ?? ''}${url}`;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

export interface PDFParams {
  proyectoNombre: string;
  metaNombre: string;
  componenteNombre: string;
  accionNombre: string;
  grupoNombre?: string;
  agruparPorGrupo?: boolean;
  evidencias: any[];
}

export async function generateEvidenciasPDF(params: PDFParams): Promise<string | null> {
  if (Platform.OS !== 'web') {
    return 'La descarga de PDF solo está disponible en la versión web.';
  }

  const { proyectoNombre, metaNombre, componenteNombre, accionNombre, grupoNombre, agruparPorGrupo, evidencias } = params;
  // El reporte debe respetar exactamente el resultado de los filtros.
  // No truncar silenciosamente: antes se exportaban solo las primeras 20.
  const evs = evidencias;

  // ── 1. Recopilar URLs de imágenes distinguiendo tipo ─────────────────────
  type ImgRef = { evIdx: number; sIdx: number; url: string; label: string; isAsis: boolean; isPlan: boolean };
  const imgRefs: ImgRef[] = [];

  evs.forEach((ev, evIdx) => {
    (ev.soportes || []).forEach((s: any, sIdx: number) => {
      if (s.file_type?.startsWith('image/')) {
        imgRefs.push({
          evIdx, sIdx,
          url:    toAbsUrl(s.file_url),
          label:  s.requisito_nombre || s.file_name || `Foto ${sIdx + 1}`,
          isAsis: isAsistencia(s),
          isPlan: isPlanSesion(s),
        });
      }
    });
  });

  // ── 2. Preparar imágenes. Las evidencias se procesan con concurrencia
  // limitada para que un PDF general de alta resolución no agote memoria. ──
  const [logoTop, logoBot] = await Promise.all([
    imageSourceToBase64(LOGO_SUPERIOR_B64, 320, 0.9, 'image/png'),
    imageSourceToBase64(LOGO_INFERIOR_B64, 320, 0.9, 'image/png'),
  ]);
  const compressedImgs = await mapWithConcurrency(imgRefs, 4, async (r) => {
      if (r.isAsis) {
        return imageUrlToBase64(r.url, ASISTENCIA_PDF_MAX_PX, ASISTENCIA_PDF_QUALITY);
      }
      return imageUrlToBase64(r.url, r.isPlan ? 1200 : 820, r.isPlan ? 0.62 : 0.54);
  });

  const imgMap = new Map<string, string | null>();
  imgRefs.forEach((r, i) => imgMap.set(`${r.evIdx}-${r.sIdx}`, compressedImgs[i] ?? null));

  // ── 3. Ensamblar HTML ─────────────────────────────────────────────────────
  const renderEvidencia = (ev: any, evIdx: number) => {
    const informe = evidenciaPageHtml(ev, logoTop, logoBot, accionNombre);

    // Separar fotos regulares de listas de asistencia
    const planesSesion: { label: string; b64: string | null }[] = [];
    const fotosRegulares: { label: string; b64: string | null }[] = [];
    const fotosAsistencia: { label: string; b64: string | null }[] = [];

    (ev.soportes || []).forEach((s: any, sIdx: number) => {
      if (!s.file_type?.startsWith('image/')) return;
      const ref = imgRefs.find((r) => r.evIdx === evIdx && r.sIdx === sIdx);
      const item = { label: ref?.label ?? s.file_name, b64: imgMap.get(`${evIdx}-${sIdx}`) ?? null };
      if (ref?.isPlan) {
        planesSesion.push(item);
      } else if (ref?.isAsis) {
        fotosAsistencia.push(item);
      } else {
        fotosRegulares.push(item);
      }
    });

    const docs = (ev.soportes || [])
      .filter((s: any) => !s.file_type?.startsWith('image/'))
      .map((s: any) => ({ nombre: s.file_name, tipo: s.file_type || '', tamaño: s.file_size }));

    return (
      informe
      + planSesionPageHtml(planesSesion, logoTop, logoBot, accionNombre)
      + fotosPageHtml(fotosRegulares, logoTop, logoBot, accionNombre)
      + asistenciaPageHtml(fotosAsistencia, logoTop, logoBot, accionNombre)
      + docsPageHtml(docs, logoTop, logoBot, accionNombre)
    );
  };

  const renderPortada = (grupo: string, evidenciasGrupo: any[]) => portadaHtml({
    proyectoNombre, metaNombre, componenteNombre, accionNombre,
    grupoNombre: grupo,
    calendarHtml: buildCalendarHtml(evidenciasGrupo),
    logoTopB64: logoTop, logoBottomB64: logoBot,
  });

  // En el PDF general, cada grupo recibe su propia portada/calendario y luego
  // sus evidencias. El flujo de un grupo individual permanece sin cambios.
  const debeAgrupar = Boolean(agruparPorGrupo && evs.some((ev) => ev.grupo));
  let contenido = '';
  if (debeAgrupar) {
    const grupos = new Map<string, { nombre: string; items: { ev: any; evIdx: number }[] }>();
    evs.forEach((ev, evIdx) => {
      const key = ev.grupo?.id || '__sin_grupo__';
      const nombre = ev.grupo?.nombre || 'Sin grupo asignado';
      if (!grupos.has(key)) grupos.set(key, { nombre, items: [] });
      grupos.get(key)!.items.push({ ev, evIdx });
    });
    contenido = Array.from(grupos.values()).map(({ nombre, items }) => (
      renderPortada(nombre, items.map(({ ev }) => ev))
      + items.map(({ ev, evIdx }) => renderEvidencia(ev, evIdx)).join('')
    )).join('');
  } else {
    contenido = renderPortada(grupoNombre || '', evs)
      + evs.map((ev, evIdx) => renderEvidencia(ev, evIdx)).join('');
  }

  const html = `<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"/>
    <title>Reporte — ${accionNombre}</title>
    <style>${getSharedCss()}</style>
  </head><body>
    ${contenido}
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();};</script>
  </body></html>`;

  // ── 4. Abrir ventana de impresión ─────────────────────────────────────────
  const win = window.open('', '_blank');
  if (!win) return 'Permite las ventanas emergentes para descargar el PDF.';
  win.document.write(html);
  win.document.close();
  return null;
}
