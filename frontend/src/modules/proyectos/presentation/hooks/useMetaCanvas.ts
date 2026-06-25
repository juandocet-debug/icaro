import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { Pos, NODE_W, COMP_INIT_X, COMP_INIT_Y, COMP_ROW_H } from './useMetaData';

export function useMetaCanvas(proyectoId: string, metaId: string) {
  const [positions, setPositions] = useState<Record<string, Pos>>({});
  const [nodeSizes, setNodeSizes] = useState<Record<string, { w: number; h: number }>>({});
  const metaSize = useRef({ w: NODE_W, h: 110 });

  const setNodeSize = useCallback((id: string, w: number, h: number) => {
    setNodeSizes(prev => {
      if (prev[id]?.w === w && prev[id]?.h === h) return prev;
      return { ...prev, [id]: { w, h } };
    });
  }, []);

  // Persistir posiciones en localStorage automáticamente
  useEffect(() => {
    if (Platform.OS === 'web' && Object.keys(positions).length > 0) {
      try {
        localStorage.setItem(`map_positions_${proyectoId}_${metaId}`, JSON.stringify(positions));
      } catch { /* ignorar */ }
    }
  }, [positions, proyectoId, metaId]);

  return { positions, setPositions, nodeSizes, metaSize, setNodeSize };
}

/** Hook de arrastre por nodo (web) */
export function useDraggableNode(
  id: string,
  positions: Record<string, Pos>,
  setPositions: React.Dispatch<React.SetStateAction<Record<string, Pos>>>
) {
  const dragging = useRef(false);
  const start = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);

  const onMouseDown = useCallback((e: any) => {
    e.stopPropagation();
    e.preventDefault();
    dragging.current = true;
    const pos = positions[id] ?? { x: 0, y: 0 };
    start.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !start.current) return;
      const dx = ev.clientX - start.current.mx;
      const dy = ev.clientY - start.current.my;
      setPositions(prev => ({
        ...prev,
        [id]: { x: start.current!.ox + dx, y: start.current!.oy + dy },
      }));
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [id, positions, setPositions]);

  return { onMouseDown };
}
