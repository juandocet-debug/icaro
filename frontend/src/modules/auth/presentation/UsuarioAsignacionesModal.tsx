import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { UsuarioAsignacion } from '../domain/UsuariosRepositoryPort';
import { listarAsignacionesUsuarioUseCase } from '../../../shared/dependencies';

interface Props {
  visible: boolean;
  onClose: () => void;
  userId: number | null;
  userName: string;
}

export const UsuarioAsignacionesModal: React.FC<Props> = ({ visible, onClose, userId, userName }) => {
  const [asignaciones, setAsignaciones] = useState<UsuarioAsignacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userId !== null) {
      const cargar = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await listarAsignacionesUsuarioUseCase.ejecutar(userId);
          setAsignaciones(data);
        } catch {
          setError('No se pudieron obtener las asignaciones.');
        } finally {
          setLoading(false);
        }
      };
      cargar();
    }
  }, [visible, userId]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card padding="lg" style={styles.card}>
          <Text style={styles.titulo}>Asignaciones de @{userName}</Text>
          
          {!!error && <ErrorMessage message={error} />}

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : (
            <ScrollView style={styles.scroll}>
              {asignaciones.length === 0 ? (
                <Text style={styles.vacio}>Este usuario no tiene asignaciones operativas en ningún proyecto.</Text>
              ) : (
                asignaciones.map((asig, idx) => (
                  <View key={idx} style={styles.item}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.proyectoNombre}>{asig.proyectoNombre || 'Proyecto Desconocido'}</Text>
                      <View style={[styles.badge, asig.activo ? styles.badgeActive : styles.badgeInactive]}>
                        <Text style={styles.badgeText}>{asig.activo ? 'Activo' : 'Inactivo'}</Text>
                      </View>
                    </View>
                    <Text style={styles.rolNombre}>{asig.rolNombre}</Text>
                    {asig.componenteId && (
                      <Text style={styles.scopeDetail}>Componente ID: {asig.componenteId}</Text>
                    )}
                    {asig.accionId && (
                      <Text style={styles.scopeDetail}>Acción ID: {asig.accionId}</Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          )}

          <View style={styles.actions}>
            <Button label="Cerrar" variant="ghost" onPress={onClose} />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 480,
    maxWidth: '90%',
  },
  titulo: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  scroll: {
    maxHeight: 300,
    marginBottom: spacing.md,
  },
  vacio: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  item: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(108,85,201,0.02)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proyectoNombre: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  rolNombre: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.primary,
    marginTop: 4,
  },
  scopeDetail: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  badgeActive: {
    backgroundColor: 'rgba(40,167,111,0.1)',
  },
  badgeInactive: {
    backgroundColor: 'rgba(192,57,43,0.1)',
  },
  badgeText: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
});
