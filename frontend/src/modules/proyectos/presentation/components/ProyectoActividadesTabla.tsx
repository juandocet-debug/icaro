import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../../shared/components/Card';
import { colors } from '../../../../shared/constants/colors';
import { spacing } from '../../../../shared/constants/spacing';
import { typography } from '../../../../shared/constants/typography';
import { router } from 'expo-router';

interface ProyectoActividadesTablaProps {
  misActividades: any[];
  actsSearch: string;
  setActsSearch: (v: string) => void;
  filteredActs: any[];
  isMobile: boolean;
}

export const ProyectoActividadesTabla: React.FC<ProyectoActividadesTablaProps> = ({
  misActividades,
  actsSearch,
  setActsSearch,
  filteredActs,
  isMobile,
}) => {
  const [page, setPage] = useState(1);
  const limit = 5;
  const total = filteredActs.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const paginated = filteredActs.slice(start, start + limit);

  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Actividades en este Proyecto</Text>
        <TouchableOpacity style={styles.link} onPress={() => router.push('/mis-actividades')}>
          <Text style={styles.linkText}>Ir a Mis Actividades</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={actsSearch}
          onChangeText={setActsSearch}
          placeholder="Buscar mis actividades..."
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {paginated.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="clipboard-outline" size={32} color={colors.textSecondary} style={{ opacity: 0.4 }} />
          <Text style={styles.emptyText}>No se encontraron actividades asignadas.</Text>
        </View>
      ) : isMobile ? (
        <ScrollView style={{ gap: spacing.sm }}>
          {paginated.map((item) => {
            const act = item.accion;
            const progress = act.avance_porcentaje ?? 0;
            const isResp = item.tipoAsignacion === 'responsable';

            return (
              <View key={item.id} style={styles.mobileCard}>
                <Text style={styles.mobileMeta} numberOfLines={1}>
                  META: {act.meta_nombre || 'N/A'}
                </Text>
                <Text style={styles.mobileComp} numberOfLines={1}>
                  COMPONENTE: {act.componente_nombre || 'N/A'}
                </Text>
                <Text style={styles.mobileName}>{act.nombre}</Text>
                <View style={styles.divider} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.mobileProgress}>Avance: {Math.round(progress)}%</Text>
                  <View style={[styles.badge, isResp ? styles.badgeResp : styles.badgeApoyo]}>
                    <Text style={styles.badgeTxt}>{isResp ? 'Responsable' : 'Apoyo'}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.row, styles.tableHeader]}>
            <Text style={[styles.th, { flex: 2 }]}>Actividad / Acción</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>Meta / Componente</Text>
            <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>Avance</Text>
            <Text style={[styles.th, { width: 120, textAlign: 'center' }]}>Rol</Text>
          </View>
          {/* Table Body */}
          {paginated.map((item) => {
            const act = item.accion;
            const progress = act.avance_porcentaje ?? 0;
            const isResp = item.tipoAsignacion === 'responsable';

            return (
              <TouchableOpacity
                key={item.id}
                style={styles.row}
                activeOpacity={0.8}
                onPress={() => router.push(`/mis-actividades/${act.id}`)}
              >
                <View style={{ flex: 2, paddingRight: spacing.sm }}>
                  <Text style={styles.actName}>{act.nombre}</Text>
                </View>
                <View style={{ flex: 1.5, paddingRight: spacing.sm }}>
                  <Text style={styles.metaLabel} numberOfLines={1}>
                    M: {act.meta_nombre || 'N/A'}
                  </Text>
                  <Text style={styles.compLabel} numberOfLines={1}>
                    C: {act.componente_nombre || 'N/A'}
                  </Text>
                </View>
                <Text style={[styles.cellText, { width: 100, textAlign: 'center', fontWeight: '700', color: colors.primary }]}>
                  {Math.round(progress)}%
                </Text>
                <View style={{ width: 120, alignItems: 'center' }}>
                  <View style={[styles.badge, isResp ? styles.badgeResp : styles.badgeApoyo]}>
                    <Text style={styles.badgeTxt}>{isResp ? 'Responsable' : 'Apoyo'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pagBtn, page === 1 && styles.pagBtnDisabled]}
            disabled={page === 1}
            onPress={() => setPage(p => p - 1)}
          >
            <Ionicons name="chevron-back" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.pagText}>Página {page} de {totalPages}</Text>
          <TouchableOpacity
            style={[styles.pagBtn, page === totalPages && styles.pagBtnDisabled]}
            disabled={page === totalPages}
            onPress={() => setPage(p => p + 1)}
          >
            <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textPrimary },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.primary, fontWeight: typography.weights.medium },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: spacing.sm, height: 38, marginBottom: spacing.md, gap: spacing.xs },
  searchInput: { flex: 1, fontFamily: typography.fontFamily, fontSize: 13, color: colors.textPrimary, paddingVertical: 0, outlineStyle: 'none' } as any,
  empty: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  emptyText: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic' },
  mobileCard: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  mobileMeta: { fontFamily: typography.fontFamily, fontSize: 9, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.5 },
  mobileComp: { fontFamily: typography.fontFamily, fontSize: 9, fontWeight: '700', color: colors.primary, letterSpacing: 0.5 },
  mobileName: { fontFamily: typography.fontFamily, fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border },
  mobileProgress: { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeResp: { backgroundColor: `${colors.primary}18` },
  badgeApoyo: { backgroundColor: `${colors.success}18` },
  badgeTxt: { fontFamily: typography.fontFamily, fontSize: 10, fontWeight: typography.weights.bold, color: colors.textSecondary },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden' as any },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  tableHeader: { backgroundColor: colors.background },
  th: { fontFamily: typography.fontFamily, fontSize: 11, fontWeight: typography.weights.bold, color: colors.textSecondary, textTransform: 'uppercase' },
  actName: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary },
  metaLabel: { fontFamily: typography.fontFamily, fontSize: 9, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 2, letterSpacing: 0.5 },
  compLabel: { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.textSecondary },
  cellText: { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.textPrimary },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background, marginTop: spacing.md },
  pagBtn: { padding: 6, borderRadius: 6, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  pagBtnDisabled: { opacity: 0.5, backgroundColor: colors.background },
  pagText: { fontFamily: typography.fontFamily, fontSize: 12, fontWeight: typography.weights.medium, color: colors.textPrimary },
});
