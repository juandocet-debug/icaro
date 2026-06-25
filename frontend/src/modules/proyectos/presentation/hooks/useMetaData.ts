import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Meta } from '../../domain/Meta';
import { Componente } from '../../domain/Componente';
import { Accion } from '../../domain/Accion';
import {
  obtenerMetaUseCase,
  listarComponentesMetaUseCase,
  listarAccionesMetaUseCase,
  eliminarMetaUseCase,
  eliminarComponenteUseCase,
  eliminarAccionUseCase,
} from '../../../../shared/dependencies';
import { useAccess } from '../../../auth/presentation/useAccess';

// Constantes de posición del canvas (compartidas con useMetaCanvas)
export const NODE_W      = 240;
export const META_X      = 40;
export const META_Y      = 80;
export const COMP_INIT_X = META_X + NODE_W + 120;
export const COMP_INIT_Y = 40;
export const COMP_ROW_H  = 180;
export const CANVAS_W    = 2400;
export const CANVAS_H    = 1600;
export type Pos = { x: number; y: number };

interface UseMetaDataProps {
  proyectoId: string;
  metaId: string;
  esCoordinadorComponenteRestringido: boolean;
  componentesAsignadosIds: string[];
  setPositions: React.Dispatch<React.SetStateAction<Record<string, Pos>>>;
}

export function useMetaData({
  proyectoId,
  metaId,
  esCoordinadorComponenteRestringido,
  componentesAsignadosIds,
  setPositions,
}: UseMetaDataProps) {
  const [meta,        setMeta]       = useState<Meta | null>(null);
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [acciones,    setAcciones]   = useState<Record<string, Accion[]>>({});
  const [loadingAcc,  setLoadingAcc] = useState<Record<string, boolean>>({});
  const [expanded,    setExpanded]   = useState<Record<string, boolean>>({});
  const [metaOpen,    setMetaOpen]   = useState(true);
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState<string | null>(null);

  // Modales de acción
  const [modalComp,  setModalComp]  = useState(false);
  const [modalEvid,  setModalEvid]  = useState<Accion | null>(null);
  const [modalResp,  setModalResp]  = useState<Accion | null>(null);
  const [editMeta,   setEditMeta]   = useState<boolean>(false);
  const [editComp,   setEditComp]   = useState<Componente | null>(null);
  const [deleteData, setDeleteData] = useState<{
    kind: 'meta' | 'componente' | 'accion';
    id: string;
    extraId?: string;
  } | null>(null);

  const expandedRef = useRef(expanded);
  useEffect(() => { expandedRef.current = expanded; }, [expanded]);

  const cargar = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const [m, comps] = await Promise.all([
        obtenerMetaUseCase.ejecutar(proyectoId, metaId),
        listarComponentesMetaUseCase.ejecutar(proyectoId, metaId),
      ]);

      const filteredComps = esCoordinadorComponenteRestringido
        ? comps.filter(c => componentesAsignadosIds.includes(c.id))
        : comps;

      setMeta(m);
      setComponentes(filteredComps);

      const initialExpanded: Record<string, boolean> = {};
      filteredComps.forEach(c => { initialExpanded[c.id] = true; });
      setExpanded(prev => ({ ...initialExpanded, ...prev }));

      // Posiciones desde localStorage
      let savedPos: Record<string, Pos> = {};
      if (Platform.OS === 'web') {
        try {
          const val = localStorage.getItem(`map_positions_${proyectoId}_${metaId}`);
          if (val) savedPos = JSON.parse(val);
        } catch { /* ignorar */ }
      }

      const initPos: Record<string, Pos> = { ...savedPos };
      comps.forEach((c, i) => {
        if (!initPos[c.id]) initPos[c.id] = { x: COMP_INIT_X, y: COMP_INIT_Y + i * COMP_ROW_H };
      });
      setPositions(initPos);

      // Cargar acciones de todos los componentes en paralelo
      const expandedCompIds = comps.map(c => c.id);
      if (expandedCompIds.length > 0) {
        const accionesCargadas: Record<string, Accion[]> = {};
        await Promise.all(
          expandedCompIds.map(async (compId) => {
            try {
              accionesCargadas[compId] = await listarAccionesMetaUseCase.ejecutar(compId);
            } catch { /* ignorar */ }
          })
        );
        setAcciones(prev => ({ ...prev, ...accionesCargadas }));
        setPositions(prev => {
          const next = { ...prev };
          expandedCompIds.forEach(compId => {
            const accs = accionesCargadas[compId] ?? [];
            const compPos = next[compId] ?? { x: COMP_INIT_X, y: 0 };
            accs.forEach((acc, i) => {
              if (!next[acc.id]) next[acc.id] = { x: compPos.x + NODE_W + 120, y: compPos.y + i * 160 };
            });
          });
          return next;
        });
      }
    } catch {
      setError('No se pudo cargar la meta.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [proyectoId, metaId, esCoordinadorComponenteRestringido, componentesAsignadosIds, setPositions]);

  useFocusEffect(useCallback(() => { cargar(true); }, [cargar]));

  const toggleComp = useCallback(async (id: string) => {
    const open = !expanded[id];
    setExpanded(prev => ({ ...prev, [id]: open }));
    if (open && !acciones[id] && !loadingAcc[id]) {
      setLoadingAcc(prev => ({ ...prev, [id]: true }));
      try {
        const accs = await listarAccionesMetaUseCase.ejecutar(id);
        setAcciones(prev => ({ ...prev, [id]: accs }));
        setPositions(prev => {
          const next = { ...prev };
          const compPos = prev[id] ?? { x: COMP_INIT_X, y: 0 };
          accs.forEach((acc, i) => {
            if (!next[acc.id]) next[acc.id] = { x: compPos.x + NODE_W + 120, y: compPos.y + i * 160 };
          });
          return next;
        });
      } finally {
        setLoadingAcc(prev => ({ ...prev, [id]: false }));
      }
    }
  }, [expanded, acciones, loadingAcc, setPositions]);

  const onCompCreado = useCallback(async () => {
    setModalComp(false);
    const comps = await listarComponentesMetaUseCase.ejecutar(proyectoId, metaId);
    setComponentes(comps);
    const initialExpanded: Record<string, boolean> = {};
    comps.forEach(c => { initialExpanded[c.id] = true; });
    setExpanded(prev => ({ ...initialExpanded, ...prev }));
    setPositions(prev => {
      const next = { ...prev };
      comps.forEach((c, i) => {
        if (!next[c.id]) next[c.id] = { x: COMP_INIT_X, y: COMP_INIT_Y + i * COMP_ROW_H };
      });
      return next;
    });
  }, [proyectoId, metaId, setPositions]);

  const onAccCreada = useCallback(async (compId: string) => {
    const accs = await listarAccionesMetaUseCase.ejecutar(compId);
    setAcciones(prev => ({ ...prev, [compId]: accs }));
    setPositions(prev => {
      const next = { ...prev };
      const compPos = prev[compId] ?? { x: COMP_INIT_X, y: 0 };
      accs.forEach((acc, i) => {
        if (!next[acc.id]) next[acc.id] = { x: compPos.x + NODE_W + 120, y: compPos.y + i * 160 };
      });
      return next;
    });
  }, [setPositions]);

  const onEvidenciaSubida = useCallback(async (compId: string) => {
    const accs = await listarAccionesMetaUseCase.ejecutar(compId);
    setAcciones(prev => ({ ...prev, [compId]: accs }));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteData) return;
    if (deleteData.kind === 'meta') {
      await eliminarMetaUseCase.ejecutar(proyectoId, deleteData.id);
    } else if (deleteData.kind === 'componente') {
      await eliminarComponenteUseCase.ejecutar(proyectoId, deleteData.id);
      cargar(false);
    } else if (deleteData.kind === 'accion') {
      await eliminarAccionUseCase.ejecutar(deleteData.extraId!, deleteData.id);
      onAccCreada(deleteData.extraId!);
    }
    setDeleteData(null);
  }, [deleteData, proyectoId, cargar, onAccCreada]);

  return {
    // Estado de datos
    meta, componentes, acciones, loadingAcc, expanded, metaOpen, loading, error,
    // Estado de UI/modales
    modalComp, modalEvid, modalResp, editMeta, editComp, deleteData,
    // Setters
    setMetaOpen, setModalComp, setModalEvid, setModalResp,
    setEditMeta, setEditComp, setDeleteData,
    // Acciones
    cargar, toggleComp, onCompCreado, onAccCreada, onEvidenciaSubida, handleDelete,
  };
}
