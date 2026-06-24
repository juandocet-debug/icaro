import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { SearchableSelect, SelectOption } from '../../../shared/components/SearchableSelect';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { asignacionResponsableRepo } from '../../../shared/dependencies';
import { AsignacionResponsable, MiembroAsignable } from '../domain/AsignacionResponsableRepositoryPort';

interface Props {
  componenteId: string;
  accionId: string;
  accionNombre: string;
  visible: boolean;
  onClose: () => void;
}

export const GestionarResponsablesActividadModal: React.FC<Props> = ({
  componenteId,
  accionId,
  accionNombre,
  visible,
  onClose,
}) => {
  const [asignados, setAsignados] = useState<AsignacionResponsable[]>([]);
  const [miembrosAsignables, setMiembrosAsignables] = useState<MiembroAsignable[]>([]);
  const [selectedMiembroId, setSelectedMiembroId] = useState('');
  const [tipoAsignacion, setTipoAsignacion] = useState<'responsable' | 'apoyo'>('responsable');
  const [loading, setLoading] = useState(false);
  const [loadingAsignables, setLoadingAsignables] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarAsignados = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await asignacionResponsableRepo.listarResponsables(componenteId, accionId);
      setAsignados(data);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al cargar responsables.');
    } finally {
      setLoading(false);
    }
  };

  const cargarAsignables = async () => {
    setLoadingAsignables(true);
    try {
      const data = await asignacionResponsableRepo.buscarMiembrosAsignables(componenteId, accionId, '');
      setMiembrosAsignables(data);
    } catch {
      // silencioso — el selector simplemente queda vacío
    } finally {
      setLoadingAsignables(false);
    }
  };

  useEffect(() => {
    if (visible && accionId) {
      cargarAsignados();
      cargarAsignables();
      setSelectedMiembroId('');
    }
  }, [visible, accionId]);

  const refrescar = async () => {
    await Promise.all([cargarAsignados(), cargarAsignables()]);
  };

  const opcionesAsignables = useMemo<SelectOption[]>(() => {
    const yaAsignadosIds = new Set(asignados.map((a) => String(a.usuarioId)));
    return miembrosAsignables
      .filter((m) => !yaAsignadosIds.has(String(m.id)))
      .map((m) => ({
        id: String(m.id),
        name: m.nombreCompleto,
        description: `@${m.username}${m.email ? ' • ' + m.email : ''}`,
      }));
  }, [miembrosAsignables, asignados]);

  const handleAsignar = async () => {
    if (!selectedMiembroId) return;
    const miembro = miembrosAsignables.find((m) => String(m.id) === selectedMiembroId);
    if (!miembro) return;
    setSaving(true);
    setError(null);
    try {
      await asignacionResponsableRepo.asignarResponsable(
        componenteId, accionId, miembro.id, tipoAsignacion,
      );
      setSelectedMiembroId('');
      await refrescar();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al asignar responsable.');
    } finally {
      setSaving(false);
    }
  };

  const handleRetirar = async (asignacionId: string) => {
    setError(null);
    try {
      await asignacionResponsableRepo.retirarResponsable(componenteId, accionId, asignacionId);
      await refrescar();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al retirar responsable.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.center}>
        <View style={styles.card}>
          {/* Encabezado */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: spacing.md }}>
              <Text style={styles.titulo}>Gestionar Responsables</Text>
              <Text style={styles.subtitulo} numberOfLines={1}>{accionNombre}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {!!error && <View style={{ marginBottom: spacing.md }}><ErrorMessage message={error} /></View>}

          {/* ── Sección: Asignar nuevo miembro ── */}
          <Text style={styles.sectionLabel}>ASIGNAR MIEMBRO</Text>

          {/* Tipo de asignación */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeBtn, tipoAsignacion === 'responsable' && styles.typeBtnActive]}
              onPress={() => setTipoAsignacion('responsable')}
            >
              <Text style={[styles.typeBtnTitle, tipoAsignacion === 'responsable' && styles.typeBtnTitleActive]}>
                Responsable
              </Text>
              <Text style={[styles.typeBtnSub, tipoAsignacion === 'responsable' && styles.typeBtnSubActive]}>
                Registra ejecución
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, tipoAsignacion === 'apoyo' && styles.typeBtnActive]}
              onPress={() => setTipoAsignacion('apoyo')}
            >
              <Text style={[styles.typeBtnTitle, tipoAsignacion === 'apoyo' && styles.typeBtnTitleActive]}>
                Apoyo
              </Text>
              <Text style={[styles.typeBtnSub, tipoAsignacion === 'apoyo' && styles.typeBtnSubActive]}>
                Carga evidencias
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selector + botón en fila */}
          <View style={styles.selectorRow}>
            <View style={styles.selectorWrap}>
              {loadingAsignables ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ height: 38 }} />
              ) : (
                <SearchableSelect
                  options={opcionesAsignables}
                  selectedValue={selectedMiembroId}
                  onSelect={setSelectedMiembroId}
                  placeholder="Buscar por nombre o cédula..."
                />
              )}
            </View>
            <Button
              label="Asignar"
              size="sm"
              onPress={handleAsignar}
              loading={saving}
              disabled={!selectedMiembroId || saving}
              style={styles.btnAsignar}
            />
          </View>

          {/* ── Sección: Miembros asignados ── */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>MIEMBROS ASIGNADOS</Text>

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
          ) : asignados.length === 0 ? (
            <Text style={styles.emptyText}>No hay responsables asignados a esta actividad.</Text>
          ) : (
            <ScrollView style={styles.listContainer} nestedScrollEnabled>
              {asignados.map((item) => (
                <View key={item.id} style={styles.item}>
                  <View style={styles.itemAvatar}>
                    <Text style={styles.itemAvatarText}>
                      {(item.nombreCompleto || item.username || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.nombreCompleto}</Text>
                    <Text style={styles.itemRole}>
                      @{item.username} · {item.tipoAsignacion === 'responsable' ? 'Responsable' : 'Apoyo'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRetirar(item.id)} style={styles.btnRemove}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <Button label="Cerrar" variant="secondary" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  titulo: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  subtitulo: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  } as any,
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  typeBtnTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  typeBtnTitleActive: {
    color: colors.primary,
  },
  typeBtnSub: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  typeBtnSubActive: {
    color: colors.primary,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    zIndex: 50,
    marginBottom: spacing.xs,
  } as any,
  selectorWrap: {
    flex: 1,
    zIndex: 50,
  } as any,
  btnAsignar: {
    minWidth: 80,
    alignSelf: 'stretch',
  },
  listContainer: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  itemAvatarText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  itemRole: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  btnRemove: { padding: spacing.xs },
  emptyText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginVertical: spacing.sm,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
});
