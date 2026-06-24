import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { Proyecto } from '../domain/Proyecto';
import { api } from '../../../services/api';
import { UserAvatar } from '../../../shared/components/UserAvatar';

interface ProyectosTablaProps {
  proyectos: Proyecto[];
  expandedId: string | null;
  onExpandRow: (id: string | null) => void;
}

export const ProyectosTabla: React.FC<ProyectosTablaProps> = ({ proyectos }) => {
  const [proyectoMiembros, setProyectoMiembros] = useState<Record<string, any[]>>({});

  useEffect(() => {
    proyectos.forEach(async (p) => {
      try {
        const res = await api.get<{ ok: boolean; datos: any[] }>(`/api/proyectos/${p.id}/miembros/`);
        if (res.data.ok) {
          setProyectoMiembros(prev => ({
            ...prev,
            [p.id]: res.data.datos || [],
          }));
        }
      } catch (err) {
        console.error('Error fetching members for project:', p.id, err);
      }
    });
  }, [proyectos]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        {proyectos.map((p) => {
          const members = proyectoMiembros[p.id] || [];
          const visibleMembers = members.slice(0, 4);

          return (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => router.push(`/proyectos/${p.id}`)}
            >
              {/* Cover Image Background */}
              <View style={styles.coverWrapper}>
                {p.coverImageUrl ? (
                  <Image source={{ uri: p.coverImageUrl }} style={styles.coverImage} />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Ionicons name="folder-open-outline" size={40} color="rgba(255,255,255,0.2)" />
                  </View>
                )}
                {/* Dot Actions Button */}
                <TouchableOpacity style={styles.dotsButton} activeOpacity={0.7} onPress={(e) => {
                  e.stopPropagation();
                  router.push(`/proyectos/${p.id}`);
                }}>
                  <Ionicons name="ellipsis-vertical" size={16} color="#000000" />
                </TouchableOpacity>
              </View>

              {/* Content Panel */}
              <View style={styles.content}>
                <View style={styles.metaHeader}>
                  <Text style={styles.daysText}>
                    {p.startDate ? `${p.startDate} a ${p.endDate || 'N/A'}` : 'Sin fecha'}
                  </Text>
                  <Text style={styles.statusText}>
                    {p.status === 'activo' ? 'Active' : p.status}
                  </Text>
                </View>

                {/* Contract Reference / Code */}
                <Text style={styles.contractRefLabel}>Referencia Contrato</Text>
                <Text style={styles.contractRefVal}>
                  Ref: {p.contractNumber || '123312123123'}
                </Text>

                {/* Project Title */}
                <Text style={styles.title} numberOfLines={2}>{p.name}</Text>

                {/* Footer: Team Avatars & App Integration Badges */}
                <View style={styles.footer}>
                  {/* Avatar Stack */}
                  <View style={styles.avatarStack}>
                    {visibleMembers.map((m, i) => (
                      <View key={m.id || i} style={[styles.avatarWrapper, { marginLeft: i > 0 ? -10 : 0 }]}>
                        <UserAvatar
                          name={m.nombre_completo || m.username || '?'}
                          photoUrl={m.foto_url || null}
                          size={24}
                          style={styles.avatarBorder}
                        />
                      </View>
                    ))}
                  </View>

                  {/* Integration/Technology Badges */}
                  <View style={styles.badgesContainer}>
                    <View style={styles.badgeWrap}>
                      <Image source={{ uri: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' }} style={styles.badgeIcon} />
                    </View>
                    <View style={styles.badgeWrap}>
                      <Image source={{ uri: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' }} style={styles.badgeIcon} />
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingVertical: spacing.md,
  } as any,
  card: {
    width: '18.2%',
    minWidth: 180,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    position: 'relative',
  } as any,
  coverWrapper: {
    height: 120,
    width: '100%',
    position: 'relative',
    backgroundColor: '#1e293b',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
  },
  dotsButton: {
    position: 'absolute',
    bottom: -18,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    zIndex: 10,
  } as any,
  content: {
    padding: 14,
    paddingTop: 18,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  } as any,
  daysText: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  statusText: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  contractRefLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  contractRefVal: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 18,
    marginBottom: spacing.md,
    minHeight: 36,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  } as any,
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  } as any,
  avatarWrapper: {
    zIndex: 1,
  },
  avatarBorder: {
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as any,
  badgeWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  badgeIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
});
