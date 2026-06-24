import { StyleSheet, Platform } from 'react-native';
import { colors } from '../../../../shared/constants/colors';
import { spacing } from '../../../../shared/constants/spacing';
import { typography } from '../../../../shared/constants/typography';

export const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' } as any,
  colLeft: { width: 280, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.surface },
  colMain: { flex: 1, backgroundColor: colors.background, borderRightWidth: 1, borderRightColor: colors.border },
  colRight: { width: 320, backgroundColor: colors.surface },

  // Lista Actividades
  listHeader: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  listTitle: { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  listSub: { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  filterRow: { marginBottom: spacing.sm },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: spacing.sm, borderRadius: 20, borderWidth: 1, borderColor: colors.border, marginRight: spacing.xs } as any,
  filterBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
  filterTxt: { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary },
  filterTxtActive: { color: colors.primary, fontWeight: typography.weights.bold },
  filterCnt: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterCntActive: { backgroundColor: colors.primary },
  filterCntTxt: { fontFamily: typography.fontFamily, fontSize: 9, fontWeight: typography.weights.bold, color: colors.textSecondary },
  filterCntTxtActive: { color: '#fff' },

  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.sm, borderRadius: 10, marginBottom: spacing.xs, borderWidth: 1 } as any,
  listItemSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  listItemUnsel: { backgroundColor: colors.surface, borderColor: colors.border },
  listIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  listName: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  listNameSel: { color: '#fff' },
  listNameUnsel: { color: colors.textPrimary },
  listMeta: { fontFamily: typography.fontFamily, fontSize: 10, color: colors.textSecondary },
  listBar: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' as any, marginTop: 4 },
  listBarFill: { height: 4, borderRadius: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { fontFamily: typography.fontFamily, fontSize: 10, fontWeight: typography.weights.bold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyTxt: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },

  // Panel Central
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md } as any,
  cardIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  detailTitle: { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  detailSub: { fontFamily: typography.fontFamily, fontSize: 12, color: colors.textSecondary },
  descBoxTitle: { fontFamily: typography.fontFamily, fontSize: 11, fontWeight: typography.weights.bold, color: colors.textSecondary, textTransform: 'uppercase' as any, letterSpacing: 0.5, marginBottom: 4 },
  descBoxText: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textPrimary, lineHeight: 20 },
  cardDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },

  // Tarjetas Dashboard Métricas
  evGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.md } as any,
  evCardMetric: { width: 220, height: 140, borderRadius: 20, padding: spacing.md, justifyContent: 'space-between', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } as any },
  evCardMetricTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  evCardMetricTitle: { fontFamily: typography.fontFamily, fontSize: 13, color: 'rgba(255,255,255,0.9)', flex: 1, marginRight: 8, marginTop: 4 },
  evCardMetricIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  evCardMetricMid: { flex: 1, justifyContent: 'center' },
  evCardMetricBigVal: { fontFamily: typography.fontFamily, fontSize: 32, fontWeight: typography.weights.bold, color: '#fff' },
  evCardMetricUnit: { fontSize: 14, fontWeight: typography.weights.medium },
  evCardMetricBottom: { alignItems: 'flex-end' },
  evCardMetricSub: { fontFamily: typography.fontFamily, fontSize: 11, color: 'rgba(255,255,255,0.8)', textAlign: 'right', lineHeight: 16 },
  evCardMetricAdd: { width: 220, height: 140, borderRadius: 20, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' as any, alignItems: 'center', justifyContent: 'center', gap: 8 },
  evCardMetricAddTxt: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textSecondary },

  // Metadatos Evidencia Activa
  activeEvMetaBox: { backgroundColor: colors.surface, borderRadius: 8, padding: spacing.sm, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  activeEvMetaText: { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  activeEvObsBox: { backgroundColor: '#ef44440a', borderLeftWidth: 3, borderLeftColor: '#ef4444', padding: spacing.xs, borderRadius: 4, marginTop: spacing.xs },
  activeEvObsTitle: { fontFamily: typography.fontFamily, fontSize: 10, fontWeight: typography.weights.bold, color: '#ef4444' },
  activeEvObsText: { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textPrimary },

  // Evidencias Requeridas
  reqHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm } as any,
  reqCountBadge: { fontFamily: typography.fontFamily, fontSize: 12, fontWeight: typography.weights.bold, color: colors.primary },
  reqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.md } as any,
  reqCardFilled: { width: 140, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, position: 'relative' },
  reqCardEmpty: { width: 140, backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1.5, borderColor: `${colors.primary}50`, borderStyle: 'dashed' as any, padding: spacing.sm, justifyContent: 'space-between', minHeight: 180 } as any,
  reqCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs } as any,
  reqCardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 } as any,
  reqCardTitle: { fontFamily: typography.fontFamily, fontSize: 11, fontWeight: typography.weights.bold, color: colors.textPrimary, flex: 1 },
  reqCardThumbnail: { height: 74, borderRadius: 6, overflow: 'hidden' as any, backgroundColor: colors.background, marginBottom: spacing.xs },
  reqCardImg: { width: '100%', height: '100%' } as any,
  reqCardDocIcon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  reqCardFileName: { fontFamily: typography.fontFamily, fontSize: 10, fontWeight: typography.weights.medium, color: colors.textPrimary, marginBottom: 2 },
  reqCardMeta: { fontFamily: typography.fontFamily, fontSize: 9, color: colors.textSecondary, marginBottom: spacing.xs },
  btnVerReq: { width: '100%', paddingVertical: 6, borderRadius: 6, backgroundColor: `${colors.primary}10`, alignItems: 'center' },
  btnVerReqTxt: { fontFamily: typography.fontFamily, fontSize: 11, fontWeight: typography.weights.bold, color: colors.primary },
  
  reqCardEmptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 } as any,
  reqCardEmptyTxt: { fontFamily: typography.fontFamily, fontSize: 10, color: colors.textSecondary, opacity: 0.7 },
  btnCargarReq: { width: '100%', paddingVertical: 6, borderRadius: 6, backgroundColor: colors.primary, alignItems: 'center' },
  btnCargarReqDisabled: { backgroundColor: colors.border },
  btnCargarReqTxt: { fontFamily: typography.fontFamily, fontSize: 10, fontWeight: typography.weights.bold, color: '#fff' },

  // Vista Previa
  previewBox: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: spacing.md },
  previewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm } as any,
  previewImage: { width: '100%', height: 240, borderRadius: 8 },
  previewIconBox: { height: 160, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderRadius: 8 },
  previewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm } as any,
  previewFileName: { fontFamily: typography.fontFamily, fontSize: 12, fontWeight: typography.weights.bold, color: colors.textPrimary },
  previewMetaText: { fontFamily: typography.fontFamily, fontSize: 10, color: colors.textSecondary },
  btnActionIcon: { width: 32, height: 32, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnOpenNewTab: { paddingVertical: 8, paddingHorizontal: spacing.md, borderRadius: 6, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnOpenNewTabTxt: { fontFamily: typography.fontFamily, fontSize: 11, fontWeight: typography.weights.bold, color: '#fff' },

  // Panel Derecho Carga
  panelDerechoScroll: { flex: 1 },
  uploadPanelTitle: { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: spacing.md },
  formLabel: { fontFamily: typography.fontFamily, fontSize: 10, fontWeight: typography.weights.bold, color: colors.textSecondary, textTransform: 'uppercase' as any, marginBottom: spacing.xs, letterSpacing: 0.5 },
  pickerWrapper: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, marginBottom: spacing.md, overflow: 'hidden' as any },
  htmlSelect: { width: '100%', padding: 10, fontSize: 14, fontFamily: typography.fontFamily, color: colors.textPrimary, backgroundColor: colors.surface, border: 'none', outline: 'none' } as any,
  htmlDateInput: { width: '100%', height: 56, padding: '0 16px', borderRadius: 10, border: `1px solid ${colors.border}`, fontFamily: typography.fontFamily, fontSize: 16, color: colors.textPrimary, marginBottom: 16, backgroundColor: colors.surface, boxSizing: 'border-box', outline: 'none' } as any,
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, backgroundColor: `${colors.primary}08`, borderRadius: 8, borderWidth: 1, borderColor: `${colors.primary}30`, marginBottom: spacing.sm } as any,
  pendingName: { flex: 1, fontFamily: typography.fontFamily, fontSize: 12, color: colors.primary },
  infoBox: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, padding: spacing.sm, backgroundColor: `${colors.primary}08`, borderRadius: 8 } as any,
  infoTxt: { fontFamily: typography.fontFamily, fontSize: 10, color: colors.primary, flex: 1, lineHeight: 14 },

  // Aprobación / Calificación
  reviewStatusBox: { backgroundColor: colors.background, borderRadius: 8, padding: spacing.sm, marginBottom: spacing.md },
  reviewStatusLabel: { fontFamily: typography.fontFamily, fontSize: 9, fontWeight: typography.weights.bold, color: colors.textSecondary },
  reviewStatusVal: { fontFamily: typography.fontFamily, fontSize: 12, fontWeight: typography.weights.bold },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  // Modal Crear Evidencia
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.surface, borderRadius: 12, width: '100%', maxWidth: 460, padding: spacing.md, gap: spacing.sm } as any,
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm } as any,
  modalTitle: { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },

  // Modal Grande (Detalle Evidencia)
  modalOverlayDark: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  modalLarge: { backgroundColor: colors.background, borderRadius: 16, width: '100%', maxWidth: 1100, height: '90%', overflow: 'hidden' as any, display: 'flex', flexDirection: 'column' } as any,
  modalLargeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border } as any,
  modalLargeBody: { flex: 1, flexDirection: 'row' } as any,
  modalLargeLeft: { flex: 1, borderRightWidth: 1, borderRightColor: colors.border, backgroundColor: colors.background },
  modalLargeRight: { width: 340, backgroundColor: colors.surface },

  // Búsqueda
  evSearch: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 5, backgroundColor: colors.background } as any,
  evSearchInput: { fontFamily: typography.fontFamily, fontSize: 12, color: colors.textPrimary, flex: 1, outlineStyle: 'none' } as any,

  // Secciones
  evHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md } as any,
  sectionTitle: { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  sectionSub: { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
} as any);
