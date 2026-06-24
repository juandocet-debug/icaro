import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
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
          const initials = item.name
            .split(' ')
            .slice(0, 2)
            .map((w: string) => w[0])
            .join('')
            .toUpperCase();

          return (
            <View key={item.id} style={styles.card}>
              {/* Hero Image / Placeholder */}
              <TouchableOpacity
                onPress={() => onExpandRow(isOpen ? null : item.id)}
                activeOpacity={0.85}
                style={styles.heroContainer}
              >
                {item.coverImageUrl ? (
                  <>
                    <Image
                      source={{ uri: item.coverImageUrl }}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                    <View style={styles.heroOverlay} />
                  </>
                ) : (
                  <View style={styles.heroPlaceholder}>
                    <Text style={styles.heroInitials}>{initials}</Text>
                  </View>
                )}

                {/* Badge superpuesto */}
                <View style={[styles.heroBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.heroBadgeText, { color: badge.text }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>

                {/* Título sobre el hero */}
                <View style={styles.heroTextBox}>
                  <Text style={styles.heroContractText} numberOfLines={1}>
                    Contrato: {item.contractNumber ?? '—'}
                  </Text>
                  <Text style={styles.heroTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Footer de la tarjeta */}
              <TouchableOpacity
                style={styles.cardFooter}
                onPress={() => onExpandRow(isOpen ? null : item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={12} color="#64748b" />
                  <Text style={styles.metaText}>Inicio: {item.startDate ?? '—'}</Text>
                </View>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color="#64748b"
                />
              </TouchableOpacity>

              {/* Acordeón expandido */}
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

const HERO_HEIGHT = 140;

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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: spacing.md,
    overflow: 'hidden' as any,
    shadowColor: '#6d28d9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    justifyContent: 'flex-end',
  } as any,
  heroImage: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
  },
  heroPlaceholder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#6d28d9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInitials: {
    fontFamily: typography.fontFamily,
    fontSize: 42,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 4,
  } as any,
  heroBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  } as any,
  heroBadgeText: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: '700',
  } as any,
  heroTextBox: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    gap: 2,
  } as any,
  heroContractText: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    letterSpacing: 0.3,
  } as any,
  heroTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 22,
  } as any,
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
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
  } as any,
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
