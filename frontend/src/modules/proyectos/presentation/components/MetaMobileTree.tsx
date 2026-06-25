import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MetaMapNode } from '../MetaMapNode';
import { colors } from '../../../../shared/constants/colors';
import { spacing } from '../../../../shared/constants/spacing';
import { typography } from '../../../../shared/constants/typography';
import { Meta } from '../../domain/Meta';
import { Componente } from '../../domain/Componente';
import { Accion } from '../../domain/Accion';

interface MetaMobileTreeProps {
  proyectoId: string;
  meta: Meta;
  componentes: Componente[];
  acciones: Record<string, Accion[]>;
  loadingAcc: Record<string, boolean>;
  expanded: Record<string, boolean>;
  metaOpen: boolean;
  esCoordinadorComponenteRestringido: boolean;
  componentesAsignadosIds: string[];
  // Permisos
  canCrearComponente: boolean;
  canEditarMeta: boolean;
  canEliminarMeta: boolean;
  canCrearAccion: boolean;
  canEditarComponente: boolean;
  canEliminarComponente: boolean;
  canEditarAccion: boolean;
  canEliminarAccion: boolean;
  canSubirEvidencia: boolean;
  canGestionarResponsables: boolean;
  // Callbacks
  onToggleMeta: () => void;
  onToggleComp: (id: string) => void;
  onAddComp: () => void;
  onEditMeta: () => void;
  onDeleteMeta: () => void;
  onEditComp: (comp: Componente) => void;
  onDeleteComp: (id: string) => void;
  onDeleteAcc: (id: string, compId: string) => void;
  onEditEvid: (acc: Accion & { componenteId: string }) => void;
  onManageResp: (acc: Accion & { componenteId: string }) => void;
}

/**
 * Vista de árbol del mapa para dispositivos móviles.
 * Usa un contenedor scrolleable libre en X+Y (pan con el dedo) — Bug 2 fix.
 * Los nodos no se arrastran individualmente pero el mapa completo es paneable.
 */
export const MetaMobileTree: React.FC<MetaMobileTreeProps> = ({
  proyectoId, meta, componentes, acciones, loadingAcc,
  expanded, metaOpen, esCoordinadorComponenteRestringido, componentesAsignadosIds,
  canCrearComponente, canEditarMeta, canEliminarMeta,
  canCrearAccion, canEditarComponente, canEliminarComponente,
  canEditarAccion, canEliminarAccion, canSubirEvidencia, canGestionarResponsables,
  onToggleMeta, onToggleComp, onAddComp, onEditMeta, onDeleteMeta,
  onEditComp, onDeleteComp, onDeleteAcc, onEditEvid, onManageResp,
}) => {
  return (
    // Un único div con overflow: scroll en AMBAS direcciones → pan libre con el dedo (Bug 2 fix)
    <div style={{
      flex: 1,
      overflow: 'scroll',
      WebkitOverflowScrolling: 'touch',
      // Pan libre sin interferir con pinch-zoom del browser
      touchAction: 'pan-x pan-y',
      maxHeight: '100%',
    } as any}>
      {/* Contenedor con tamaño mínimo para que haya espacio de scroll */}
      <View style={s.tree}>
        {/* Hint de navegación */}
        <View style={s.hint}>
          <Ionicons name="hand-left-outline" size={13} color={colors.textSecondary} />
          <Text style={s.hintTxt}>Desliza para navegar · Pellizca para zoom</Text>
        </View>

        {/* Nodo Meta */}
        <MetaMapNode
          kind="meta"
          title={meta.nombre}
          subtitle={meta.descripcion}
          badge={meta.activo ? 'Activa' : 'Archivada'}
          expanded={metaOpen}
          onToggle={onToggleMeta}
          onAdd={canCrearComponente ? onAddComp : undefined}
          onEdit={canEditarMeta ? onEditMeta : undefined}
          onDelete={canEliminarMeta ? onDeleteMeta : undefined}
        />

        {/* Componentes y acciones */}
        {metaOpen && componentes.map((comp) => {
          const isOpen = !!expanded[comp.id];
          const accs   = acciones[comp.id] ?? [];
          const isCompDisabled = esCoordinadorComponenteRestringido && !componentesAsignadosIds.includes(comp.id);

          return (
            <View key={comp.id} style={s.compRow}>
              <View style={s.branch} />
              <View style={s.compContent}>
                <MetaMapNode
                  kind="componente"
                  title={comp.nombre}
                  subtitle={comp.descripcion}
                  counter={accs.length}
                  expanded={isOpen}
                  onToggle={() => onToggleComp(comp.id)}
                  onAdd={canCrearAccion
                    ? () => router.push(`/proyectos/${proyectoId}/acciones/crear?componenteId=${comp.id}` as any)
                    : undefined}
                  onEdit={canEditarComponente ? () => onEditComp(comp) : undefined}
                  onDelete={canEliminarComponente ? () => onDeleteComp(comp.id) : undefined}
                  disabled={isCompDisabled}
                />

                {/* Acciones del componente */}
                {isOpen && accs.map((acc) => (
                  <View key={acc.id} style={s.accRow}>
                    <View style={s.accBranch} />
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
                      onManageResponsibles={canGestionarResponsables
                        ? () => onManageResp({ ...acc, componenteId: comp.id })
                        : undefined}
                      onEvidencia={canSubirEvidencia
                        ? () => onEditEvid({ ...acc, componenteId: comp.id })
                        : undefined}
                      onEdit={canEditarAccion
                        ? () => router.push(`/proyectos/${proyectoId}/acciones/${acc.id}/editar?componenteId=${comp.id}` as any)
                        : undefined}
                      onDelete={canEliminarAccion
                        ? () => onDeleteAcc(acc.id, comp.id)
                        : undefined}
                      disabled={isCompDisabled}
                    />
                  </View>
                ))}

                {isOpen && loadingAcc[comp.id] && (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={{ marginTop: spacing.sm, marginLeft: 32 }}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </div>
  );
};

const s = StyleSheet.create({
  tree:        { padding: spacing.md, minWidth: 340, paddingBottom: 60 },
  hint:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: `${colors.primary}08`, borderRadius: 8, marginBottom: spacing.md } as any,
  hintTxt:     { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary, flex: 1 },
  compRow:     { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.md } as any,
  branch:      { width: 32, height: 2, backgroundColor: colors.primary, opacity: 0.4, marginRight: spacing.sm, marginTop: 20 },
  compContent: { flex: 1 },
  accRow:      { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm, marginLeft: 16 } as any,
  accBranch:   { width: 24, height: 2, backgroundColor: colors.accent, opacity: 0.5, marginRight: spacing.sm, marginTop: 18 },
});
