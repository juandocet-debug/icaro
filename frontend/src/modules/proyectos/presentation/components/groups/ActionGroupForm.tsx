import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';

interface ActionGroupFormProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (datos: { nombre: string; codigo: string; descripcion: string }) => Promise<void>;
  initialValues?: { nombre: string; codigo?: string | null; descripcion?: string | null };
  saving?: boolean;
}

export function ActionGroupForm({ visible, onCancel, onSave, initialValues, saving = false }: ActionGroupFormProps) {
  const [nombre, setNombre] = useState(initialValues?.nombre || '');
  const [codigo, setCodigo] = useState(initialValues?.codigo || '');
  const [descripcion, setDescripcion] = useState(initialValues?.descripcion || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = () => {
    if (!nombre.trim()) {
      setValidationError('El nombre del grupo es obligatorio.');
      return;
    }
    setValidationError(null);
    onSave({ nombre, codigo, descripcion });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {initialValues ? 'Editar Grupo' : 'Nuevo Grupo'}
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Grupo de la mañana, Comisión A"
              placeholderTextColor="#9ca3af"
              value={nombre}
              onChangeText={setNombre}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Código (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. GRP-A"
              placeholderTextColor="#9ca3af"
              value={codigo}
              onChangeText={setCodigo}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ej. Estudiantes de ingeniería de minas"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              value={descripcion}
              onChangeText={setDescripcion}
            />
          </View>

          {validationError && (
            <Text style={styles.errorText}>{validationError}</Text>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={saving}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 450,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 16,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
