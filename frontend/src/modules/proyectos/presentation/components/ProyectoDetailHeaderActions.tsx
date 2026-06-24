import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
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
  return (
    <View style={styles.actionHeaderBar}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButtonCustom} accessibilityLabel="Volver a proyectos">
        <Ionicons name="arrow-back" size={18} color={colors.primary} />
        <Text style={styles.backButtonCustomText}>Volver</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {isGestor && (
          <TouchableOpacity 
            onPress={() => router.push(`/proyectos/${proyectoId}/dashboard-evidencias` as any)}
            style={styles.consolaButtonCustom}
            accessibilityLabel="Consola de Evidencias"
          >
            <Ionicons name="documents-outline" size={15} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.consolaButtonCustomText}>Consola de Evidencias</Text>
          </TouchableOpacity>
        )}

        {isSuperAdmin && (
          <TouchableOpacity 
            onPress={solicitarEliminacion} 
            disabled={eliminando}
            style={[styles.deleteProjectButtonCustom, eliminando && { opacity: 0.6 }]}
            accessibilityLabel="Eliminar proyecto"
          >
            {eliminando ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.deleteProjectButtonCustomText}>Eliminar proyecto</Text>
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
    alignSelf: 'stretch' as any,
  } as any,
  backButtonCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  } as any,
  backButtonCustomText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  consolaButtonCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  } as any,
  consolaButtonCustomText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: '#ffffff',
    fontWeight: typography.weights.bold,
  },
  deleteProjectButtonCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  } as any,
  deleteProjectButtonCustomText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: '#ffffff',
    fontWeight: typography.weights.bold,
  },
});
