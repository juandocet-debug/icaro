import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '../../../shared/components/AppShell';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { Meta } from '../domain/Meta';
import { Componente } from '../domain/Componente';
import { Accion } from '../domain/Accion';
import {
  obtenerMetaUseCase,
  listarComponentesMetaUseCase,
  listarAccionesMetaUseCase,
  eliminarMetaUseCase,
  eliminarComponenteUseCase,
  eliminarAccionUseCase,
} from '../../../shared/dependencies';
import { useProjectPermission } from '../../auth/presentation/useProjectPermission';
import { useAccess } from '../../auth/presentation/useAccess';
import { MetaMapCanvas } from './MetaMapCanvas';
import { MetaMapNode } from './MetaMapNode';
import { CrearComponenteModal } from './CrearComponenteModal';
import { EvidenciaModal } from './EvidenciaModal';
import { EditarMetaModal } from './EditarMetaModal';
import { EditarComponenteModal } from './EditarComponenteModal';
import { ConfirmarEliminarModal } from './ConfirmarEliminarModal';
import { GestionarResponsablesActividadModal } from './GestionarResponsablesActividadModal';

// ── Constantes del canvas ───────────────────────────────────────────────────
const NODE_W      = 240;   // ancho del nodo
const META_X      = 40;    // posición inicial del nodo Meta
const META_Y      = 80;
const COMP_INIT_X = META_X + NODE_W + 120; // columna inicial de componentes
const COMP_INIT_Y = 40;
const COMP_ROW_H  = 180;    // altura estimada de cada fila de componente
const CANVAS_W    = 2400;
const CANVAS_H    = 1600;

type Pos = { x: number; y: number };

// ── SVG de conexiones (web) ─────────────────────────────────────────────────
interface SvgProps {
  metaCenter: Pos;
  compCenters: Record<string, Pos>;
  compIds: string[];
  acciones: Record<string, Accion[]>;
  expanded: Record<string, boolean>;
  actionCenters: Record<string, Pos>;
}

const SvgLines: React.FC<SvgProps> = ({ metaCenter, compCenters, compIds, acciones, expanded, actionCenters }) => {
  if (!compIds.length) return null;
  const cp = 60; // control point offset for bezier

  return (
    <svg
      style={{
        position: 'absolute', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', overflow: 'visible',
      } as any}
    >
      {/* Líneas Meta -> Componentes */}
      {compIds.map(id => {
        const cc = compCenters[id];
        if (!cc) return null;
        const sx = metaCenter.x, sy = metaCenter.y;
        const ex = cc.x,        ey = cc.y;
        const d = `M ${sx} ${sy} C ${sx + cp} ${sy}, ${ex - cp} ${ey}, ${ex} ${ey}`;
        return (
          <g key={`comp-${id}`}>
            <path d={d} fill="none"
              stroke={colors.primary} strokeWidth="2" strokeOpacity="0.5"
              strokeLinecap="round"
            />
            <circle cx={ex} cy={ey} r="4" fill={colors.primary} fillOpacity="0.65" />
          </g>
        );
      })}

      {/* Líneas Componentes -> Acciones */}
      {compIds.map(compId => {
        if (!expanded[compId]) return null;
        const accs = acciones[compId] ?? [];
        const cc = compCenters[compId];
        if (!cc) return null;

        return accs.map(acc => {
          const ac = actionCenters[acc.id];
          if (!ac) return null;

          const sx = cc.x + NODE_W;
          const sy = cc.y;
          const ex = ac.x;
          const ey = ac.y;

          const d = `M ${sx} ${sy} C ${sx + cp} ${sy}, ${ex - cp} ${ey}, ${ex} ${ey}`;
          return (
            <g key={`acc-${acc.id}`}>
              <path d={d} fill="none"
                stroke={colors.success} strokeWidth="1.5" strokeOpacity="0.5"
                strokeLinecap="round"
              />
              <circle cx={ex} cy={ey} r="3" fill={colors.success} fillOpacity="0.65" />
            </g>
          );
        });
      })}

      {/* Punto en el origen */}
      <circle cx={metaCenter.x} cy={metaCenter.y} r="4.5" fill={colors.primary} fillOpacity="0.7" />
    </svg>
  );
};

// ── Hook de arrastre por nodo (web) ─────────────────────────────────────────
function useDraggableNode(
  id: string,
  positions: Record<string, Pos>,
  setPositions: React.Dispatch<React.SetStateAction<Record<string, Pos>>>
) {
  const dragging = useRef(false);
  const start = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);

  const onMouseDown = useCallback((e: any) => {
    e.stopPropagation(); // evita que el canvas se mueva
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

// ── Nodo componente arrastrable (web) ────────────────────────────────────────
interface DraggableCompProps {
  comp: Componente;
  pos: Pos;
  positions: Record<string, Pos>;
  setPositions: React.Dispatch<React.SetStateAction<Record<string, Pos>>>;
  setNodeSize: (id: string, w: number, h: number) => void;
  isOpen: boolean;
  accCount: number;
  onToggle: () => void;
  onAdd?: () => void;
  onEditComp?: () => void;
  onDeleteComp?: () => void;
  canCrearAccion: boolean;
  disabled?: boolean;
}

const DraggableComp: React.FC<DraggableCompProps> = ({
  comp, pos, positions, setPositions, setNodeSize,
  isOpen, accCount, onToggle, onAdd,
  onEditComp, onDeleteComp, canCrearAccion, disabled,
}) => {
  const { onMouseDown } = useDraggableNode(comp.id, positions, setPositions);

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        cursor: 'grab',
        userSelect: 'none',
      } as any}
      onMouseDown={onMouseDown}
    >
      <div
        style={{ display: 'inline-block' } as any}
        ref={(el) => {
          if (el) setNodeSize(comp.id, el.offsetWidth, el.offsetHeight);
        }}
      >
        <MetaMapNode
          kind="componente"
          title={comp.nombre}
          subtitle={comp.descripcion}
          counter={accCount}
          expanded={isOpen}
          onToggle={onToggle}
          onAdd={canCrearAccion ? onAdd : undefined}
          addLabel="+ Acción"
          onEdit={onEditComp}
          onDelete={onDeleteComp}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

interface DraggableAccProps {
  acc: Accion;
  pos: Pos;
  positions: Record<string, Pos>;
  setPositions: React.Dispatch<React.SetStateAction<Record<string, Pos>>>;
  setNodeSize: (id: string, w: number, h: number) => void;
  onEvidencia?: () => void;
  onGestionarResp?: () => void;
  onEditAcc?: () => void;
  onDeleteAcc?: () => void;
  disabled?: boolean;
}

const DraggableAcc: React.FC<DraggableAccProps> = ({
  acc, pos, positions, setPositions, setNodeSize,
  onEvidencia, onGestionarResp, onEditAcc, onDeleteAcc, disabled,
}) => {
  const { onMouseDown } = useDraggableNode(acc.id, positions, setPositions);

  return (
    <div
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        cursor: 'grab',
        userSelect: 'none',
      } as any}
      onMouseDown={onMouseDown}
    >
      <div
        style={{ display: 'inline-block' } as any}
        ref={(el) => {
          if (el) setNodeSize(acc.id, el.offsetWidth, el.offsetHeight);
        }}
      >
        <MetaMapNode
          kind="accion"
          title={acc.nombre}
          subtitle={acc.descripcion}
          ejecucion={acc.ejecucion}
          proyeccion={acc.proyeccion}
          unidad={acc.unidadMedida}
          avancePorcentaje={acc.avancePorcentaje}
          numRequisitos={acc.requisitosVerificacion?.length}
          resumenVerificacion={acc.resumenVerificacion}
          responsables={acc.responsables}
          onManageResponsibles={onGestionarResp}
          onEvidencia={onEvidencia}
          onEdit={onEditAcc}
          onDelete={onDeleteAcc}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

// ── Pantalla principal ────────────────────────────────────────────────────────
interface Props { proyectoId: string; metaId: string; }

export const MetaDetailScreen: React.FC<Props> = ({ proyectoId, metaId }) => {
  const { accessProfile } = useAccess();
  const isSuperAdmin = accessProfile?.esSuperadministrador === true;

  const { canDo } = useProjectPermission(proyectoId);
  const canCrearComponente = canDo('componentes.crear');
  const canEditarComponente= canDo('componentes.editar');
  const canEliminarComponente = canDo('componentes.eliminar');
  const canCrearAccion     = canDo('acciones.crear');
  const canEditarAccion    = canDo('acciones.editar');
  const canEliminarAccion  = canDo('acciones.eliminar');
  const canEditarMeta      = canDo('metas.editar');
  const canEliminarMeta    = canDo('metas.eliminar');
  const canSubirEvidencia       = canDo('evidencias.subir');
  const canGestionarResponsables = canDo('acciones.asignar_responsables');

  // Lógica de Coordinador de Componente
  const isComponentCoordinator = accessProfile?.asignaciones?.some(
    (a) => a.proyectoId === proyectoId && a.rolCodigo === 'coordinador_componente'
  ) ?? false;

  const tieneRolSuperior = isSuperAdmin || (accessProfile?.asignaciones?.some(
    (a) => a.proyectoId === proyectoId && 
    ['superadministrador', 'administrador_proyecto', 'coordinador_proyecto', 'coordinador_general'].includes(a.rolCodigo)
  ) ?? false);

  const esCoordinadorComponenteRestringido = isComponentCoordinator && !tieneRolSuperior;

  const componentesAsignadosIds = useMemo(() => {
    if (!accessProfile) return [];
    return accessProfile.asignaciones
      .filter((a) => a.proyectoId === proyectoId && a.rolCodigo === 'coordinador_componente')
      .map((a) => a.componenteId)
      .filter(Boolean) as string[];
  }, [accessProfile, proyectoId]);

  const [meta,       setMeta]       = useState<Meta | null>(null);
  const [componentes,setComponentes]= useState<Componente[]>([]);
  const [acciones,   setAcciones]   = useState<Record<string, Accion[]>>({});
  const [loadingAcc, setLoadingAcc] = useState<Record<string, boolean>>({});
  const [expanded,   setExpanded]   = useState<Record<string, boolean>>({});
  const [metaOpen,   setMetaOpen]   = useState(true);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  
  const [modalComp,  setModalComp]  = useState(false);
  const [modalEvid,  setModalEvid]  = useState<Accion | null>(null);
  const [modalResp,  setModalResp]  = useState<Accion | null>(null);
  
  const [editMeta,   setEditMeta]   = useState<boolean>(false);
  const [editComp,   setEditComp]   = useState<Componente | null>(null);
  
  const [deleteData, setDeleteData] = useState<{ kind: 'meta' | 'componente' | 'accion', id: string, extraId?: string } | null>(null);

  // Posiciones absolutas de los nodos (web only)
  const [positions, setPositions] = useState<Record<string, Pos>>({});
  // Tamaños medidos para calcular centros
  const [nodeSizes, setNodeSizes] = useState<Record<string, { w: number; h: number }>>({});
  const metaSize = useRef({ w: NODE_W, h: 110 });

  const setNodeSize = useCallback((id: string, w: number, h: number) => {
    setNodeSizes(prev => {
      if (prev[id]?.w === w && prev[id]?.h === h) return prev;
      return { ...prev, [id]: { w, h } };
    });
  }, []);

  // Ref de expanded para evitar refrescos infinitos de cargar()
  const expandedRef = useRef(expanded);
  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  const cargar = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const [m, comps] = await Promise.all([
        obtenerMetaUseCase.ejecutar(proyectoId, metaId),
        listarComponentesMetaUseCase.ejecutar(proyectoId, metaId),
      ]);
      setMeta(m);
      setComponentes(comps);

      // Auto-expandir todos los componentes para que las acciones se muestren por defecto
      const initialExpanded: Record<string, boolean> = {};
      comps.forEach(c => {
        initialExpanded[c.id] = true;
      });
      setExpanded(prev => ({ ...initialExpanded, ...prev }));

      // Cargar posiciones desde localStorage si existen
      let savedPos: Record<string, Pos> = {};
      if (Platform.OS === 'web') {
        try {
          const val = localStorage.getItem(`map_positions_${proyectoId}_${metaId}`);
          if (val) savedPos = JSON.parse(val);
        } catch (e) {
          console.error('Error al cargar posiciones', e);
        }
      }

      // Posiciones iniciales en columna
      const initPos: Record<string, Pos> = { ...savedPos };
      comps.forEach((c, i) => {
        if (!initPos[c.id]) {
          initPos[c.id] = { x: COMP_INIT_X, y: COMP_INIT_Y + i * COMP_ROW_H };
        }
      });
      setPositions(initPos);

      // Refrescar las acciones de todos los componentes expandidos (incluyendo los auto-expandidos)
      const expandedCompIds = comps.map(c => c.id);
      if (expandedCompIds.length > 0) {
        const accionesCargadas: Record<string, Accion[]> = {};
        await Promise.all(
          expandedCompIds.map(async (compId) => {
            try {
              const accs = await listarAccionesMetaUseCase.ejecutar(compId);
              accionesCargadas[compId] = accs;
            } catch (e) {
              console.error(`Error al cargar acciones del componente ${compId}`, e);
            }
          })
        );
        setAcciones(prev => ({ ...prev, ...accionesCargadas }));
        setPositions(prev => {
          const next = { ...prev };
          expandedCompIds.forEach(compId => {
            const accs = accionesCargadas[compId] ?? [];
            const compPos = next[compId] ?? { x: COMP_INIT_X, y: 0 };
            accs.forEach((acc, i) => {
              if (!next[acc.id]) {
                next[acc.id] = { x: compPos.x + NODE_W + 120, y: compPos.y + i * 160 };
              }
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
  }, [proyectoId, metaId]);

  // Guardar posiciones automáticamente al cambiar
  useEffect(() => {
    if (Platform.OS === 'web' && Object.keys(positions).length > 0) {
      try {
        localStorage.setItem(`map_positions_${proyectoId}_${metaId}`, JSON.stringify(positions));
      } catch (e) {
        console.error('Error al guardar posiciones', e);
      }
    }
  }, [positions, proyectoId, metaId]);

  useFocusEffect(
    useCallback(() => {
      cargar(true);
    }, [cargar])
  );

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
            if (!next[acc.id]) {
              next[acc.id] = { x: compPos.x + NODE_W + 120, y: compPos.y + i * 160 };
            }
          });
          return next;
        });
      } finally {
        setLoadingAcc(prev => ({ ...prev, [id]: false }));
      }
    }
  }, [expanded, acciones, loadingAcc]);

  const onCompCreado = useCallback(async () => {
    setModalComp(false);
    const comps = await listarComponentesMetaUseCase.ejecutar(proyectoId, metaId);
    setComponentes(comps);
    
    // Auto-expandir el componente recién creado también
    const initialExpanded: Record<string, boolean> = {};
    comps.forEach(c => {
      initialExpanded[c.id] = true;
    });
    setExpanded(prev => ({ ...initialExpanded, ...prev }));

    setPositions(prev => {
      const next = { ...prev };
      comps.forEach((c, i) => {
        if (!next[c.id]) next[c.id] = { x: COMP_INIT_X, y: COMP_INIT_Y + i * COMP_ROW_H };
      });
      return next;
    });
  }, [proyectoId, metaId]);

  const onAccCreada = useCallback(async (compId: string) => {
    const accs = await listarAccionesMetaUseCase.ejecutar(compId);
    setAcciones(prev => ({ ...prev, [compId]: accs }));
    setPositions(prev => {
      const next = { ...prev };
      const compPos = prev[compId] ?? { x: COMP_INIT_X, y: 0 };
      accs.forEach((acc, i) => {
        if (!next[acc.id]) {
          next[acc.id] = { x: compPos.x + NODE_W + 120, y: compPos.y + i * 160 };
        }
      });
      return next;
    });
  }, []);

  const onEvidenciaSubida = useCallback(async (compId: string) => {
    const accs = await listarAccionesMetaUseCase.ejecutar(compId);
    setAcciones(prev => ({ ...prev, [compId]: accs }));
  }, []);

  if (loading) return <AppShell scrollable={false}><ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} /></AppShell>;
  if (error || !meta) return (
    <AppShell scrollable={false}>
      <ErrorMessage message={error ?? 'Meta no encontrada.'} />
      <Button label="Volver" onPress={() => router.back()} style={{ margin: spacing.lg }} />
    </AppShell>
  );

  // ── Centro del nodo Meta (para las líneas) ────────────────────────────────
  const metaCenter: Pos = {
    x: META_X + metaSize.current.w,
    y: META_Y + metaSize.current.h / 2,
  };

  // ── Centros de los componentes (para las líneas) ──────────────────────────
  const compCenters: Record<string, Pos> = {};
  componentes.forEach(c => {
    const pos  = positions[c.id] ?? { x: COMP_INIT_X, y: 0 };
    const size = nodeSizes[c.id]  ?? { w: NODE_W, h: 60 };
    compCenters[c.id] = { x: pos.x, y: pos.y + size.h / 2 };
  });

  // ── Centros de las acciones (para las líneas) ─────────────────────────────
  const actionCenters: Record<string, Pos> = {};
  componentes.forEach(c => {
    if (expanded[c.id]) {
      const accs = acciones[c.id] ?? [];
      accs.forEach(acc => {
        const pos  = positions[acc.id] ?? { x: COMP_INIT_X + NODE_W + 120, y: 0 };
        const size = nodeSizes[acc.id]  ?? { w: NODE_W, h: 60 };
        actionCenters[acc.id] = { x: pos.x, y: pos.y + size.h / 2 };
      });
    }
  });

  // ── Canvas web ────────────────────────────────────────────────────────────
  const WebCanvas = (
    <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H } as any}>
      {metaOpen && (
        <SvgLines
          metaCenter={metaCenter}
          compCenters={compCenters}
          compIds={componentes.map(c => c.id)}
          acciones={acciones}
          expanded={expanded}
          actionCenters={actionCenters}
        />
      )}

      {/* Meta node (fijo) */}
      <div
        style={{ position: 'absolute', left: META_X, top: META_Y } as any}
        ref={(el) => {
          if (el) metaSize.current = { w: el.offsetWidth, h: el.offsetHeight };
        }}
      >
        <MetaMapNode
          kind="meta"
          title={meta.nombre}
          subtitle={meta.descripcion}
          badge={meta.activo ? 'Activa' : 'Archivada'}
          expanded={metaOpen}
          onToggle={() => setMetaOpen(v => !v)}
          onAdd={canCrearComponente ? () => setModalComp(true) : undefined}
          addLabel="+ Componente"
          onEdit={canEditarMeta ? () => setEditMeta(true) : undefined}
          onDelete={canEliminarMeta ? () => setDeleteData({ kind: 'meta', id: meta.id }) : undefined}
        />
      </div>

      {/* Componentes arrastrables */}
      {metaOpen && componentes.map(comp => {
        const pos  = positions[comp.id] ?? { x: COMP_INIT_X, y: 0 };
        const isOpen = !!expanded[comp.id];
        const accs   = acciones[comp.id] ?? [];
        
        const isCompDisabled = esCoordinadorComponenteRestringido && !componentesAsignadosIds.includes(comp.id);

        return (
          <DraggableComp
            key={comp.id}
            comp={comp}
            pos={pos}
            positions={positions}
            setPositions={setPositions}
            setNodeSize={setNodeSize}
            isOpen={isOpen}
            accCount={accs.length}
            onToggle={() => toggleComp(comp.id)}
            onAdd={canCrearAccion ? () => router.push(`/proyectos/${proyectoId}/acciones/crear?componenteId=${comp.id}` as any) : undefined}
            onEditComp={canEditarComponente ? () => setEditComp(comp) : undefined}
            onDeleteComp={canEliminarComponente ? () => setDeleteData({ kind: 'componente', id: comp.id }) : undefined}
            canCrearAccion={canCrearAccion}
            disabled={isCompDisabled}
          />
        );
      })}

      {/* Acciones arrastrables */}
      {metaOpen && componentes.flatMap(comp => {
        if (!expanded[comp.id]) return [];
        const accs = acciones[comp.id] ?? [];
        
        const isCompDisabled = esCoordinadorComponenteRestringido && !componentesAsignadosIds.includes(comp.id);

        return accs.map((acc, i) => {
          const pos = positions[acc.id] ?? { x: COMP_INIT_X + NODE_W + 120, y: COMP_INIT_Y + i * 160 };
          return (
            <DraggableAcc
              key={acc.id}
              acc={acc}
              pos={pos}
              positions={positions}
              setPositions={setPositions}
              setNodeSize={setNodeSize}
              onEvidencia={canSubirEvidencia ? () => setModalEvid({ ...acc, componenteId: comp.id }) : undefined}
              onGestionarResp={canGestionarResponsables ? () => setModalResp({ ...acc, componenteId: comp.id }) : undefined}
              onEditAcc={canEditarAccion ? () => router.push(`/proyectos/${proyectoId}/acciones/${acc.id}/editar?componenteId=${comp.id}` as any) : undefined}
              onDeleteAcc={canEliminarAccion ? () => setDeleteData({ kind: 'accion', id: acc.id, extraId: comp.id }) : undefined}
              disabled={isCompDisabled}
            />
          );
        });
      })}

      {metaOpen && componentes.length === 0 && (
        <div style={{ position: 'absolute', left: COMP_INIT_X, top: META_Y + 10 } as any}>
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTxt}>Sin componentes</Text>
            {canCrearComponente && (
              <Button label="+ Componente" size="sm" onPress={() => setModalComp(true)} style={{ marginTop: spacing.xs }} />
            )}
          </View>
        </div>
      )}
    </div>
  );

  // ── Canvas móvil (árbol estático) ─────────────────────────────────────────
  const MobileTree = (
    <ScrollView horizontal>
      <ScrollView>
        <View style={styles.mobileTree}>
          <MetaMapNode
            kind="meta"
            title={meta.nombre}
            subtitle={meta.descripcion}
            badge={meta.activo ? 'Activa' : 'Archivada'}
            expanded={metaOpen}
            onToggle={() => setMetaOpen(v => !v)}
            onAdd={canCrearComponente ? () => setModalComp(true) : undefined}
            onEdit={canEditarMeta ? () => setEditMeta(true) : undefined}
            onDelete={canEliminarMeta ? () => setDeleteData({ kind: 'meta', id: meta.id }) : undefined}
          />
          {metaOpen && componentes.map((comp) => {
            const isOpen = !!expanded[comp.id];
            const accs   = acciones[comp.id] ?? [];
            
            const isCompDisabled = esCoordinadorComponenteRestringido && !componentesAsignadosIds.includes(comp.id);

            return (
              <View key={comp.id} style={styles.mobileComp}>
                <View style={styles.mobileBranch} />
                <MetaMapNode
                  kind="componente"
                  title={comp.nombre}
                  subtitle={comp.descripcion}
                  counter={accs.length}
                  expanded={isOpen}
                  onToggle={() => toggleComp(comp.id)}
                  onAdd={canCrearAccion ? () => router.push(`/proyectos/${proyectoId}/acciones/crear?componenteId=${comp.id}` as any) : undefined}
                  onEdit={canEditarComponente ? () => setEditComp(comp) : undefined}
                  onDelete={canEliminarComponente ? () => setDeleteData({ kind: 'componente', id: comp.id }) : undefined}
                  disabled={isCompDisabled}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScrollView>
  );

  return (
    <AppShell scrollable={false} style={styles.shell}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={styles.backTxt}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.pageTitle} numberOfLines={1}>{meta.nombre}</Text>
      </View>

      <View style={styles.canvasWrap}>
        {Platform.OS === 'web'
          ? <MetaMapCanvas>{WebCanvas}</MetaMapCanvas>
          : MobileTree
        }
      </View>

      <CrearComponenteModal
        proyectoId={proyectoId} metaId={metaId}
        visible={modalComp}
        onClose={() => setModalComp(false)}
        onCreado={onCompCreado}
      />
      {!!modalEvid && (
        <EvidenciaModal
          visible
          accion={modalEvid}
          onClose={() => setModalEvid(null)}
          onSubida={() => onEvidenciaSubida(modalEvid.componenteId)}
        />
      )}
      {!!modalResp && (
        <GestionarResponsablesActividadModal
          componenteId={modalResp.componenteId}
          accionId={modalResp.id}
          accionNombre={modalResp.nombre}
          visible
          onClose={() => {
            setModalResp(null);
            // Refrescar acciones para mostrar avatares actualizados
            onEvidenciaSubida(modalResp.componenteId);
          }}
        />
      )}
      <EditarMetaModal
        proyectoId={proyectoId}
        meta={meta}
        visible={editMeta}
        onClose={() => setEditMeta(false)}
        onActualizado={cargar}
      />
      <EditarComponenteModal
        proyectoId={proyectoId}
        componente={editComp}
        visible={!!editComp}
        onClose={() => setEditComp(null)}
        onActualizado={cargar}
      />
      {!!deleteData && (
        <ConfirmarEliminarModal
          visible={!!deleteData}
          title={`Eliminar ${deleteData?.kind}`}
          message={`¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.`}
          onClose={() => setDeleteData(null)}
          onConfirm={async () => {
            if (!deleteData) return;
            if (deleteData.kind === 'meta') {
              await eliminarMetaUseCase.ejecutar(proyectoId, deleteData.id);
              router.back();
            } else if (deleteData.kind === 'componente') {
              await eliminarComponenteUseCase.ejecutar(proyectoId, deleteData.id);
              cargar();
            } else if (deleteData.kind === 'accion') {
              await eliminarAccionUseCase.ejecutar(deleteData.extraId!, deleteData.id);
              onAccCreada(deleteData.extraId!);
            }
          }}
        />
      )}
    </AppShell>
  );
};

const styles = StyleSheet.create({
  shell:      { backgroundColor: colors.background, flex: 1 },
  canvasWrap: { flex: 1 },
  topBar:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' } as any,
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 } as any,
  backTxt:    { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.bold },
  pageTitle:  { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary, flex: 1 },

  emptyAccTxt: { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary, fontStyle: 'italic' },
  emptyBox:    { padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 10, borderStyle: 'dashed' as any, alignItems: 'center' },
  emptyTxt:    { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary, fontStyle: 'italic' },

  // Mobile tree
  mobileTree:   { padding: spacing.md },
  mobileComp:   { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md } as any,
  mobileBranch: { width: 32, height: 2, backgroundColor: colors.primary, opacity: 0.4, marginRight: spacing.sm },
});
