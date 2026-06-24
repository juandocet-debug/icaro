import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '../../../../shared/components/Card';
import { colors } from '../../../../shared/constants/colors';
import { spacing } from '../../../../shared/constants/spacing';
import { typography } from '../../../../shared/constants/typography';

interface CollaboratorActivitiesProps {
  misActividades: any[];
  loadingActs: boolean;
  groupedActs: any[];
  isMobileView: boolean;
}

export const CollaboratorActivities: React.FC<CollaboratorActivitiesProps> = ({
  misActividades,
  loadingActs,
  groupedActs,
  isMobileView,
}) => {
  if (loadingActs) {
    return <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />;
  }

  if (groupedActs.length === 0) {
    return (
      <Card padding="md" style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm }}>
          <Ionicons name="clipboard-outline" size={32} color={colors.textSecondary} style={{ opacity: 0.4 }} />
          <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' }}>
            No se encontraron actividades asignadas.
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      justifyContent: isMobileView ? 'center' : 'flex-start'
    }}>
      {groupedActs.map((group) => {
        const totalActions = group.items.length;
        const totalProgress = group.items.reduce((acc: number, item: any) => acc + (item.accion.avance_porcentaje ?? 0), 0) / (totalActions || 1);
        const firstAction = group.items[0]?.accion;

        return (
          <TouchableOpacity
            key={group.componenteNombre}
            style={{
              width: isMobileView ? '100%' : 240,
              backgroundColor: '#ffffff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.md,
              justifyContent: 'space-between',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 2,
              minHeight: 140,
            }}
            onPress={() => {
              if (firstAction) {
                router.push(`/mis-actividades/${firstAction.id}` as any);
              } else {
                router.push('/mis-actividades' as any);
              }
            }}
          >
            <View style={{ gap: 4 }}>
              <Text style={{ fontFamily: typography.fontFamily, fontSize: 8, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' }} numberOfLines={1}>
                META: {group.metaNombre || 'N/A'}
              </Text>
              <Text style={{ fontFamily: typography.fontFamily, fontSize: 13, fontWeight: '700', color: colors.textPrimary }} numberOfLines={3}>
                {group.componenteNombre}
              </Text>
            </View>

            <View style={{ marginTop: spacing.sm, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: typography.fontFamily, fontSize: 10, color: colors.textSecondary }}>
                  {totalActions} {totalActions === 1 ? 'actividad' : 'actividades'}
                </Text>
                <Text style={{ fontFamily: typography.fontFamily, fontSize: 10, fontWeight: '700', color: colors.primary }}>
                  {Math.round(totalProgress)}%
                </Text>
              </View>
              {/* Progress Bar */}
              <View style={{ height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${totalProgress}%`, backgroundColor: colors.primary }} />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
