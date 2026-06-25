import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/constants/colors';
import { spacing } from '../../../../shared/constants/spacing';
import { typography } from '../../../../shared/constants/typography';
import { router } from 'expo-router';

interface ProyectoDetailHeaderActionsProps {
  proyectoId: string;
  isGestor: boolean;
  isSuperAdmin: boolean;
  eliminando: boolean;
  solicitarEliminacion: () => void;
}

export const ProyectoDetailHeaderActions: React.FC<ProyectoDetailHeaderActionsProps> = ({
  proyectoId,
  isGestor,
  isSuperAdmin,
  eliminando,
  solicitarEliminacion,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={styles.actionHeaderBar}>
      {/* Volver */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityLabel="Volver a proyectos"
      >
        <Ionicons name="arrow-back" size={16} color={colors.primary} />
        {!isMobile && <Text style={styles.backText}>Volver</Text>}
      </TouchableOpacity>

      {/* Acciones derecha */}
      <View style={styles.rightActions}>
        {isGestor && (
          <TouchableOpacity
            onPress={() => router.push(`/proyectos/${proyectoId}/dashboard-evidencias` as any)}
            style={styles.consolaBtn}
            accessibilityLabel="Consola de Evidencias"
          >
            <Ionicons name="documents-outline" size={15} color="#ffffff" />
            {!isMobile && (
              <Text style={styles.consolaBtnText}>Consola de Evidencias</Text>
            )}
          </TouchableOpacity>
        )}

        {isSuperAdmin && (
          <TouchableOpacity
            onPress={solicitarEliminacion}
            disabled={eliminando}
            style={[styles.deleteBtn, eliminando && { opacity: 0.6 }]}
            accessibilityLabel="Eliminar proyecto"
          >
            {eliminando ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={15} color="#ffffff" />
                {!isMobile && (
                  <Text style={styles.deleteBtnText}>Eliminar proyecto</Text>
                )}
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    width: '100%',
  } as any,
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  } as any,
  backText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  } as any,
  consolaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  } as any,
  consolaBtnText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: '#ffffff',
    fontWeight: typography.weights.bold,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.error,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  } as any,
  deleteBtnText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: '#ffffff',
    fontWeight: typography.weights.bold,
  },
});
