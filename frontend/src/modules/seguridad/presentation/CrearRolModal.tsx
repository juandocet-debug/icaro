import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { Permiso } from '../domain/Permiso';
import { Rol } from '../domain/Rol';

interface CrearRolModalProps {
  visible: boolean;
  onClose: () => void;
  onGuardar: (nombre: string, descripcion: string, permisos: string[]) => Promise<void>;
  permisos: Permiso[];
  rolesExistentes: Rol[];
  saving: boolean;
  rolEditar?: Rol | null;
}

export const CrearRolModal: React.FC<CrearRolModalProps> = ({
  visible,
  onClose,
  onGuardar,
  permisos,
  rolesExistentes,
  saving,
  rolEditar = null,
}) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [permisosSeleccionados, setPermisosSeleccionados] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (visible) {
      if (rolEditar) {
        setNombre(rolEditar.nombre);
        setDescripcion(rolEditar.descripcion);
        setPermisosSeleccionados(rolEditar.permisos || []);
      } else {
        setNombre('');
        setDescripcion('');
        setPermisosSeleccionados([]);
      }
      setError(null);
      // Auto expandir todos los folders por defecto
      const initExpanded: Record<string, boolean> = {};
      permisos.forEach((p) => {
        initExpanded[p.modulo] = true;
      });
      setExpandedFolders(initExpanded);
    }
  }, [visible, rolEditar, permisos]);

  const toggleFolder = (modulo: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [modulo]: !prev[modulo],
    }));
  };

  const togglePermiso = (codigo: string) => {
    setPermisosSeleccionados((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]
    );
  };

  const toggleFolderSelection = (modulo: string, moduloPermisos: Permiso[]) => {
    const codigos = moduloPermisos.map((p) => p.codigo);
    const todosSeleccionados = codigos.every((c) => permisosSeleccionados.includes(c));

    if (todosSeleccionados) {
      setPermisosSeleccionados((prev) => prev.filter((c) => !codigos.includes(c)));
    } else {
      setPermisosSeleccionados((prev) => {
        const filtrado = prev.filter((c) => !codigos.includes(c));
        return [...filtrado, ...codigos];
      });
    }
  };

  const handleCrear = async () => {
    setError(null);
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (!descripcion.trim()) {
      setError('La descripción es obligatoria.');
      return;
    }
    
    const duplicate = rolesExistentes.some(
      (r) => r.nombre.toLowerCase().trim() === nombre.toLowerCase().trim() && (!rolEditar || r.id !== rolEditar.id)
    );
    if (duplicate) {
      setError('Ya existe un rol con ese nombre.');
      return;
    }

    try {
      await onGuardar(nombre.trim(), descripcion.trim(), permisosSeleccionados);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Error al guardar el rol.');
    }
  };

  const permisosAgrupados = permisos.reduce((acc, curr) => {
    if (!acc[curr.modulo]) {
      acc[curr.modulo] = [];
    }
    acc[curr.modulo].push(curr);
    return acc;
  }, {} as Record<string, Permiso[]>);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Card padding="lg" style={styles.modalCard}>
          <Text style={styles.titulo}>{rolEditar ? 'Editar Rol' : 'Nuevo Rol'}</Text>
          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Supervisor de Zona"
              placeholderTextColor={colors.textSecondary}
              value={nombre}
              onChangeText={setNombre}
            />

            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              placeholder="Breve descripción de las responsabilidades..."
              placeholderTextColor={colors.textSecondary}
              value={descripcion}
              onChangeText={setDescripcion}
            />

            <Text style={styles.sectionTitle}>Permisos del sistema</Text>
            
            {Object.entries(permisosAgrupados).map(([modulo, lista]) => {
              const codigos = lista.map((p) => p.codigo);
              const seleccionadosCount = codigos.filter((c) => permisosSeleccionados.includes(c)).length;
              const isFolderOpen = expandedFolders[modulo];
              const isAllChecked = seleccionadosCount === lista.length;
              const isPartialChecked = seleccionadosCount > 0 && seleccionadosCount < lista.length;

              return (
                <View key={modulo} style={styles.folderContainer}>
                  {/* Folder Header */}
                  <View style={styles.folderHeader}>
                    <TouchableOpacity
                      onPress={() => toggleFolderSelection(modulo, lista)}
                      style={styles.folderCheckboxRow}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.checkbox,
                        isAllChecked && styles.checkboxActive,
                        isPartialChecked && styles.checkboxPartial
                      ]} />
                      <Ionicons name="folder-outline" size={18} color={colors.primary} style={styles.folderIcon} />
                      <Text style={styles.moduloTitle}>{modulo}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => toggleFolder(modulo)} style={styles.counterRow}>
                      <Text style={styles.counterText}>{seleccionadosCount} de {lista.length}</Text>
                      <Ionicons name={isFolderOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Folder Items Accordion */}
                  {isFolderOpen && (
                    <View style={styles.folderContent}>
                      {lista.map((p) => {
                        const isSelected = permisosSeleccionados.includes(p.codigo);
                        return (
                          <TouchableOpacity
                            key={p.codigo}
                            style={[styles.checkboxRow, isSelected && styles.checkboxRowActive]}
                            onPress={() => togglePermiso(p.codigo)}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.checkbox, isSelected && styles.checkboxActive]} />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.checkboxLabel, isSelected && styles.checkboxLabelActive]}>{p.nombre}</Text>
                              {!!p.descripcion && <Text style={styles.checkboxDesc}>{p.descripcion}</Text>}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <Button label="Cancelar" variant="ghost" onPress={onClose} />
            <Button label={rolEditar ? 'Guardar Cambios' : 'Crear rol'} onPress={handleCrear} loading={saving} />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: 600,
    maxWidth: '90%' as any,
    maxHeight: '85%' as any,
  },
  titulo: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  scroll: {
    maxHeight: 450,
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  folderContainer: {
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    overflow: 'hidden' as any,
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: 'rgba(108,85,201,0.03)',
  },
  folderCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderIcon: {
    marginRight: spacing.xs,
  },
  moduloTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  } as any,
  counterText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  folderContent: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  } as any,
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  checkboxRowActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(108,85,201,0.04)',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    marginRight: spacing.sm,
    marginTop: 2,
  },
  checkboxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxPartial: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(108,85,201,0.5)',
  },
  checkboxLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  checkboxLabelActive: {
    fontWeight: typography.weights.bold,
  },
  checkboxDesc: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  } as any,
  errorText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginBottom: spacing.sm,
  },
});
