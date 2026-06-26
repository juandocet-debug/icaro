import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { api } from '../../../../../services/api';
import { ActionGroup } from '../../hooks/useActionGroups';

interface ActionGroupFiltersProps {
  accionId: string;
  selectedGrupoId: string | null;
  onSelectGrupoId: (grupoId: string | null) => void;
}

export function ActionGroupFilters({ accionId, selectedGrupoId, onSelectGrupoId }: ActionGroupFiltersProps) {
  const [grupos, setGrupos] = useState<ActionGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accionId) {
      setGrupos([]);
      return;
    }
    setLoading(true);
    api.get<{ ok: boolean; datos: ActionGroup[] }>(`/api/acciones/${accionId}/grupos/`, {
      params: { page_size: 100 } // Get first 100 groups for filters
    })
      .then(res => {
        if (res.data.ok) {
          setGrupos(res.data.datos);
        }
      })
      .catch(err => console.error('Error fetching filter groups:', err))
      .finally(() => setLoading(false));
  }, [accionId]);

  if (loading || grupos.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Filtrar por Grupo:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Pressable
          style={[styles.badge, selectedGrupoId === null ? styles.badgeSelected : null]}
          onPress={() => onSelectGrupoId(null)}
        >
          <Text style={[styles.badgeText, selectedGrupoId === null ? styles.badgeTextSelected : null]}>
            Todos los Grupos
          </Text>
        </Pressable>

        {grupos.map(g => (
          <Pressable
            key={g.id}
            style={[styles.badge, selectedGrupoId === g.id ? styles.badgeSelected : null]}
            onPress={() => onSelectGrupoId(g.id)}
          >
            <Text style={[styles.badgeText, selectedGrupoId === g.id ? styles.badgeTextSelected : null]}>
              {g.nombre}
            </Text>
            {g.codigo && (
              <View style={[styles.codeBadge, selectedGrupoId === g.id ? styles.codeBadgeSelected : null]}>
                <Text style={[styles.codeText, selectedGrupoId === g.id ? styles.codeTextSelected : null]}>
                  {g.codigo}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 8,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4b5563',
  },
  badgeTextSelected: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  codeBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  codeBadgeSelected: {
    backgroundColor: '#dbeafe',
  },
  codeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6b7280',
  },
  codeTextSelected: {
    color: '#1e40af',
  },
});
