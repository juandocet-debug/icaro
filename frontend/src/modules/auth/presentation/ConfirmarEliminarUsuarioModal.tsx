import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { UsuarioEntity } from '../domain/UsuariosRepositoryPort';

interface ConfirmarEliminarUsuarioModalProps {
  visible: boolean;
  onClose: () => void;
  usuario: UsuarioEntity | null;
  onConfirm: () => Promise<void>;
}

export const ConfirmarEliminarUsuarioModal: React.FC<ConfirmarEliminarUsuarioModalProps> = ({
  visible, onClose, usuario, onConfirm
}) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? 'Error al eliminar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  if (!usuario) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Card padding="lg" style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.titleRow}>
              <Ionicons name="warning" size={24} color={colors.error} />
              <Text style={styles.formTitulo}>Eliminar Usuario</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {!!error && <ErrorMessage message={error} />}

          <View style={styles.body}>
            <Text style={styles.textoAdvertencia}>
              ¿Está seguro de que desea eliminar permanentemente al usuario{' '}
              <Text style={styles.resaltado}>{usuario.nombreCompleto || usuario.username}</Text>?
            </Text>
            <Text style={styles.subTexto}>
              Esta acción es física e irreversible. Se eliminarán sus asignaciones, roles y cargas de archivos. Los proyectos creados por este usuario serán reasignados a usted.
            </Text>
          </View>

          <View style={styles.modalActions}>
            <Button label="Cancelar" variant="ghost" onPress={onClose} />
            <Button
              label="Eliminar Permanentemente"
              variant="primary"
              style={{ backgroundColor: colors.error }}
              onPress={handleConfirm}
              loading={loading}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: 480, maxWidth: '95%' as any },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs } as any,
  formTitulo: { fontFamily: typography.fontFamily, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  body: { marginBottom: spacing.lg },
  textoAdvertencia: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textPrimary, lineHeight: 20 },
  resaltado: { fontWeight: typography.weights.bold, color: colors.error },
  subTexto: { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm } as any,
});
