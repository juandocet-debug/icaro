/**
 * pdfImages.ts — compresión paralela de imágenes para PDF
 * Convierte URLs externas a base64 JPEG comprimido via canvas.
 */

const DEFAULT_MAX_PX = 900;
const DEFAULT_QUALITY = 0.65;

type CropRect = { x: number; y: number; width: number; height: number };

/** Detecta el contenido no blanco y conserva un margen de seguridad. */
function detectContentBounds(img: HTMLImageElement): CropRect {
  const detectionMax = 1200;
  const scale = Math.min(1, detectionMax / Math.max(img.width, img.height, 1));
  const scan = document.createElement('canvas');
  scan.width = Math.max(1, Math.round(img.width * scale));
  scan.height = Math.max(1, Math.round(img.height * scale));
  const ctx = scan.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { x: 0, y: 0, width: img.width, height: img.height };
  ctx.drawImage(img, 0, 0, scan.width, scan.height);
  const { data } = ctx.getImageData(0, 0, scan.width, scan.height);
  let minX = scan.width, minY = scan.height, maxX = -1, maxY = -1;

  for (let y = 0; y < scan.height; y += 1) {
    for (let x = 0; x < scan.width; x += 1) {
      const i = (y * scan.width + x) * 4;
      // El umbral alto conserva líneas finas, texto tenue y bordes del papel.
      if (data[i + 3] > 20 && (data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245)) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, width: img.width, height: img.height };
  }
  const padX = Math.round((maxX - minX + 1) * 0.025);
  const padY = Math.round((maxY - minY + 1) * 0.025);
  minX = Math.max(0, minX - padX); maxX = Math.min(scan.width - 1, maxX + padX);
  minY = Math.max(0, minY - padY); maxY = Math.min(scan.height - 1, maxY + padY);
  return {
    x: Math.floor(minX / scale),
    y: Math.floor(minY / scale),
    width: Math.min(img.width, Math.ceil((maxX - minX + 1) / scale)),
    height: Math.min(img.height, Math.ceil((maxY - minY + 1) / scale)),
  };
}

function imageToCompressedDataUrl(
  src: string,
  maxPx: number,
  quality: number,
  mimeType = 'image/jpeg',
  trimWhiteMargins = false,
  revokeUrl?: string,
): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const crop = trimWhiteMargins
          ? detectContentBounds(img)
          : { x: 0, y: 0, width: img.width, height: img.height };
        const scale = Math.min(1, maxPx / Math.max(crop.width, crop.height, 1));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(crop.width * scale);
        canvas.height = Math.round(crop.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          img,
          crop.x, crop.y, crop.width, crop.height,
          0, 0, canvas.width, canvas.height,
        );
        resolve(canvas.toDataURL(mimeType, quality));
      } catch { resolve(null); }
      finally { if (revokeUrl) URL.revokeObjectURL(revokeUrl); }
    };
    img.onerror = () => { if (revokeUrl) URL.revokeObjectURL(revokeUrl); resolve(null); };
    img.src = src;
  });
}

/** Convierte una URL o data-url a JPEG comprimido. null si falla. */
export async function imageSourceToBase64(
  url: string,
  maxPx = DEFAULT_MAX_PX,
  quality = DEFAULT_QUALITY,
  mimeType = 'image/jpeg',
  trimWhiteMargins = false,
): Promise<string | null> {
  if (!url) return null;
  try {
    if (url.startsWith('data:image/')) {
      return await imageToCompressedDataUrl(url, maxPx, quality, mimeType, trimWhiteMargins);
    }
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    return await imageToCompressedDataUrl(objUrl, maxPx, quality, mimeType, trimWhiteMargins, objUrl);
  } catch { return null; }
}

/** Descarga una imagen y la convierte a base64 JPEG comprimida. null si falla. */
export const imageUrlToBase64 = imageSourceToBase64;

/** Comprime múltiples imágenes EN PARALELO. El orden del resultado = orden de entrada. */
export function compressImagesParallel(
  urls: string[],
  maxPx = DEFAULT_MAX_PX,
  quality = DEFAULT_QUALITY,
): Promise<(string | null)[]> {
  return Promise.all(urls.map((u) => imageUrlToBase64(u, maxPx, quality)));
}
