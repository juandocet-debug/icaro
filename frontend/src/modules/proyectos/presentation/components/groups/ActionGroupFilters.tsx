import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../../../services/api';
import { ActionGroup } from '../../hooks/useActionGroups';

// ─── Variante Select (para el dashboard de escritorio) ────────────────────────

interface ActionGroupSelectProps {
  accionId: string;
  selectedGrupoId: string | null;
  onSelectGrupoId: (grupoId: string | null) => void;
  /** Estilos externos para el contenedor y el <select> */
  containerStyle?: any;
  selectStyle?: any;
  labelStyle?: any;
}

export function ActionGroupSelect({
  accionId,
  selectedGrupoId,
  onSelectGrupoId,
  containerStyle,
  selectStyle,
  labelStyle,
}: ActionGroupSelectProps) {
  const [grupos, setGrupos] = useState<ActionGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accionId) {
      setGrupos([]);
      return;
    }
    setLoading(true);
    api.get<{ ok: boolean; datos: ActionGroup[] }>(`/api/acciones/${accionId}/grupos/`, {
      params: { page_size: 100, activo: true },
    })
      .then(res => {
        if (res.data.ok) setGrupos(res.data.datos);
        else setGrupos([]);
      })
      .catch(() => setGrupos([]))
      .finally(() => setLoading(false));
  }, [accionId]);

  // No renderizar si no hay grupos
  if (!accionId || grupos.length === 0) return null;

  const defaultSelectStyle: React.CSSProperties = {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 13,
    color: selectedGrupoId ? '#7c3aed' : '#475569',
    fontWeight: selectedGrupoId ? '600' : '400',
    cursor: 'pointer',
    paddingRight: 24,
    ...(selectStyle || {}),
  };

  return (
    <View style={[styles.selectContainer, containerStyle]}>
      <Text style={[styles.selectLabel, labelStyle]}>Grupo / Cohorte</Text>
      <View style={[styles.selectWrapper, selectedGrupoId ? styles.selectWrapperActive : null]}>
        {Platform.OS === 'web' ? (
          <select
            style={defaultSelectStyle as any}
            value={selectedGrupoId ?? ''}
            onChange={(e: any) => onSelectGrupoId(e.target.value || null)}
            disabled={loading}
          >
            <option value="">Todos los grupos</option>
            {grupos.map(g => (
              <option key={g.id} value={g.id}>
                {g.nombre}{g.codigo ? ` (${g.codigo})` : ''}
              </option>
            ))}
          </select>
        ) : null}
        <Ionicons
          name="people-outline"
          size={14}
          color={selectedGrupoId ? '#7c3aed' : '#94a3b8'}
          style={styles.selectArrow}
        />
      </View>
      {selectedGrupoId && (
        <Pressable onPress={() => onSelectGrupoId(null)} style={styles.clearBadge}>
          <Ionicons name="close-circle" size={13} color="#7c3aed" />
          <Text style={styles.clearBadgeText}>
            {grupos.find(g => g.id === selectedGrupoId)?.nombre ?? 'Limpiar'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}


// ─── Variante Chips (para móvil o vistas inline) ───────────────────────────────

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
      params: { page_size: 100 },
    })
      .then(res => {
        if (res.data.ok) setGrupos(res.data.datos);
      })
      .catch(err => console.error('Error fetching filter groups:', err))
      .finally(() => setLoading(false));
  }, [accionId]);

  if (loading || grupos.length === 0) return null;

  return (
    <View style={styles.chipsContainer}>
      <Text style={styles.chipsLabel}>Filtrar por Grupo:</Text>
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
  // ── Select (desktop) ─────────────────────────────────
  selectContainer: {
    flex: 1,
    minWidth: 160,
  },
  selectLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  selectWrapperActive: {
    borderColor: '#7c3aed',
    backgroundColor: '#faf5ff',
  },
  selectArrow: {
    position: 'absolute',
    right: 8,
    pointerEvents: 'none',
  } as any,
  clearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  clearBadgeText: {
    fontSize: 10,
    color: '#7c3aed',
    fontWeight: '600',
  },

  // ── Chips (mobile) ────────────────────────────────────
  chipsContainer: {
    marginVertical: 12,
    paddingHorizontal: Platform.OS === 'web' ? 0 : 16,
  },
  chipsLabel: {
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
