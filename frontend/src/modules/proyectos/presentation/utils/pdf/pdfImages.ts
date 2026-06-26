/**
 * pdfImages.ts — compresión paralela de imágenes para PDF
 * Convierte URLs externas a base64 JPEG comprimido via canvas.
 */

const DEFAULT_MAX_PX = 900;
const DEFAULT_QUALITY = 0.65;

/** Descarga una imagen y la convierte a base64 JPEG comprimida. null si falla. */
export async function imageUrlToBase64(
  url: string,
  maxPx = DEFAULT_MAX_PX,
  quality = DEFAULT_QUALITY,
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const scale = Math.min(1, maxPx / Math.max(img.width, img.height, 1));
          const canvas = document.createElement('canvas');
          canvas.width  = Math.round(img.width  * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          if (!ctx) { URL.revokeObjectURL(objUrl); resolve(null); return; }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch { resolve(null); }
        finally { URL.revokeObjectURL(objUrl); }
      };
      img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(null); };
      img.src = objUrl;
    });
  } catch { return null; }
}

/** Comprime múltiples imágenes EN PARALELO. El orden del resultado = orden de entrada. */
export function compressImagesParallel(
  urls: string[],
  maxPx = DEFAULT_MAX_PX,
  quality = DEFAULT_QUALITY,
): Promise<(string | null)[]> {
  return Promise.all(urls.map((u) => imageUrlToBase64(u, maxPx, quality)));
}
