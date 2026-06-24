import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { Rol } from '../domain/Rol';
import { Permiso } from '../domain/Permiso';

interface RolesTabProps {
  roles: Rol[];
  permisos: Permiso[];
  loading: boolean;
  onRefresh: () => void;
  onEditar?: (rol: Rol) => void;
  onEliminar?: (rolId: string) => void;
}

export const RolesTab: React.FC<RolesTabProps> = ({
  roles,
  permisos,
  loading,
  onRefresh,
  onEditar,
  onEliminar,
}) => {
  if (loading) {
    return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
  }

  const getPermisosInfo = (codigos: string[]) => {
    return codigos
      .map((c) => permisos.find((p) => p.codigo === c)?.nombre)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        {roles.map((rol) => (
          <Card key={rol.id} padding="md" style={[styles.card, !rol.activo && styles.inactiveCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.rolName}>{rol.nombre}</Text>
              {rol.es_sistema ? (
                <View style={[styles.badge, styles.badgeSys]}>
                  <Text style={styles.badgeSysText}>Sistema</Text>
                </View>
              ) : (
                <View style={[styles.badge, styles.badgeCustom]}>
                  <Text style={styles.badgeCustomText}>Personalizado</Text>
                </View>
              )}
            </View>
            <Text style={styles.rolDesc}>{rol.descripcion}</Text>
            <View style={styles.divider} />
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Usuarios asignados:</Text>
              <Text style={styles.metaValue}>{rol.cantidad_usuarios}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Permisos:</Text>
              <Text style={styles.metaValue} numberOfLines={2}>
                {rol.permisos && rol.permisos.length > 0
                  ? getPermisosInfo(rol.permisos)
                  : 'Ninguno'}
              </Text>
            </View>
            {!rol.es_sistema && (
              <View style={styles.actions}>
                {onEditar && (
                  <Button label="Editar" size="sm" variant="ghost" onPress={() => onEditar(rol)} />
                )}
                {onEliminar && (
                  <Button
                    label="Desactivar"
                    size="sm"
                    variant="ghost"
                    style={{ marginLeft: spacing.sm }}
                    onPress={() => onEliminar(rol.id)}
                  />
                )}
              </View>
            )}
          </Card>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  loader: {
    marginTop: spacing.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  } as any,
  card: {
    width: '100%',
    minWidth: 280,
    maxWidth: Platform.select({ web: 400, default: 400 }) as any,
    flexGrow: 1,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rolName: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  rolDesc: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    minHeight: 40,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  metaLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  metaValue: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeSys: {
    backgroundColor: 'rgba(108,85,201,0.1)',
  },
  badgeSysText: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  badgeCustom: {
    backgroundColor: 'rgba(40,167,111,0.1)',
  },
  badgeCustomText: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.success,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
  },
});
