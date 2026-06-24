import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/constants/colors';
import { spacing } from '../../../../shared/constants/spacing';
import { typography } from '../../../../shared/constants/typography';
import { Button } from '../../../../shared/components/Button';
import { Proyecto } from '../../domain/Proyecto';
import { BADGE } from '../proyectosConfig';

interface ProyectosMobileCardsProps {
  proyectos: Proyecto[];
  expandedId: string | null;
  onExpandRow: (id: string | null) => void;
}

export const ProyectosMobileCards: React.FC<ProyectosMobileCardsProps> = ({
  proyectos,
  expandedId,
  onExpandRow,
}) => {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {proyectos.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="folder-open-outline" size={48} color="#94a3b8" style={{ opacity: 0.5 }} />
          <Text style={styles.emptyText}>No hay proyectos para el filtro seleccionado.</Text>
        </View>
      ) : (
        proyectos.map((item) => {
          const isOpen = expandedId === item.id;
          const badge = BADGE[item.status] ?? BADGE.inactivo;

          return (
            <View key={item.id} style={styles.card}>
              {/* Cabecera de la tarjeta */}
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => onExpandRow(isOpen ? null : item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.headerTop}>
                  <Text style={styles.contractText} numberOfLines={1}>
                    Contrato: {item.contractNumber ?? '—'}
                  </Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.nameText}>{item.name}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color="#64748b" />
                    <Text style={styles.metaText}>Inicio: {item.startDate ?? '—'}</Text>
                  </View>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#64748b"
                  />
                </View>
              </TouchableOpacity>

              {/* Contenido expandido (Acordeón) */}
              {isOpen && (
                <View style={styles.cardBody}>
                  <Text style={styles.descLabel}>Descripción</Text>
                  <Text style={styles.descText}>
                    {item.description ?? 'Sin descripción registrada.'}
                  </Text>

                  {!!item.endDate && (
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={12} color="#64748b" />
                      <Text style={styles.metaText}>Fecha Fin: {item.endDate}</Text>
                    </View>
                  )}

                  <Button
                    label="Ver detalle completo"
                    variant="primary"
                    size="sm"
                    onPress={() => router.push(`/proyectos/${item.id}`)}
                    style={styles.detailBtn}
                  />
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: spacing.md,
    overflow: 'hidden' as any,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    padding: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  } as any,
  contractText: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: '700',
  },
  nameText: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 20,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as any,
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as any,
  metaText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: '#64748b',
  },
  cardBody: {
    backgroundColor: '#f8fafc',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 10,
  },
  descLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descText: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  detailBtn: {
    marginTop: 4,
    backgroundColor: '#7c3aed',
    borderRadius: 10,
  },
});
