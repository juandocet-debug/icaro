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
import { ActividadesSidebar } from './components/ActividadesSidebar';
import { EvidenciasGrid } from './components/EvidenciasGrid';
import { EvidenciaDetailModal } from './components/EvidenciaDetailModal';
import { styles } from './components/MisActividadesStyles';

interface Props { selectedAccionId?: string; }

export const MisActividadesScreen: React.FC<Props> = ({ selectedAccionId }) => {
  const state = useMisActividades(selectedAccionId);

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
            if (tipos.length === 0) {
              return (
                <View style={{ backgroundColor: '#fef3c7', borderRadius: 8, padding: 12, marginBottom: spacing.sm }}>
                  <Text style={{ fontSize: 12, color: '#92400e' }}>
                    El coordinador aún no ha definido los tipos de evidencia para esta acción. Solicita que los configure antes de registrar.
                  </Text>
                </View>
              );
            }
            return (
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={styles.formLabel}>Tipo de evidencia *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 4 } as any}>
                  {tipos.map((t: string) => (
                    <TouchableOpacity key={t}
                      style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
                        borderWidth: 1.5,
                        borderColor: state.evNombre === t ? colors.primary : colors.border,
                        backgroundColor: state.evNombre === t ? `${colors.primary}12` : colors.surface }}
                      onPress={() => state.setEvNombre(t)}>
                      <Text style={{ fontSize: 13,
                        color: state.evNombre === t ? colors.primary : colors.textSecondary,
                        fontWeight: state.evNombre === t ? '700' : '400' }}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          })()}

          <Text style={styles.formLabel}>¿A cuánto equivale esta entrega/evidencia? *</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm } as any}>
            <TextField
              label=""
              value={state.evCantidad}
              onChangeText={state.setEvCantidad}
              placeholder="Ej. 1, 2.5, 10"
              keyboardType="numeric"
              style={{ flex: 1, marginBottom: 0 }}
            />
            <Text style={{ fontFamily: typography.fontFamily, fontSize: 13, color: colors.textPrimary, fontWeight: '700' }}>
              {state.selectedAct?.accion?.unidad_medida || 'unidades'}
            </Text>
          </View>

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
            disabled={state.evModalSaving || !state.evNombre || !state.evCantidad || (state.selectedAct?.accion?.tipos_evidencia_permitidos ?? []).length === 0}
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
              <EvidenciasGrid {...state} />
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
