import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { Permiso } from '../domain/Permiso';

interface PermisosTabProps {
  permisos: Permiso[];
}

export const PermisosTab: React.FC<PermisosTabProps> = ({ permisos }) => {
  const agrupados = permisos.reduce((acc, curr) => {
    if (!acc[curr.modulo]) {
      acc[curr.modulo] = [];
    }
    acc[curr.modulo].push(curr);
    return acc;
  }, {} as Record<string, Permiso[]>);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {Object.entries(agrupados).map(([modulo, lista]) => (
        <View key={modulo} style={styles.moduloSection}>
          <Text style={styles.moduloTitle}>{modulo}</Text>
          <View style={styles.grid}>
            {lista.map((permiso) => (
              <Card key={permiso.codigo} padding="sm" style={styles.card}>
                <Text style={styles.permName}>{permiso.nombre}</Text>
                <Text style={styles.permCode}>{permiso.codigo}</Text>
                {!!permiso.descripcion && (
                  <Text style={styles.permDesc}>{permiso.descripcion}</Text>
                )}
              </Card>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  moduloSection: {
    marginBottom: spacing.lg,
  },
  moduloTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  } as any,
  card: {
    width: '100%',
    minWidth: 240,
    maxWidth: Platform.select({ web: 320, default: 320 }) as any,
    flexGrow: 1,
  },
  permName: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  permCode: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
    textTransform: 'uppercase',
    marginTop: 2,
    marginBottom: 6,
  },
  permDesc: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
});
