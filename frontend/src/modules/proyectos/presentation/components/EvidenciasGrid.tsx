import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/constants/colors';
import { typography } from '../../../../shared/constants/typography';
import { spacing } from '../../../../shared/constants/spacing';
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

const estadoLabel = (e: string) => {
  switch (e) {
    case 'aprobada': return 'Aprobada';
    case 'enviada': return 'Enviada';
    case 'observada': return 'Observada';
    case 'reabierta': return 'Reabierta';
    case 'borrador':
    default: return 'Borrador';
  }
};

export const EvidenciasGrid = ({
  filteredEvidencias, setActiveEvId, setPreviewSoporte, openEvModal, selectedAct,
  evQ, setEvQ, evFechaDesde, setEvFechaDesde, evFechaHasta, setEvFechaHasta,
}: any) => {
  const evidencias = filteredEvidencias;

  const CARD_COLORS = [
    { bg: '#FF6B6B', iconBg: 'rgba(255,255,255,0.2)' },
    { bg: '#8B5CF6', iconBg: 'rgba(255,255,255,0.2)' },
    { bg: '#FF9F43', iconBg: 'rgba(255,255,255,0.2)' },
    { bg: '#06B6D4', iconBg: 'rgba(255,255,255,0.2)' },
    { bg: '#3B82F6', iconBg: 'rgba(255,255,255,0.2)' },
    { bg: '#10B981', iconBg: 'rgba(255,255,255,0.2)' },
  ];

  return (
    <ScrollView style={styles.colMain} contentContainerStyle={{ padding: 24 }}>
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          <Ionicons name="briefcase-outline" size={24} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 } as any}>
          <Text style={styles.detailTitle}>{selectedAct?.accion?.nombre}</Text>
          <Text style={styles.detailSub}>{selectedAct?.accion?.resultado_asociado?.nombre || 'Sin resultado'}</Text>
        </View>
      </View>

      {!!selectedAct?.accion?.descripcion && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.descBoxTitle}>Descripción</Text>
          <Text style={styles.descBoxText}>{selectedAct.accion.descripcion}</Text>
        </View>
      )}

      <View style={styles.cardDivider} />

      <View style={styles.evHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Evidencias Operativas (Clases / Sesiones)</Text>
          <Text style={styles.sectionSub}>Registra evidencias para cada ejecución de esta acción.</Text>
        </View>
        <TouchableOpacity style={gridStyles.btnPdf} onPress={() => {}}>
          <Ionicons name="document-text-outline" size={15} color={colors.primary} />
          <Text style={gridStyles.btnPdfTxt}>Descargar PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros activos */}
      <View style={gridStyles.filterBar}>
        <View style={gridStyles.searchBox}>
          <Ionicons name="search-outline" size={14} color={colors.textSecondary} />
          <TextInput
            style={gridStyles.searchInput}
            placeholder="Buscar evidencia..."
            placeholderTextColor={colors.textSecondary}
            value={evQ}
            onChangeText={setEvQ}
          />
          {!!evQ && (
            <TouchableOpacity onPress={() => setEvQ('')}>
              <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={gridStyles.dateRange}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          {Platform.OS === 'web' ? (
            <>
              <input type="date" value={evFechaDesde} onChange={(e: any) => setEvFechaDesde(e.target.value)}
                style={gridStyles.dateInput as any} placeholder="Desde" />
              <Text style={gridStyles.dateSep}>—</Text>
              <input type="date" value={evFechaHasta} onChange={(e: any) => setEvFechaHasta(e.target.value)}
                style={gridStyles.dateInput as any} placeholder="Hasta" />
            </>
          ) : (
            <>
              <TextInput style={gridStyles.dateInputNative} value={evFechaDesde}
                onChangeText={setEvFechaDesde} placeholder="Desde" placeholderTextColor={colors.textSecondary} />
              <Text style={gridStyles.dateSep}>—</Text>
              <TextInput style={gridStyles.dateInputNative} value={evFechaHasta}
                onChangeText={setEvFechaHasta} placeholder="Hasta" placeholderTextColor={colors.textSecondary} />
            </>
          )}
          {(!!evFechaDesde || !!evFechaHasta) && (
            <TouchableOpacity onPress={() => { setEvFechaDesde(''); setEvFechaHasta(''); }}>
              <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.evGrid}>
        {evidencias.map((e: any, index: number) => {
          const colorProfile = CARD_COLORS[index % CARD_COLORS.length];
          const numArchivos = e.soportes ? e.soportes.length : 0;
          return (
            <TouchableOpacity
              key={e.id}
              style={[styles.evCardMetric, { backgroundColor: estadoColor(e.estado) }]}
              onPress={() => { setActiveEvId(e.id); setPreviewSoporte(null); }}
            >
              <View style={styles.evCardMetricTopRow}>
                <Text style={styles.evCardMetricTitle} numberOfLines={2}>{e.nombre}</Text>
                <View style={[styles.evCardMetricIconBox, { backgroundColor: colorProfile.iconBg }]}>
                  {e.estado === 'aprobada' ? (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  ) : (
                    <Ionicons name="folder-open" size={20} color="#fff" />
                  )}
                </View>
              </View>

              <View style={styles.evCardMetricMid}>
                <Text style={styles.evCardMetricBigVal}>
                  {numArchivos} <Text style={styles.evCardMetricUnit}>archivos</Text>
                </Text>
              </View>

              <View style={styles.evCardMetricBottom}>
                <Text style={styles.evCardMetricSub}>
                  {e.fecha_ejecucion ? e.fecha_ejecucion : 'Sin fecha'}
                  {'\n'}{estadoLabel(e.estado)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        
        <TouchableOpacity style={styles.evCardMetricAdd} onPress={openEvModal}>
          <Ionicons name="add" size={32} color={colors.textSecondary} />
          <Text style={styles.evCardMetricAddTxt}>Nueva Evidencia</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const gridStyles = {
  filterBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' } as any,
  searchBox:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: colors.surface, minWidth: 200, flex: 1 } as any,
  searchInput:{ flex: 1, fontSize: 12, color: colors.textPrimary, outlineStyle: 'none' } as any,
  dateRange:  { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: colors.surface } as any,
  dateInput:  { fontSize: 12, color: colors.textPrimary, border: 'none', outline: 'none', backgroundColor: 'transparent', fontFamily: typography.fontFamily, paddingLeft: 6 } as any,
  dateInputNative: { fontSize: 12, color: colors.textPrimary, minWidth: 90 } as any,
  dateSep:    { fontSize: 12, color: colors.textSecondary },
  btnPdf:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.primary, backgroundColor: `${colors.primary}08` } as any,
  btnPdfTxt:  { fontSize: 12, color: colors.primary, fontWeight: '600' as any },
};
