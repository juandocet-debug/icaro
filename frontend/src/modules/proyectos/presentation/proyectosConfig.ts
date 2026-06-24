import { StyleSheet } from 'react-native';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { EstadoProyecto } from '../domain/Proyecto';

export const ESTADOS: Array<EstadoProyecto | 'todos'> = ['todos', 'activo', 'completado', 'inactivo', 'suspendido'];

export const BADGE: Record<EstadoProyecto, { bg: string; text: string }> = {
  activo:     { bg: 'rgba(40, 167, 111, 0.1)', text: colors.success },
  completado: { bg: 'rgba(108, 85, 201, 0.1)', text: colors.primary },
  inactivo:   { bg: 'rgba(102, 112, 133, 0.1)', text: colors.textSecondary },
  suspendido: { bg: 'rgba(192, 57, 43, 0.1)', text: colors.error },
};

export const COL = { num: 48, name: 260, contract: 160, status: 110, date: 110, actions: 80 };

export const screenStyles = StyleSheet.create({
  shell: { backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  titulo: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  subtitulo: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filtrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  filtroBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  filtroBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  filtroTextActive: {
    color: colors.surface,
    fontWeight: typography.weights.medium,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  sectionHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    width: '100%',
  } as any,
  sectionTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
});
