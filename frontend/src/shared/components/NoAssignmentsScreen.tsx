import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export const NoAssignmentsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrapper}>
          <Ionicons name="folder-open-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>Sin proyectos asignados</Text>
        <Text style={styles.subtitle}>
          Tu cuenta está activa, pero aún no tienes ningún proyecto asignado.{'\n'}
          Un administrador deberá asignarte a un proyecto para que puedas comenzar.
        </Text>
        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.hintText}>
            Contacta al administrador de tu organización para solicitar acceso a un proyecto.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xxl,
    alignItems: 'center',
    maxWidth: 500,
    width: '100%' as any,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(108,85,201,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(108,85,201,0.06)',
    borderRadius: 10,
    padding: spacing.md,
    maxWidth: 380,
  } as any,
  hintText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.primary,
    flex: 1,
    lineHeight: 18,
  },
});
