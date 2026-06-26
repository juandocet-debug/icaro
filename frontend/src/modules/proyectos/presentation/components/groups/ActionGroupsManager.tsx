import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useActionGroups, ActionGroup } from '../../hooks/useActionGroups';
import { ActionGroupForm } from './ActionGroupForm';

interface ActionGroupsManagerProps {
  accionId: string;
}

export function ActionGroupsManager({ accionId }: ActionGroupsManagerProps) {
  const { groups, loading, error, fetchGroups, createGroup, updateGroup, deleteGroup } = useActionGroups(accionId);
  const [formVisible, setFormVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ActionGroup | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (accionId) {
      fetchGroups();
    }
  }, [accionId, fetchGroups]);

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setFormVisible(true);
  };

  const handleOpenEdit = (grupo: ActionGroup) => {
    setEditingGroup(grupo);
    setFormVisible(true);
  };

  const handleSave = async (datos: { nombre: string; codigo: string; descripcion: string }) => {
    setSaving(true);
    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, datos);
      } else {
        await createGroup(datos);
      }
      setFormVisible(false);
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Error al guardar el grupo');
      } else {
        Alert.alert('Error', err.message || 'Error al guardar el grupo');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (grupo: ActionGroup) => {
    const confirmDelete = async () => {
      try {
        const res = await deleteGroup(grupo.id);
        const msg = res.mensaje || 'Operación completada';
        if (Platform.OS === 'web') {
          window.alert(msg);
        } else {
          Alert.alert('Info', msg);
        }
      } catch (err: any) {
        if (Platform.OS === 'web') {
          window.alert(err.message || 'Error al eliminar grupo');
        } else {
          Alert.alert('Error', err.message || 'Error al eliminar grupo');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Estás seguro de eliminar o desactivar el grupo "${grupo.nombre}"?`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Confirmar',
        `¿Estás seguro de eliminar o desactivar el grupo "${grupo.nombre}"?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Aceptar', onPress: confirmDelete }
        ]
      );
    }
  };

  const handleToggleActivo = async (grupo: ActionGroup) => {
    try {
      await updateGroup(grupo.id, { activo: !grupo.activo });
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Error al cambiar estado');
      } else {
        Alert.alert('Error', err.message || 'Error al cambiar estado');
      }
    }
  };

  if (loading && groups.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Grupos Asociados</Text>
          <Text style={styles.subtitle}>Gestiona las secciones o cohortes asociadas a esta acción</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate}>
          <Text style={styles.addBtnText}>+ Agregar Grupo</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No hay grupos configurados para esta acción.</Text>
          <Text style={styles.emptyStateSubtext}>Los grupos permiten clasificar y filtrar las evidencias de asistencia y sesiones.</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.card, !item.activo && styles.cardInactive]}>
              <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardName, !item.activo && styles.cardNameInactive]}>
                    {item.nombre}
                  </Text>
                  {item.codigo && (
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeText}>{item.codigo}</Text>
                    </View>
                  )}
                  <View style={[styles.statusBadge, item.activo ? styles.statusActive : styles.statusInactive]}>
                    <Text style={[styles.statusText, item.activo ? styles.statusActiveText : styles.statusInactiveText]}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                </View>
                {item.descripcion && (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.descripcion}
                  </Text>
                )}
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEdit(item)}>
                  <Text style={styles.actionBtnText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleActivo(item)}>
                  <Text style={[styles.actionBtnText, { color: item.activo ? '#eab308' : '#10b981' }]}>
                    {item.activo ? 'Desactivar' : 'Activar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {formVisible && (
        <ActionGroupForm
          visible={formVisible}
          onCancel={() => setFormVisible(false)}
          onSave={handleSave}
          initialValues={editingGroup ? {
            nombre: editingGroup.nombre,
            codigo: editingGroup.codigo,
            descripcion: editingGroup.descripcion
          } : undefined}
          saving={saving}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginTop: 16,
  },
  center: {
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBtnText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardInactive: {
    backgroundColor: '#f3f4f6',
    opacity: 0.8,
  },
  cardInfo: {
    flex: 1,
    minWidth: 200,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardNameInactive: {
    color: '#9ca3af',
    textDecorationLine: 'line-through',
  },
  cardDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  codeBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369a1',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#dcfce7',
  },
  statusInactive: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusActiveText: {
    color: '#15803d',
  },
  statusInactiveText: {
    color: '#b91c1c',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  deleteBtn: {
    marginLeft: 4,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
});
