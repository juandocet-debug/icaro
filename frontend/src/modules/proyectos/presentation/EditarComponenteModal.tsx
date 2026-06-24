import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { TextField } from '../../../shared/components/TextField';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { actualizarComponenteUseCase } from '../../../shared/dependencies';
import { Componente } from '../domain/Componente';

interface Props {
  proyectoId: string;
  componente: Componente | null;
  visible: boolean;
  onClose: () => void;
  onActualizado: () => void;
}

export const EditarComponenteModal: React.FC<Props> = ({ proyectoId, componente, visible, onClose, onActualizado }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (componente && visible) {
      setNombre(componente.nombre);
      setDescripcion(componente.descripcion || '');
      setError(null);
    }
  }, [componente, visible]);

  const handleClose = () => { onClose(); };

  const handleGuardar = async () => {
    if (!componente) return;
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true); setError(null);
    try {
      await actualizarComponenteUseCase.ejecutar(proyectoId, componente.id, { nombre: nombre.trim(), descripcion: descripcion.trim() || undefined });
      onActualizado();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al actualizar el componente.');
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
            <Text style={styles.titulo}>Editar Componente</Text>
            <TouchableOpacity onPress={handleClose}><Text style={styles.cerrar}>✕</Text></TouchableOpacity>
          </View>
          {!!error && <ErrorMessage message={error} />}
          <TextField label="Nombre *" value={nombre} onChangeText={setNombre} placeholder="Nombre del componente" autoCapitalize="sentences" />
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
