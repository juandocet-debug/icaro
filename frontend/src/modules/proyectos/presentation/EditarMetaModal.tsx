import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { TextField } from '../../../shared/components/TextField';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { actualizarMetaUseCase } from '../../../shared/dependencies';
import { Meta } from '../domain/Meta';

interface Props {
  proyectoId: string;
  meta: Meta | null;
  visible: boolean;
  onClose: () => void;
  onActualizado: () => void;
}

export const EditarMetaModal: React.FC<Props> = ({ proyectoId, meta, visible, onClose, onActualizado }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (meta && visible) {
      setNombre(meta.nombre);
      setDescripcion(meta.descripcion || '');
      setError(null);
    }
  }, [meta, visible]);

  const handleClose = () => { onClose(); };

  const handleGuardar = async () => {
    if (!meta) return;
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true); setError(null);
    try {
      await actualizarMetaUseCase.ejecutar(proyectoId, meta.id, { nombre: nombre.trim(), descripcion: descripcion.trim() || undefined });
      onActualizado();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al actualizar la meta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.center}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.titulo}>Editar Meta</Text>
            <TouchableOpacity onPress={handleClose}><Text style={styles.cerrar}>✕</Text></TouchableOpacity>
          </View>
          {!!error && <ErrorMessage message={error} />}
          <TextField label="Nombre *" value={nombre} onChangeText={setNombre} placeholder="Nombre de la meta" autoCapitalize="sentences" />
          <TextField label="Descripción" value={descripcion} onChangeText={setDescripcion} placeholder="Descripción opcional" autoCapitalize="sentences" />
          <View style={styles.actions}>
            <Button label="Cancelar" variant="ghost" onPress={handleClose} style={styles.btnCancel} />
            <Button label="Guardar" onPress={handleGuardar} loading={saving} disabled={saving} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, width: '100%', maxWidth: 480 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  titulo: { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  cerrar: { fontFamily: typography.fontFamily, fontSize: 18, color: colors.textSecondary, paddingHorizontal: spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm } as any,
  btnCancel: { marginRight: spacing.xs },
});
