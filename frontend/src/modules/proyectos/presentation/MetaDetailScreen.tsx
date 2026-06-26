/**
 * MetaDetailScreen
 * Orquesta el mapa jerárquico Meta → Componentes → Acciones.
 * La lógica de datos está en hooks/useMetaData.ts
 * La lógica del canvas está en hooks/useMetaCanvas.ts
 * Los sub-componentes en components/DraggableNodes, SvgLines, MetaMobileTree
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { AppShell } from '../../../shared/components/AppShell';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { useProjectPermission } from '../../auth/presentation/useProjectPermission';
import { useAccess } from '../../auth/presentation/useAccess';
import {
  eliminarMetaUseCase, eliminarComponenteUseCase, eliminarAccionUseCase,
} from '../../../shared/dependencies';

// Sub-componentes del mapa
import { MetaMapCanvas } from './MetaMapCanvas';
import { MetaMapNode } from './MetaMapNode';
import { SvgLines } from './components/SvgLines';
import { DraggableComp, DraggableAcc } from './components/DraggableNodes';
import { MetaMobileTree } from './components/MetaMobileTree';

// Hooks de datos y canvas
import { useMetaData, NODE_W, META_X, META_Y, COMP_INIT_X, COMP_INIT_Y, CANVAS_W, CANVAS_H } from './hooks/useMetaData';
import { useMetaCanvas } from './hooks/useMetaCanvas';

// Modales
import { CrearComponenteModal } from './CrearComponenteModal';
import { EvidenciaModal } from './EvidenciaModal';
import { EditarMetaModal } from './EditarMetaModal';
import { EditarComponenteModal } from './EditarComponenteModal';
import { ConfirmarEliminarModal } from './ConfirmarEliminarModal';
import { GestionarResponsablesActividadModal } from './GestionarResponsablesActividadModal';

interface Props { proyectoId: string; metaId: string; }

export const MetaDetailScreen: React.FC<Props> = ({ proyectoId, metaId }) => {
  const isMobile = useIsMobile();
  const { accessProfile, canInProject, isLoading: accessLoading } = useAccess();
  const isSuperAdmin = accessProfile?.esSuperadministrador === true;

  const canVerMetas = isSuperAdmin || 
    canInProject('metas.ver', proyectoId) || 
    (accessProfile?.asignaciones?.some(
      (a) => a.proyectoId === proyectoId && a.rolCodigo === 'coordinador_componente'
    ) ?? false);

  React.useEffect(() => {
    if (!accessLoading && accessProfile && !canVerMetas) {
      router.replace('/acceso-denegado');
    }
  }, [accessLoading, accessProfile, canVerMetas]);

  // ── Permisos ─────────────────────────────────────────────────────────────
  const { canDo } = useProjectPermission(proyectoId);
  const canCrearComponente      = canDo('componentes.crear');
  const canEditarComponente     = canDo('componentes.editar');
  const canEliminarComponente   = canDo('componentes.eliminar');
  const canCrearAccion          = canDo('acciones.crear');
  const canEditarAccion         = canDo('acciones.editar');
  const canEliminarAccion       = canDo('acciones.eliminar');
  const canEditarMeta           = canDo('metas.editar');
  const canEliminarMeta         = canDo('metas.eliminar');
  const canSubirEvidencia       = canDo('evidencias.subir');
  const canGestionarResponsables= canDo('acciones.asignar_responsables');

  // Coordinador de componente restringido
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

  // ── Canvas state ──────────────────────────────────────────────────────────
  const { positions, setPositions, nodeSizes, metaSize, setNodeSize } =
    useMetaCanvas(proyectoId, metaId);

  // ── Datos ─────────────────────────────────────────────────────────────────
  const {
    meta, componentes, acciones, loadingAcc, expanded, metaOpen, loading, error,
    modalComp, modalEvid, modalResp, editMeta, editComp, deleteData,
    setMetaOpen, setModalComp, setModalEvid, setModalResp,
    setEditMeta, setEditComp, setDeleteData,
    cargar, toggleComp, onCompCreado, onAccCreada, onEvidenciaSubida,
  } = useMetaData({
    proyectoId, metaId,
    esCoordinadorComponenteRestringido, componentesAsignadosIds,
    setPositions,
  });

  // ── Cargando / Error ──────────────────────────────────────────────────────
  if (loading || accessLoading || !accessProfile) return (
    <AppShell scrollable={false}>
      <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xxl }} />
    </AppShell>
  );
  if (error || !meta) return (
    <AppShell scrollable={false}>
      <ErrorMessage message={error ?? 'Meta no encontrada.'} />
      <Button label="Volver" onPress={() => router.back()} style={{ margin: spacing.lg }} />
    </AppShell>
  );

  // ── Centros para líneas SVG ───────────────────────────────────────────────
  const metaCenter = { x: META_X + metaSize.current.w, y: META_Y + metaSize.current.h / 2 };

  const compCenters: Record<string, { x: number; y: number }> = {};
  componentes.forEach(c => {
    const pos  = positions[c.id] ?? { x: COMP_INIT_X, y: 0 };
    const size = nodeSizes[c.id]  ?? { w: NODE_W, h: 60 };
    compCenters[c.id] = { x: pos.x, y: pos.y + size.h / 2 };
  });

  const actionCenters: Record<string, { x: number; y: number }> = {};
  componentes.forEach(c => {
    if (expanded[c.id]) {
      (acciones[c.id] ?? []).forEach(acc => {
        const pos  = positions[acc.id] ?? { x: COMP_INIT_X + NODE_W + 120, y: 0 };
        const size = nodeSizes[acc.id]  ?? { w: NODE_W, h: 60 };
        actionCenters[acc.id] = { x: pos.x, y: pos.y + size.h / 2 };
      });
    }
  });

  // ── WebCanvas (desktop) ───────────────────────────────────────────────────
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

      {/* Meta node fijo */}
      <div
        style={{ position: 'absolute', left: META_X, top: META_Y } as any}
        ref={(el) => { if (el) metaSize.current = { w: el.offsetWidth, h: el.offsetHeight }; }}
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
            comp={comp} pos={pos}
            positions={positions} setPositions={setPositions} setNodeSize={setNodeSize}
            isOpen={isOpen} accCount={accs.length}
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
              acc={acc} pos={pos}
              positions={positions} setPositions={setPositions} setNodeSize={setNodeSize}
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
          <View style={s.emptyBox}>
            <Text style={s.emptyTxt}>Sin componentes</Text>
            {canCrearComponente && (
              <Button label="+ Componente" size="sm" onPress={() => setModalComp(true)} style={{ marginTop: spacing.xs }} />
            )}
          </View>
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppShell scrollable={false} style={s.shell}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
          <Text style={s.backTxt}>Volver</Text>
        </TouchableOpacity>
        <Text style={s.pageTitle} numberOfLines={1}>{meta.nombre}</Text>
      </View>

      <View style={s.canvasWrap}>
        {Platform.OS === 'web' && !isMobile
          ? <MetaMapCanvas>{WebCanvas}</MetaMapCanvas>
          : (
            <MetaMobileTree
              proyectoId={proyectoId}
              meta={meta}
              componentes={componentes}
              acciones={acciones}
              loadingAcc={loadingAcc}
              expanded={expanded}
              metaOpen={metaOpen}
              esCoordinadorComponenteRestringido={esCoordinadorComponenteRestringido}
              componentesAsignadosIds={componentesAsignadosIds}
              canCrearComponente={canCrearComponente}
              canEditarMeta={canEditarMeta}
              canEliminarMeta={canEliminarMeta}
              canCrearAccion={canCrearAccion}
              canEditarComponente={canEditarComponente}
              canEliminarComponente={canEliminarComponente}
              canEditarAccion={canEditarAccion}
              canEliminarAccion={canEliminarAccion}
              canSubirEvidencia={canSubirEvidencia}
              canGestionarResponsables={canGestionarResponsables}
              onToggleMeta={() => setMetaOpen(v => !v)}
              onToggleComp={toggleComp}
              onAddComp={() => setModalComp(true)}
              onEditMeta={() => setEditMeta(true)}
              onDeleteMeta={() => setDeleteData({ kind: 'meta', id: meta.id })}
              onEditComp={setEditComp}
              onDeleteComp={(id) => setDeleteData({ kind: 'componente', id })}
              onDeleteAcc={(id, compId) => setDeleteData({ kind: 'accion', id, extraId: compId })}
              onEditEvid={setModalEvid}
              onManageResp={setModalResp}
            />
          )
        }
      </View>

      {/* Modales */}
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
          message="¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer."
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

const s = StyleSheet.create({
  shell:      { backgroundColor: colors.background, flex: 1 },
  canvasWrap: { flex: 1 },
  topBar:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' } as any,
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 } as any,
  backTxt:    { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.primary, fontWeight: typography.weights.bold },
  pageTitle:  { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary, flex: 1 },
  emptyBox:   { padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: 10, borderStyle: 'dashed' as any, alignItems: 'center' },
  emptyTxt:   { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary, fontStyle: 'italic' },
});
