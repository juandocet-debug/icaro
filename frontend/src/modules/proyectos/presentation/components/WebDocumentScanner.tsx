import React, { useEffect, useRef, useState } from 'react';

/**
 * Scanner de documentos usando WebRTC (getUserMedia).
 * Funciona en Chrome/Safari móvil sin instalar nada.
 * Muestra cámara live + overlay con encuadre de esquinas.
 */
interface Props {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

const W_RATIO = 0.82;
const H_RATIO = W_RATIO * (297 / 210); // proporción A4

export const WebDocumentScanner: React.FC<Props> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const frameW = vw * W_RATIO;
  const frameH = frameW * (297 / 210);
  const frameLeft = (vw - frameW) / 2;
  const frameTop = (vh - frameH) / 2 - 30;

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // cámara trasera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setReady(true);
        };
      }
    } catch (e: any) {
      setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // Comprimir: máx 1600px de ancho para subida rápida
    const MAX_W = 1600;
    let dw = video.videoWidth;
    let dh = video.videoHeight;
    if (dw > MAX_W) { dh = Math.round(dh * MAX_W / dw); dw = MAX_W; }
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, dw, dh);
    // Calidad 0.70 → ~3-5x más pequeño que 0.92, sin pérdida visual apreciable
    const dataUrl = canvas.toDataURL('image/jpeg', 0.70);
    stopCamera();
    onCapture(dataUrl);
  };

  const CORNER = 24;
  const BW = 3;
  const CL = '#ffffff';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Barra superior */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 20px 14px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
      }}>
        <button onClick={() => { stopCamera(); onClose(); }} style={btnStyle}>
          <span style={{ fontSize: 22, color: '#fff' }}>✕</span>
        </button>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'sans-serif' }}>
          Escanear Documento
        </span>
        <button onClick={() => setFlash(f => !f)} style={btnStyle}>
          <span style={{ fontSize: 20, color: flash ? '#fbbf24' : '#94a3b8' }}>⚡</span>
        </button>
      </div>

      {/* Video live */}
      {error ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
          <span style={{ color: '#94a3b8', fontSize: 48 }}>📷</span>
          <p style={{ color: '#94a3b8', fontFamily: 'sans-serif', textAlign: 'center', fontSize: 14 }}>{error}</p>
          <button onClick={startCamera} style={{ ...btnStyle, background: '#7c3aed', borderRadius: 12, padding: '12px 24px', color: '#fff', fontWeight: 700 }}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Overlay oscuro con recuadre transparente A4 */}
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            viewBox={`0 0 ${vw} ${vh}`}
            preserveAspectRatio="none"
          >
            <defs>
              <mask id="docMask">
                <rect width={vw} height={vh} fill="white" />
                <rect x={frameLeft} y={frameTop} width={frameW} height={frameH} rx="4" fill="black" />
              </mask>
            </defs>
            {/* Zona oscurecida */}
            <rect width={vw} height={vh} fill="rgba(0,0,0,0.55)" mask="url(#docMask)" />
          </svg>

          {/* Esquinas del encuadre */}
          {[
            { x: frameLeft, y: frameTop, bR: 0, bB: 0 },               // TL
            { x: frameLeft + frameW - CORNER, y: frameTop, bL: 0, bB: 0 }, // TR
            { x: frameLeft, y: frameTop + frameH - CORNER, bR: 0, bT: 0 }, // BL
            { x: frameLeft + frameW - CORNER, y: frameTop + frameH - CORNER, bL: 0, bT: 0 }, // BR
          ].map((c, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: c.x, top: c.y,
              width: CORNER, height: CORNER,
              borderTop: c.bT === 0 ? 'none' : `${BW}px solid ${CL}`,
              borderBottom: c.bB === 0 ? 'none' : `${BW}px solid ${CL}`,
              borderLeft: c.bL === 0 ? 'none' : `${BW}px solid ${CL}`,
              borderRight: c.bR === 0 ? 'none' : `${BW}px solid ${CL}`,
              pointerEvents: 'none',
            }} />
          ))}

          {/* Hint */}
          <p style={{
            position: 'absolute',
            top: frameTop + frameH + 14,
            left: 0, right: 0,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'sans-serif',
            fontSize: 12,
            pointerEvents: 'none',
            margin: 0,
          }}>
            Ajusta el documento dentro del recuadre
          </p>

          {/* Botón captura */}
          {ready && (
            <button
              onClick={capture}
              style={{
                position: 'absolute',
                bottom: 52,
                left: '50%', transform: 'translateX(-50%)',
                width: 72, height: 72,
                borderRadius: 36,
                border: '4px solid #fff',
                backgroundColor: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                WebkitAppearance: 'none',
              } as any}
            >
              <div style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' }} />
            </button>
          )}
        </>
      )}

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
};
