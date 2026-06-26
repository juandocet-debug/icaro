import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '../../../shared/components/AppShell';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { TextField } from '../../../shared/components/TextField';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { useMisActividades } from './hooks/useMisActividades';
import { useAccess } from '../../auth/presentation/useAccess';
import { ActividadesSidebar } from './components/ActividadesSidebar';
import { EvidenciasGrid } from './components/EvidenciasGrid';
import { EvidenciaDetailModal } from './components/EvidenciaDetailModal';
import { styles } from './components/MisActividadesStyles';
import { ActionGroupSearchSelect } from './components/groups/ActionGroupSearchSelect';

interface Props { selectedAccionId?: string; }

export const MisActividadesScreen: React.FC<Props> = ({ selectedAccionId }) => {
  const state = useMisActividades(selectedAccionId);
  const { accessProfile } = useAccess();
  const proyectoNombre = accessProfile?.asignaciones?.[0]?.proyectoNombre ?? 'Proyecto';

  // Modal para Crear Evidencia Rápida
  const renderCrearEvidenciaModal = () => (
    <Modal visible={state.showEvModal} transparent animationType="fade" onRequestClose={() => state.setShowEvModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Evidencia Operativa</Text>
            <TouchableOpacity onPress={() => state.setShowEvModal(false)}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {(() => {
            const tipos: string[] = state.selectedAct?.accion?.tipos_evidencia_permitidos ?? [];
            const unidad = state.selectedAct?.accion?.unidad_medida || 'unidades';
            if (tipos.length === 0) {
              // Sin tipos: nombre y cantidad ya auto-poblados en openEvModal, solo mostrar badge informativo
              return (
                <View style={{ marginBottom: spacing.sm,
                  flexDirection: 'row', alignItems: 'center', gap: 8 } as any}>
                  <View style={{ backgroundColor: `${colors.primary}15`, borderRadius: 10,
                    paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1.5, borderColor: `${colors.primary}60` }}>
                    <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '700',
                      fontFamily: typography.fontFamily }}>
                      ✓ 1 {unidad}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1,
                    fontFamily: typography.fontFamily }}>
                    Se registrará 1 ejecución
                  </Text>
                </View>
              );
            }
            // Con tipos configurados: chips seleccionables
            return (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={styles.formLabel}>Selecciona el tipo de evidencia *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 4 } as any}>
                  {tipos.map((t: string) => {
                    const selected = state.evNombre === t;
                    return (
                      <TouchableOpacity key={t}
                        style={{
                          paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
                          borderWidth: 1.5,
                          borderColor: selected ? colors.primary : colors.border,
                          backgroundColor: selected ? `${colors.primary}15` : colors.surface,
                        }}
                        onPress={() => {
                          state.setEvNombre(t);
                          state.setEvCantidad('1');
                        }}>
                        <Text style={{ fontSize: 13,
                          color: selected ? colors.primary : colors.textSecondary,
                          fontWeight: selected ? '700' : '400' }}>
                          {selected ? `✓ 1 ${t}` : `1 ${t}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })()}

          {state.selectedAct?.accion?.requiere_grupos && (
            <ActionGroupSearchSelect
              accionId={state.selectedAct.accion.id}
              selectedGrupoId={state.evGrupoId}
              onSelectGrupo={(g) => state.setEvGrupoId(g ? g.id : '')}
              error={null}
            />
          )}

          <TextField
            label="Descripción / Bitácora"
            value={state.evDescripcion}
            onChangeText={state.setEvDescripcion}
            placeholder="Detalla las actividades realizadas..."
            style={{ marginBottom: spacing.sm }}
          />

          <Text style={styles.formLabel}>Fecha de Ejecución</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={state.evFecha}
              onChange={(e: any) => state.setEvFecha(e.target.value)}
              style={styles.htmlDateInput}
            />
          ) : (
            <TextField
              label=""
              value={state.evFecha}
              onChangeText={state.setEvFecha}
              placeholder="YYYY-MM-DD"
              style={{ marginBottom: spacing.md }}
            />
          )}

          {!!state.evModalErr && <ErrorMessage message={state.evModalErr} />}

          <Button
            label={state.evModalSaving ? 'Guardando...' : 'Crear Evidencia'}
            onPress={state.handleCreateEvidencia}
            loading={state.evModalSaving}
            disabled={state.evModalSaving || !state.evNombre || !state.evCantidad || (state.selectedAct?.accion?.requiere_grupos && !state.evGrupoId)}
            style={{ marginTop: spacing.md, backgroundColor: colors.primary }}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <AppShell scrollable={false}>
      {state.loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : state.error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <ErrorMessage message={state.error} />
        </View>
      ) : (
        <View style={styles.root}>
          {/* LADO IZQUIERDO: Sidebar Listado Actividades */}
          <ActividadesSidebar {...state} />

          {/* COLUMNA CENTRAL: Grilla de Tarjetas de Evidencias */}
          {state.selectedAct ? (
            state.detailLoad ? (
              <View style={[styles.colMain, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <EvidenciasGrid {...state} proyectoNombre={proyectoNombre} />
            )
          ) : (
            <View style={[styles.colMain, { justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
              <Text style={{ color: colors.textSecondary }}>Selecciona una actividad para ver sus evidencias.</Text>
            </View>
          )}
        </View>
      )}

      {/* MODAL GRANDE: Detalle de Evidencia y Carga Soportes */}
      <EvidenciaDetailModal {...state} />

      {/* MODAL CREAR: Para crear la carpeta inicial */}
      {renderCrearEvidenciaModal()}
    </AppShell>
  );
};
