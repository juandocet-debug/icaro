/**
 * CrearAccionScreen
 * Formulario para crear una acción dentro de un componente.
 * La lógica está en hooks/useAccionForm.ts
 * Los estilos y constantes están inline en este archivo.
 */
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, TextInput, ActivityIndicator, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppShell } from '../../../shared/components/AppShell';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { TextField } from '../../../shared/components/TextField';
import { SearchableSelect } from '../../../shared/components/SearchableSelect';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import {
  useAccionForm, UNIDADES_SUGERIDAS, TIPOS_MIME, PLANTILLAS,
} from './hooks/useAccionForm';

// ── DateField (web usa <input type="date">, nativo usa TextInput) ─────────────
const DateField: React.FC<{
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}> = ({ label, value, onChange, placeholder }) => (
  <View style={df.wrapper}>
    <Text style={df.label}>{label}</Text>
    {Platform.OS === 'web' ? (
      <input
        type="date"
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.sizes.sm,
          color: value ? colors.textPrimary : colors.textSecondary,
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: '6px 12px',
          width: '100%',
          outline: 'none',
          cursor: 'pointer',
          height: 36,
          boxSizing: 'border-box',
        }}
      />
    ) : (
      <TextInput
        style={df.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
      />
    )}
  </View>
);

const df = StyleSheet.create({
  wrapper: { flex: 1, minWidth: 140 },
  label:   { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: 4, fontWeight: '500' },
  input:   { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, fontSize: typography.sizes.sm, color: colors.textPrimary, backgroundColor: colors.surface, fontFamily: typography.fontFamily },
});

// ── Screen ────────────────────────────────────────────────────────────────────
interface Props { componenteId: string; proyectoId: string; }

export const CrearAccionScreen: React.FC<Props> = ({ componenteId, proyectoId }) => {
  // Bug 1 fix: useIsMobile usa useWindowDimensions, fiable en Expo Web
  const isMobile = useIsMobile();

  const {
    nombre, setNombre, descripcion, setDescripcion,
    unidad, setUnidad, proyeccion, setProyeccion,
    startDate, setStartDate, endDate, setEndDate,
    requisitos, tiposEvidencia, tipoEvInput, setTipoEvInput,
    saving, error,
    miembros, loadingMiembros, selectedUserId, setSelectedUserId,
    tipoAsig, setTipoAsig, seleccionados, opcionesMiembros,
    handleAgregarResponsable, handleQuitarResponsable,
    addPlantilla, addCustom, updateReq, removeReq, toggleMime,
    addTipoEvidencia, removeTipoEvidencia,
    handleGuardar,
  } = useAccionForm(componenteId, proyectoId);

  return (
    <AppShell scrollable={false} style={s.shell}>
      {/* Header — Bug 1 fix: mobile en 2 filas, desktop en 1 fila */}
      <View style={[s.topBar, isMobile && s.topBarMobile]}>
        {isMobile ? (
          <>
            {/* Fila 1 móvil: Volver | Cancelar Guardar */}
            <View style={s.topBarRow1}>
              <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
                <Text style={s.backTxt}>Volver</Text>
              </TouchableOpacity>
              <View style={s.headerRight}>
                <Button label="Cancelar" variant="ghost" onPress={() => router.back()} style={{ marginRight: spacing.sm }} />
                <Button label="Guardar" onPress={handleGuardar} loading={saving} disabled={saving} />
              </View>
            </View>
            {/* Fila 2 móvil: Título + subtítulo */}
            <View style={s.topBarRow2}>
              <Text style={s.pageTitle}>Crear Acción</Text>
              <Text style={s.pageSubtitle}>Completa la información para configurar esta acción</Text>
            </View>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
              <Text style={s.backTxt}>Volver</Text>
            </TouchableOpacity>
            <View style={s.titleContainer}>
              <Text style={s.pageTitle}>Crear Acción</Text>
              <Text style={s.pageSubtitle}>Completa la información para configurar esta acción</Text>
            </View>
            <View style={s.headerRight}>
              <Button label="Cancelar" variant="ghost" onPress={() => router.back()} style={{ marginRight: spacing.sm }} />
              <Button label="Guardar" onPress={handleGuardar} loading={saving} disabled={saving} />
            </View>
          </>
        )}
      </View>

      {!!error && <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md }}><ErrorMessage message={error} /></View>}

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, isMobile && s.scrollContentMobile]}
      >
        <View style={[s.formColumns, isMobile && s.formColumnsMobile]}>

          {/* ── Columna Izquierda: Medición + Tipos de Evidencia ── */}
          <View style={s.column}>
            {/* Medición */}
            <View style={s.card}>
              <SectionHeader icon="stats-chart" title="MEDICIÓN" subtitle="Define los datos principales de la medición" />
              <TextField label="Nombre *" value={nombre} onChangeText={setNombre} placeholder="Nombre de la acción" autoCapitalize="sentences" />
              <TextField label="Descripción" value={descripcion} onChangeText={setDescripcion} placeholder="Descripción opcional" autoCapitalize="sentences" />
              <TextField label="Unidad de medida *" value={unidad} onChangeText={setUnidad} placeholder="ej: talleres, personas, documentos" autoCapitalize="sentences" />
              <View style={s.sugerencias}>
                {UNIDADES_SUGERIDAS.map(u => (
                  <TouchableOpacity key={u} style={[s.chip, unidad === u && s.chipActive]} onPress={() => setUnidad(u)}>
                    <Text style={[s.chipTxt, unidad === u && s.chipTxtActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextField label="Proyección *" value={proyeccion} onChangeText={setProyeccion} placeholder="ej: 300" keyboardType="numeric" />
              <View style={{ flexDirection: 'row', gap: spacing.md, marginVertical: spacing.sm }}>
                <DateField label="Fecha inicio" value={startDate} onChange={setStartDate} placeholder="AAAA-MM-DD" />
                <DateField label="Fecha fin" value={endDate} onChange={setEndDate} placeholder="AAAA-MM-DD" />
              </View>
            </View>

            {/* Tipos de Evidencia Operativa */}
            <View style={s.card}>
              <SectionHeader icon="document-text" title="TIPOS DE EVIDENCIA OPERATIVA" subtitle="Define los nombres que el responsable podrá usar al cargar evidencias. Si no defines ninguno, el campo es libre." />
              <View style={s.tipoEvRow}>
                <TextInput
                  style={s.tipoEvInput}
                  value={tipoEvInput}
                  onChangeText={setTipoEvInput}
                  placeholder="Ej: Sesión, Visita técnica, Entrega..."
                  placeholderTextColor={colors.textSecondary}
                  onSubmitEditing={addTipoEvidencia}
                />
                <TouchableOpacity style={s.tipoEvAddBtn} onPress={addTipoEvidencia}>
                  <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
              {tiposEvidencia.length > 0 && (
                <View style={s.tipoEvChips}>
                  {tiposEvidencia.map(t => (
                    <View key={t} style={s.tipoEvChip}>
                      <Text style={s.tipoEvChipTxt}>{t}</Text>
                      <TouchableOpacity onPress={() => removeTipoEvidencia(t)}>
                        <Ionicons name="close" size={13} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* ── Columna Derecha: Responsables + Requisitos ── */}
          <View style={s.column}>
            {/* Responsables */}
            <View style={[s.card, { zIndex: 10, position: 'relative' }]}>
              <SectionHeader icon="people" title="RESPONSABLES" subtitle="Asigna responsables y apoyos" />
              <View style={s.typeSelector}>
                {(['responsable', 'apoyo'] as const).map(tipo => (
                  <TouchableOpacity key={tipo} style={[s.typeBtn, tipoAsig === tipo && s.typeBtnActive]} onPress={() => setTipoAsig(tipo)}>
                    <Text style={[s.typeBtnTxt, tipoAsig === tipo && s.typeBtnTxtActive]}>{tipo === 'responsable' ? 'Responsable' : 'Apoyo'}</Text>
                    <Text style={[s.typeBtnSub, tipoAsig === tipo && s.typeBtnSubActive]}>{tipo === 'responsable' ? 'Registra ejecución' : 'Carga evidencias'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={s.selectorRow}>
                <View style={s.selectorWrap}>
                  {loadingMiembros
                    ? <ActivityIndicator size="small" color={colors.primary} style={{ height: 38 }} />
                    : <SearchableSelect options={opcionesMiembros} selectedValue={selectedUserId} onSelect={setSelectedUserId} placeholder="Buscar miembro del proyecto..." />
                  }
                </View>
                <Button label="Agregar" onPress={handleAgregarResponsable} disabled={!selectedUserId} style={s.btnAgregar} />
              </View>
              {seleccionados.length > 0 && (
                <View style={s.memberGrid}>
                  {seleccionados.map(sel => {
                    const isResp  = sel.tipo === 'responsable';
                    const initials = sel.nombre.charAt(0).toUpperCase();
                    const avatarBg = isResp ? '#e0f2fe' : '#dcfce7';
                    const avatarColor = isResp ? colors.primary : colors.success;
                    return (
                      <View key={sel.usuarioId} style={s.memberCard}>
                        <View style={s.memberAvatarContainer}>
                          {sel.photoUrl
                            ? <Image source={{ uri: sel.photoUrl }} style={s.memberAvatarBg} />
                            : <View style={[s.memberAvatarBg, { backgroundColor: avatarBg }]}>
                                <Text style={[s.memberAvatarText, { color: avatarColor }]}>{initials}</Text>
                              </View>
                          }
                          <View style={s.nameOverlay}>
                            <Text style={s.nameOverlayText} numberOfLines={1}>{sel.nombre}</Text>
                          </View>
                          <TouchableOpacity style={s.removeBadgeFloat} onPress={() => handleQuitarResponsable(sel.usuarioId)} activeOpacity={0.8}>
                            <Ionicons name="trash-outline" size={14} color="#f43f5e" />
                          </TouchableOpacity>
                        </View>
                        <View style={[s.roleCapsule, isResp ? s.roleCapsuleResp : s.roleCapsuleApoyo]}>
                          <Text style={[s.roleCapsuleText, isResp ? s.roleCapsuleTextResp : s.roleCapsuleTextApoyo]}>
                            {isResp ? 'Responsable' : 'Apoyo'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Requisitos de Verificación */}
            <View style={s.card}>
              <SectionHeader icon="shield-checkmark" title="REQUISITOS DE VERIFICACIÓN" subtitle="Define los requisitos y evidencia necesarios" />
              <View style={s.plantillasRow}>
                {PLANTILLAS.map(p => (
                  <TouchableOpacity key={p.nombre} style={s.plantillaBtn} onPress={() => addPlantilla(p)}>
                    <Text style={s.plantillaTxt}>+ {p.nombre}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={s.plantillaBtn} onPress={addCustom}>
                  <Text style={s.plantillaTxt}>+ Personalizado</Text>
                </TouchableOpacity>
              </View>
              {requisitos.map((req, idx) => (
                <View key={idx} style={s.reqRow}>
                  <View style={s.reqHeader}>
                    <TextInput style={s.reqNombre} value={req.nombre} onChangeText={v => updateReq(idx, { nombre: v })} placeholder="Nombre del requisito" placeholderTextColor={colors.textSecondary} />
                    <TouchableOpacity onPress={() => removeReq(idx)} style={s.reqDelete}>
                      <Ionicons name="close" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <TextInput style={s.reqDesc} value={req.descripcion ?? ''} onChangeText={v => updateReq(idx, { descripcion: v || undefined })} placeholder="Descripción opcional" placeholderTextColor={colors.textSecondary} />
                  <View style={s.reqToggleRow}>
                    <Text style={s.reqLabel}>Obligatorio</Text>
                    <Switch value={req.obligatorio} onValueChange={v => updateReq(idx, { obligatorio: v, min_archivos: v ? Math.max(req.min_archivos, 1) : 0 })} trackColor={{ false: colors.border, true: colors.primary }} />
                  </View>
                  <Text style={s.reqLabel}>Tipos permitidos</Text>
                  <View style={s.mimesRow}>
                    {TIPOS_MIME.map(m => {
                      const sel = req.tipos_archivo_permitidos.includes(m.value);
                      return (
                        <TouchableOpacity key={m.value} style={[s.mimeChip, sel && s.mimeChipActive]} onPress={() => toggleMime(idx, m.value)}>
                          <Text style={[s.mimeChipTxt, sel && s.mimeChipTxtActive]}>{m.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View style={s.minMaxRow}>
                    <View style={s.minMaxItem}>
                      <Text style={s.reqLabel}>Mín archivos</Text>
                      <TextInput style={s.numInput} value={String(req.min_archivos)} onChangeText={v => updateReq(idx, { min_archivos: parseInt(v) || 0 })} keyboardType="numeric" />
                    </View>
                    <View style={s.minMaxItem}>
                      <Text style={s.reqLabel}>Máx archivos</Text>
                      <TextInput style={s.numInput} value={req.max_archivos != null ? String(req.max_archivos) : ''} onChangeText={v => updateReq(idx, { max_archivos: v ? parseInt(v) : undefined })} keyboardType="numeric" placeholder="Sin límite" placeholderTextColor={colors.textSecondary} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </AppShell>
  );
};

// ── SectionHeader (sub-componente local) ─────────────────────────────────────
const SectionHeader: React.FC<{ icon: any; title: string; subtitle: string }> = ({ icon, title, subtitle }) => (
  <View style={s.sectionHeaderRow}>
    <View style={s.sectionIconContainer}>
      <Ionicons name={icon} size={18} color={colors.primary} />
    </View>
    <View>
      <Text style={s.sectionTitleText}>{title}</Text>
      <Text style={s.sectionSubtitleText}>{subtitle}</Text>
    </View>
  </View>
);

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  shell:      { backgroundColor: colors.background, flex: 1 },
  topBar:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface } as any,
  topBarMobile: { flexDirection: 'column', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: 0 } as any,
  topBarRow1: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' } as any,
  topBarRow2: { paddingTop: spacing.xs, paddingBottom: spacing.xs } as any,
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 } as any,
  backTxt:    { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary, fontWeight: typography.weights.medium },
  titleContainer: { flex: 1, marginLeft: spacing.sm },
  pageTitle:  { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  pageSubtitle: { fontFamily: typography.fontFamily, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  headerRight:{ flexDirection: 'row', alignItems: 'center' } as any,
  scroll:     { flex: 1 },
  scrollContent: { padding: spacing.xl, gap: spacing.lg },
  scrollContentMobile: { padding: spacing.md } as any,
  formColumns: { flexDirection: 'row', gap: spacing.lg } as any,
  formColumnsMobile: { flexDirection: 'column' } as any,
  column:     { flex: 1, gap: spacing.lg },
  card:       { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, gap: spacing.md },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs } as any,
  sectionIconContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: `${colors.primary}12`, alignItems: 'center', justifyContent: 'center' },
  sectionTitleText: { fontFamily: typography.fontFamily, fontSize: 13, fontWeight: typography.weights.bold, color: colors.primary, letterSpacing: 0.8 },
  sectionSubtitleText: { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  sugerencias: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: -4 } as any,
  chip:        { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  chipActive:  { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  chipTxt:     { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary },
  chipTxtActive: { color: colors.primary, fontWeight: typography.weights.medium },
  typeSelector: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs } as any,
  typeBtn:    { flex: 1, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 8, alignItems: 'center', backgroundColor: colors.surface },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
  typeBtnTxt: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textSecondary },
  typeBtnTxtActive: { color: colors.primary },
  typeBtnSub: { fontFamily: typography.fontFamily, fontSize: 10, color: colors.textSecondary, marginTop: 1 },
  typeBtnSubActive: { color: colors.primary },
  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, zIndex: 50 } as any,
  selectorWrap: { flex: 1, zIndex: 50 } as any,
  btnAgregar: { minWidth: 80, height: 38 },
  memberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm } as any,
  memberCard: { width: 105, alignItems: 'center', gap: 6 },
  memberAvatarContainer: { width: 100, height: 100, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' as any, position: 'relative' as any, backgroundColor: '#f8fafc' } as any,
  memberAvatarBg: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText: { fontFamily: typography.fontFamily, fontSize: 28, fontWeight: typography.weights.bold },
  nameOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', paddingVertical: 4, paddingHorizontal: 6 },
  nameOverlayText: { fontFamily: typography.fontFamily, fontSize: 10, color: '#ffffff', textAlign: 'center', fontWeight: typography.weights.medium },
  removeBadgeFloat: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 } as any,
  roleCapsule: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, alignItems: 'center', width: '100%' },
  roleCapsuleResp: { backgroundColor: `${colors.primary}12` },
  roleCapsuleApoyo: { backgroundColor: `${colors.success}12` },
  roleCapsuleText: { fontFamily: typography.fontFamily, fontSize: 9, fontWeight: typography.weights.bold },
  roleCapsuleTextResp: { color: colors.primary },
  roleCapsuleTextApoyo: { color: colors.success },
  plantillasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.xs } as any,
  plantillaBtn:  { paddingHorizontal: spacing.sm, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.primary + '60' },
  plantillaTxt:  { fontFamily: typography.fontFamily, fontSize: 11, color: colors.primary, fontWeight: typography.weights.medium },
  reqRow:    { backgroundColor: colors.background, borderRadius: 10, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  reqHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 } as any,
  reqNombre: { flex: 1, fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textPrimary, fontWeight: typography.weights.bold, paddingVertical: 2 },
  reqDelete: { padding: 4, marginLeft: spacing.xs },
  reqDesc:   { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary, marginBottom: spacing.xs, paddingVertical: 2 },
  reqLabel:  { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary, marginBottom: 3, fontWeight: typography.weights.medium },
  reqToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  mimesRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: spacing.xs } as any,
  mimeChip:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  mimeChipActive: { borderColor: colors.success, backgroundColor: colors.success + '15' },
  mimeChipTxt: { fontFamily: typography.fontFamily, fontSize: 10, color: colors.textSecondary },
  mimeChipTxtActive: { color: colors.success, fontWeight: typography.weights.bold },
  minMaxRow: { flexDirection: 'row', gap: spacing.sm } as any,
  minMaxItem: { flex: 1 },
  numInput:  { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.surface },
  tipoEvRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm } as any,
  tipoEvInput:  { flex: 1, fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: colors.surface },
  tipoEvAddBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  tipoEvChips:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm } as any,
  tipoEvChip:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: `${colors.primary}60`, backgroundColor: `${colors.primary}10` } as any,
  tipoEvChipTxt:{ fontFamily: typography.fontFamily, fontSize: 12, color: colors.primary, fontWeight: typography.weights.medium },
});
