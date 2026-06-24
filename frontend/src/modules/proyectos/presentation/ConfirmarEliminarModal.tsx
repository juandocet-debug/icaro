import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';

interface Props {
  title: string;
  message: string;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  danger?: boolean;
}

export const ConfirmarEliminarModal: React.FC<Props> = ({ title, message, visible, onClose, onConfirm, danger = true }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const handleClose = () => { if (!loading) onClose(); };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
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
            <Text style={styles.titulo}>{title}</Text>
            <TouchableOpacity onPress={handleClose} disabled={loading}><Text style={styles.cerrar}>✕</Text></TouchableOpacity>
          </View>
          <Text style={styles.message}>{message}</Text>
          {!!error && <ErrorMessage message={error} />}
          <View style={styles.actions}>
            <Button label="Cancelar" variant="ghost" onPress={handleClose} style={styles.btnCancel} disabled={loading} />
            <Button label="Confirmar" onPress={handleConfirm} loading={loading} disabled={loading} style={danger ? styles.btnDanger : {}} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.xl, width: '100%', maxWidth: 400 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  titulo: { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  cerrar: { fontFamily: typography.fontFamily, fontSize: 18, color: colors.textSecondary, paddingHorizontal: spacing.xs },
  message: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 22 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm } as any,
  btnCancel: { marginRight: spacing.xs },
  btnDanger: { backgroundColor: colors.error },
});
