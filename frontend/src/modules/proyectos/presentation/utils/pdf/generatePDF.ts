/**
 * generatePDF.ts — orquestador principal del PDF institucional v3.
 * - Fotos regulares: 4/hoja (grilla 2×2)
 * - Listas de asistencia: 1/hoja, agrupadas después de las fotos de cada evidencia
 * - Header/footer absolutamente fijos (height:297mm por página)
 */
import { Platform } from 'react-native';
import { imageUrlToBase64 } from './pdfImages';
import { buildCalendarHtml } from './pdfCalendar';
import { getSharedCss, portadaHtml, evidenciaPageHtml, fotosPageHtml, asistenciaPageHtml, docsPageHtml, isAsistencia } from './pdfTemplate';
import { LOGO_SUPERIOR_B64, LOGO_INFERIOR_B64 } from './pdfLogos';
import { env } from '../../../../../config/env';

const MAX_EVIDENCIAS = 20;

const toAbsUrl = (url: string) =>
  !url ? '' : url.startsWith('http') ? url : `${(env as any).apiUrl ?? ''}${url}`;

export interface PDFParams {
  proyectoNombre: string;
  metaNombre: string;
  componenteNombre: string;
  accionNombre: string;
  grupoNombre?: string;
  evidencias: any[];
}

export async function generateEvidenciasPDF(params: PDFParams): Promise<string | null> {
  if (Platform.OS !== 'web') {
    return 'La descarga de PDF solo está disponible en la versión web.';
  }

  const { proyectoNombre, metaNombre, componenteNombre, accionNombre, grupoNombre, evidencias } = params;
  const evs = evidencias.slice(0, MAX_EVIDENCIAS);

  // ── 1. Recopilar URLs de imágenes distinguiendo tipo ─────────────────────
  type ImgRef = { evIdx: number; sIdx: number; url: string; label: string; isAsis: boolean };
  const imgRefs: ImgRef[] = [];

  evs.forEach((ev, evIdx) => {
    (ev.soportes || []).forEach((s: any, sIdx: number) => {
      if (s.file_type?.startsWith('image/')) {
        imgRefs.push({
          evIdx, sIdx,
          url:    toAbsUrl(s.file_url),
          label:  s.requisito_nombre || s.file_name || `Foto ${sIdx + 1}`,
          isAsis: isAsistencia(s),
        });
      }
    });
  });

  // ── 2. Comprimir TODO en paralelo (logos ya en base64 → sin fetch) ────────
  const allPromises: Promise<string | null>[] = [
    Promise.resolve(LOGO_SUPERIOR_B64),
    Promise.resolve(LOGO_INFERIOR_B64),
    ...imgRefs.map((r) => imageUrlToBase64(r.url, 900, 0.65)),
  ];

  const [logoTop, logoBot, ...compressedImgs] = await Promise.all(allPromises);

  const imgMap = new Map<string, string | null>();
  imgRefs.forEach((r, i) => imgMap.set(`${r.evIdx}-${r.sIdx}`, compressedImgs[i] ?? null));

  // ── 3. Ensamblar HTML ─────────────────────────────────────────────────────
  const calHtml = buildCalendarHtml(evs);

  const portada = portadaHtml({
    proyectoNombre, metaNombre, componenteNombre, accionNombre,
    grupoNombre: grupoNombre || '',
    calendarHtml: calHtml, logoTopB64: logoTop, logoBottomB64: logoBot,
  });

  const paginas = evs.map((ev, evIdx) => {
    const informe = evidenciaPageHtml(ev, logoTop, logoBot, accionNombre);

    // Separar fotos regulares de listas de asistencia
    const fotosRegulares: { label: string; b64: string | null }[] = [];
    const fotosAsistencia: { label: string; b64: string | null }[] = [];

    (ev.soportes || []).forEach((s: any, sIdx: number) => {
      if (!s.file_type?.startsWith('image/')) return;
      const ref = imgRefs.find((r) => r.evIdx === evIdx && r.sIdx === sIdx);
      const item = { label: ref?.label ?? s.file_name, b64: imgMap.get(`${evIdx}-${sIdx}`) ?? null };
      if (ref?.isAsis) {
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
      + fotosPageHtml(fotosRegulares, logoTop, logoBot, accionNombre)
      + asistenciaPageHtml(fotosAsistencia, logoTop, logoBot, accionNombre)
      + docsPageHtml(docs, logoTop, logoBot, accionNombre)
    );
  }).join('');

  const html = `<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"/>
    <title>Reporte — ${accionNombre}</title>
    <style>${getSharedCss()}</style>
  </head><body>
    ${portada}${paginas}
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();};</script>
  </body></html>`;

  // ── 4. Abrir ventana de impresión ─────────────────────────────────────────
  const win = window.open('', '_blank');
  if (!win) return 'Permite las ventanas emergentes para descargar el PDF.';
  win.document.write(html);
  win.document.close();
  return null;
}
