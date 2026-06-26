import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/constants/colors';
import { typography } from '../../../../shared/constants/typography';
import { styles } from './MisActividadesStyles';

const estadoColor = (e: string) => {
  switch (e) {
    case 'aprobada': return colors.success;
    case 'enviada': return '#f59e0b';
    case 'observada':
    case 'reabierta':
    case 'borrador':
    default: return '#ef4444';
  }
};

export const ActividadesSidebar = ({
  q, setQ, estado, setEstado, FILTROS, filteredActs, selectedAct, cargarDetalle,
  selectedMeta, setSelectedMeta, metasDisponibles,
}: any) => {
  const renderItem = (item: any) => {
    const act = item.accion;
    const v = item.verificacion;
    const sel = selectedAct?.accion?.id === act.id;
    const pct = v.total_requisitos > 0 ? Math.round((v.requisitos_cumplidos / v.total_requisitos) * 100) : 0;
    const colorAc = estadoColor(v.estado === 'completo' ? 'aprobada' : 'borrador');
    
    return (
      <TouchableOpacity
        key={act.id}
        style={[styles.listItem, sel ? styles.listItemSel : styles.listItemUnsel]}
        onPress={() => cargarDetalle(act.id)}
      >
        <View style={[styles.listIcon, { backgroundColor: sel ? 'rgba(255,255,255,0.2)' : `${colorAc}20` }]}>
          <Ionicons name="clipboard-outline" size={16} color={sel ? '#fff' : colorAc} />
        </View>
        <View style={{ flex: 1 }}>
          {/* Meta / Componente label */}
          {act.meta_nombre && (
            <Text style={[styles.listMeta, sel && { color: 'rgba(255,255,255,0.6)' }, { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 }]} numberOfLines={1}>
              {act.meta_nombre}{act.componente_nombre ? ` · ${act.componente_nombre}` : ''}
            </Text>
          )}
          <Text style={[styles.listName, sel ? styles.listNameSel : styles.listNameUnsel]} numberOfLines={1}>
            {act.nombre}
          </Text>
          <Text style={[styles.listMeta, sel && { color: 'rgba(255,255,255,0.7)' }]}>
            {item.mi_asignacion?.tipo === 'responsable' ? 'Responsable' : 'Apoyo'}
          </Text>
          <Text style={[styles.listMeta, sel && { color: 'rgba(255,255,255,0.7)' }]}>
            Evidencias: {v.requisitos_cumplidos}/{v.total_requisitos}
          </Text>
          <View style={[styles.listBar, sel && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
            <View style={[styles.listBarFill, { width: `${pct}%` as any, backgroundColor: sel ? '#fff' : colorAc }]} />
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: sel ? 'rgba(255,255,255,0.25)' : `${colorAc}20` }]}>
          <Text style={[styles.badgeTxt, { color: sel ? '#fff' : colorAc }]}>
            {v.estado === 'completo' ? 'Completo' : v.estado === 'incompleto' ? 'Progreso' : 'Pendiente'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.colLeft}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Mis Actividades</Text>
        <Text style={styles.listSub}>Acciones operativas asignadas</Text>
      </View>

      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border } as any}>
        <View style={styles.evSearch}>
          <Ionicons name="search" size={16} color={colors.textSecondary} />
          <TextInput
            placeholder="Buscar actividad..."
            value={q}
            onChangeText={setQ}
            style={styles.evSearchInput}
            placeholderTextColor={colors.textSecondary}
          />
          {!!q && (
            <TouchableOpacity onPress={() => setQ('')}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtro por Meta — desplegable compacto (solo si hay >1 meta) */}
        {metasDisponibles && metasDisponibles.length > 1 && (
          <View style={{ marginTop: 10 }}>
            <select
              value={selectedMeta ?? 'todas'}
              onChange={(e: any) => setSelectedMeta(e.target.value)}
              style={{
                width: '100%', height: 32, borderRadius: 8,
                border: `1px solid ${(selectedMeta && selectedMeta !== 'todas') ? colors.primary : colors.border}`,
                backgroundColor: (selectedMeta && selectedMeta !== 'todas') ? `${colors.primary}12` : colors.surface,
                color: (selectedMeta && selectedMeta !== 'todas') ? colors.primary : colors.textSecondary,
                fontFamily: typography.fontFamily,
                fontSize: 12, fontWeight: '500',
                paddingLeft: 8, paddingRight: 4,
                outline: 'none', cursor: 'pointer',
              } as any}
            >
              <option value="todas">Todas las metas</option>
              {metasDisponibles.map((m: string) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {FILTROS.map((f: any) => {
            const active = estado === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterBtn, active && styles.filterBtnActive]}
                onPress={() => setEstado(f.id)}
              >
                <Text style={[styles.filterTxt, active && styles.filterTxtActive]}>{f.label}</Text>
                <View style={[styles.filterCnt, active && styles.filterCntActive]}>
                  <Text style={[styles.filterCntTxt, active && styles.filterCntTxtActive]}>{f.cnt}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {filteredActs.length === 0 ? (
          <Text style={styles.emptyTxt}>Sin actividades.</Text>
        ) : (
          filteredActs.map((item: any) => renderItem(item))
        )}
      </ScrollView>
    </View>
  );
};
