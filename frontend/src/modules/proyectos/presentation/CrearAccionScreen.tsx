import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, ActivityIndicator, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppShell } from '../../../shared/components/AppShell';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { TextField } from '../../../shared/components/TextField';
import { SearchableSelect, SelectOption } from '../../../shared/components/SearchableSelect';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { crearAccionMetaUseCase, listarMiembrosUseCase, asignacionResponsableRepo } from '../../../shared/dependencies';
import { RequisitoVerificacion } from '../domain/Accion';
import { ProyectoMiembro } from '../domain/ProyectoMiembro';

interface Props {
  componenteId: string;
  proyectoId: string;
}

const UNIDADES_SUGERIDAS = ['Personas', 'Clases', 'Talleres', 'Documentos', 'Visitas'];

const TIPOS_MIME = [
  { label: 'PDF',   value: 'application/pdf' },
  { label: 'JPEG',  value: 'image/jpeg' },
  { label: 'PNG',   value: 'image/png' },
  { label: 'WEBP',  value: 'image/webp' },
  { label: 'Word',  value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { label: 'Excel', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
];

type ReqDraft = Omit<RequisitoVerificacion, 'id'>;

const PLANTILLAS: ReqDraft[] = [
  { nombre: 'Lista de asistencia', obligatorio: true, tipos_archivo_permitidos: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], min_archivos: 1, max_archivos: 2, orden: 0 },
  { nombre: 'Registro fotográfico', obligatorio: true, tipos_archivo_permitidos: ['image/jpeg', 'image/png', 'image/webp'], min_archivos: 3, max_archivos: 20, orden: 1 },
  { nombre: 'Documento soporte',   obligatorio: false, tipos_archivo_permitidos: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], min_archivos: 0, max_archivos: 1, orden: 2 },
];

const emptyReq = (orden: number): ReqDraft => ({
  nombre: '', obligatorio: true,
  tipos_archivo_permitidos: ['application/pdf'],
  min_archivos: 1, max_archivos: undefined, orden,
});

interface ResponsableSeleccionado {
  usuarioId: number;
  nombre: string;
  tipo: 'responsable' | 'apoyo';
  photoUrl?: string | null;
}

const DateField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}> = ({ label, value, onChange, placeholder }) => (
  <View style={dfStyles.wrapper}>
    <Text style={dfStyles.label}>{label}</Text>
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
        style={dfStyles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
      />
    )}
  </View>
);

const dfStyles = StyleSheet.create({
  wrapper: { flex: 1, minWidth: 140 },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontFamily: typography.fontFamily,
  },
});

export const CrearAccionScreen: React.FC<Props> = ({ componenteId, proyectoId }) => {
  const [nombre,      setNombre]      = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [unidad,      setUnidad]      = useState('');
  const [proyeccion,  setProyeccion]  = useState('');
  const [requisitos,  setRequisitos]  = useState<ReqDraft[]>([]);
  const [tiposEvidencia, setTiposEvidencia] = useState<string[]>([]);
  const [tipoEvInput,    setTipoEvInput]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');

  // Responsables
  const [miembros,        setMiembros]        = useState<ProyectoMiembro[]>([]);
  const [loadingMiembros, setLoadingMiembros] = useState(false);
  const [selectedUserId,  setSelectedUserId]  = useState('');
  const [tipoAsig,        setTipoAsig]        = useState<'responsable' | 'apoyo'>('responsable');
  const [seleccionados,   setSeleccionados]   = useState<ResponsableSeleccionado[]>([]);

  const reset = () => {
    setNombre(''); setDescripcion(''); setUnidad(''); setProyeccion('');
    setRequisitos([]); setTiposEvidencia([]); setTipoEvInput(''); setError(null);
    setSelectedUserId(''); setTipoAsig('responsable'); setSeleccionados([]);
    setStartDate(''); setEndDate('');
  };

  // Cargar miembros del proyecto
  useEffect(() => {
    if (!proyectoId) return;
    setLoadingMiembros(true);
    listarMiembrosUseCase.ejecutar(proyectoId)
      .then(ms => {
        const seen = new Set<number>();
        setMiembros(ms.filter(m => {
          if (seen.has(m.usuarioId)) return false;
          seen.add(m.usuarioId);
          return true;
        }));
      })
      .catch(() => {})
      .finally(() => setLoadingMiembros(false));
  }, [proyectoId]);

  const opcionesMiembros = useMemo<SelectOption[]>(() => {
    const yaSeleccionados = new Set(seleccionados.map(s => s.usuarioId));
    return miembros
      .filter(m => !yaSeleccionados.has(m.usuarioId))
      .map(m => ({
        id: String(m.usuarioId),
        name: m.nombreCompleto || m.username,
        description: `@${m.username}`,
      }));
  }, [miembros, seleccionados]);

  const handleAgregarResponsable = () => {
    if (!selectedUserId) return;
    const uid = parseInt(selectedUserId, 10);
    const miembro = miembros.find(m => m.usuarioId === uid);
    if (!miembro) return;
    setSeleccionados(prev => [
      ...prev,
      { usuarioId: uid, nombre: miembro.nombreCompleto || miembro.username, tipo: tipoAsig, photoUrl: miembro.photoUrl },
    ]);
    setSelectedUserId('');
  };

  const handleQuitarResponsable = (usuarioId: number) => {
    setSeleccionados(prev => prev.filter(s => s.usuarioId !== usuarioId));
  };

  // Requisitos
  const addPlantilla = (p: ReqDraft) => {
    setRequisitos(prev => {
      if (prev.some(r => r.nombre === p.nombre)) return prev;
      return [...prev, { ...p, orden: prev.length }];
    });
  };
  const addCustom = () => setRequisitos(prev => [...prev, emptyReq(prev.length)]);
  const updateReq = (idx: number, patch: Partial<ReqDraft>) => {
    setRequisitos(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };
  const removeReq = (idx: number) => setRequisitos(prev => prev.filter((_, i) => i !== idx));
  const toggleMime = (idx: number, mime: string) => {
    const req = requisitos[idx];
    const has = req.tipos_archivo_permitidos.includes(mime);
    const updated = has
      ? req.tipos_archivo_permitidos.filter(m => m !== mime)
      : [...req.tipos_archivo_permitidos, mime];
    if (updated.length === 0) return;
    updateReq(idx, { tipos_archivo_permitidos: updated });
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!unidad.trim()) { setError('La unidad de medida es obligatoria.'); return; }
    const proy = parseFloat(proyeccion);
    if (isNaN(proy) || proy <= 0) { setError('La proyección debe ser un número mayor a 0.'); return; }

    setSaving(true); setError(null);
    try {
      const accion = await crearAccionMetaUseCase.ejecutar(componenteId, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        unidadMedida: unidad.trim(),
        proyeccion: proy,
        requisitosVerificacion: requisitos.length > 0 ? requisitos : undefined,
        tiposEvidencia: tiposEvidencia.length > 0 ? tiposEvidencia : undefined,
        startDate: startDate || null,
        endDate: endDate || null,
      });

      // Asignar responsables seleccionados
      const erroresAsignacion: string[] = [];
      for (const resp of seleccionados) {
        try {
          await asignacionResponsableRepo.asignarResponsable(
            componenteId, accion.id, resp.usuarioId, resp.tipo,
          );
        } catch (e: any) {
          erroresAsignacion.push(
            e?.response?.data?.error || `No se pudo asignar a ${resp.nombre}`
          );
        }
      }

      if (erroresAsignacion.length > 0) {
        setError(`Acción creada. Advertencia de asignación: ${erroresAsignacion.join(' · ')}`);
        setSaving(false);
        return;
      }
      reset();
      router.back();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al crear la acción.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell scrollable={false} style={styles.shell}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
          <Text style={styles.backTxt}>Volver</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Crear Acción</Text>
          <Text style={styles.pageSubtitle}>Completa la información para configurar esta acción</Text>
        </View>
        <View style={styles.headerRight}>
          <Button label="Cancelar" variant="ghost" onPress={() => router.back()} style={{ marginRight: spacing.sm }} />
          <Button label="Guardar" onPress={handleGuardar} loading={saving} disabled={saving} />
        </View>
      </View>

      {!!error && <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md }}><ErrorMessage message={error} /></View>}

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formColumns}>
          {/* Columna Izquierda: Medición + Tipos de Evidencia */}
          <View style={styles.column}>
            {/* Medición */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="stats-chart" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.sectionTitleText}>MEDICIÓN</Text>
                  <Text style={styles.sectionSubtitleText}>Define los datos principales de la medición</Text>
                </View>
              </View>

              <TextField label="Nombre *" value={nombre} onChangeText={setNombre}
                placeholder="Nombre de la acción" autoCapitalize="sentences" />
              <TextField label="Descripción" value={descripcion} onChangeText={setDescripcion}
                placeholder="Descripción opcional" autoCapitalize="sentences" />

              <TextField label="Unidad de medida *" value={unidad} onChangeText={setUnidad}
                placeholder="ej: talleres, personas, documentos" autoCapitalize="sentences" />
              <View style={styles.sugerencias}>
                {UNIDADES_SUGERIDAS.map(u => (
                  <TouchableOpacity key={u} style={[styles.chip, unidad === u && styles.chipActive]}
                    onPress={() => setUnidad(u)}>
                    <Text style={[styles.chipTxt, unidad === u && styles.chipTxtActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextField label="Proyección *" value={proyeccion} onChangeText={setProyeccion}
                placeholder="ej: 300" keyboardType="numeric" />

              <View style={{ flexDirection: 'row', gap: spacing.md, marginVertical: spacing.sm }}>
                <DateField label="Fecha inicio" value={startDate} onChange={setStartDate} placeholder="AAAA-MM-DD" />
                <DateField label="Fecha fin" value={endDate} onChange={setEndDate} placeholder="AAAA-MM-DD" />
              </View>
            </View>

            {/* Tipos de Evidencia Operativa */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="document-text" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.sectionTitleText}>TIPOS DE EVIDENCIA OPERATIVA</Text>
                  <Text style={styles.sectionSubtitleText}>Define los nombres que el responsable podrá usar al cargar evidencias (ej: Sesión, Visita). Si no defines ninguno, el campo es libre.</Text>
                </View>
              </View>

              <View style={styles.tipoEvRow}>
                <TextInput
                  style={styles.tipoEvInput}
                  value={tipoEvInput}
                  onChangeText={setTipoEvInput}
                  placeholder="Ej: Sesión, Visita técnica, Entrega..."
                  placeholderTextColor={colors.textSecondary}
                  onSubmitEditing={() => {
                    const v = tipoEvInput.trim();
                    if (v && !tiposEvidencia.includes(v)) setTiposEvidencia(prev => [...prev, v]);
                    setTipoEvInput('');
                  }}
                />
                <TouchableOpacity
                  style={styles.tipoEvAddBtn}
                  onPress={() => {
                    const v = tipoEvInput.trim();
                    if (v && !tiposEvidencia.includes(v)) setTiposEvidencia(prev => [...prev, v]);
                    setTipoEvInput('');
                  }}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
              </View>

              {tiposEvidencia.length > 0 && (
                <View style={styles.tipoEvChips}>
                  {tiposEvidencia.map(t => (
                    <View key={t} style={styles.tipoEvChip}>
                      <Text style={styles.tipoEvChipTxt}>{t}</Text>
                      <TouchableOpacity onPress={() => setTiposEvidencia(prev => prev.filter(x => x !== t))}>
                        <Ionicons name="close" size={13} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Columna Derecha: Responsables + Requisitos */}
          <View style={styles.column}>
            {/* Responsables */}
            <View style={[styles.card, { zIndex: 10, position: 'relative' }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="people" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.sectionTitleText}>RESPONSABLES</Text>
                  <Text style={styles.sectionSubtitleText}>Asigna responsables y apoyos</Text>
                </View>
              </View>

              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeBtn, tipoAsig === 'responsable' && styles.typeBtnActive]}
                  onPress={() => setTipoAsig('responsable')}
                >
                  <Text style={[styles.typeBtnTxt, tipoAsig === 'responsable' && styles.typeBtnTxtActive]}>Responsable</Text>
                  <Text style={[styles.typeBtnSub, tipoAsig === 'responsable' && styles.typeBtnSubActive]}>Registra ejecución</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, tipoAsig === 'apoyo' && styles.typeBtnActive]}
                  onPress={() => setTipoAsig('apoyo')}
                >
                  <Text style={[styles.typeBtnTxt, tipoAsig === 'apoyo' && styles.typeBtnTxtActive]}>Apoyo</Text>
                  <Text style={[styles.typeBtnSub, tipoAsig === 'apoyo' && styles.typeBtnSubActive]}>Carga evidencias</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.selectorRow}>
                <View style={styles.selectorWrap}>
                  {loadingMiembros ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ height: 38 }} />
                  ) : (
                    <SearchableSelect
                      options={opcionesMiembros}
                      selectedValue={selectedUserId}
                      onSelect={setSelectedUserId}
                      placeholder="Buscar miembro del proyecto..."
                    />
                  )}
                </View>
                <Button
                  label="Agregar"
                  onPress={handleAgregarResponsable}
                  disabled={!selectedUserId}
                  style={styles.btnAgregar}
                />
              </View>

              {seleccionados.length > 0 && (
                <View style={styles.memberGrid}>
                  {seleccionados.map(s => {
                    const isResponsable = s.tipo === 'responsable';
                    const initials = s.nombre.charAt(0).toUpperCase();
                    const avatarBg = isResponsable ? '#e0f2fe' : '#dcfce7';
                    const avatarColor = isResponsable ? colors.primary : colors.success;

                    return (
                      <View key={s.usuarioId} style={styles.memberCard}>
                        <View style={styles.memberAvatarContainer}>
                          {s.photoUrl ? (
                            <Image source={{ uri: s.photoUrl }} style={styles.memberAvatarBg} />
                          ) : (
                            <View style={[styles.memberAvatarBg, { backgroundColor: avatarBg }]}>
                              <Text style={[styles.memberAvatarText, { color: avatarColor }]}>{initials}</Text>
                            </View>
                          )}
                          
                          <View style={styles.nameOverlay}>
                            <Text style={styles.nameOverlayText} numberOfLines={1}>{s.nombre}</Text>
                          </View>

                          <TouchableOpacity 
                            style={styles.removeBadgeFloat} 
                            onPress={() => handleQuitarResponsable(s.usuarioId)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="trash-outline" size={14} color="#f43f5e" />
                          </TouchableOpacity>
                        </View>
                        <View style={[
                          styles.roleCapsule, 
                          isResponsable ? styles.roleCapsuleResp : styles.roleCapsuleApoyo
                        ]}>
                          <Text style={[
                            styles.roleCapsuleText, 
                            isResponsable ? styles.roleCapsuleTextResp : styles.roleCapsuleTextApoyo
                          ]}>
                            {isResponsable ? 'Responsable' : 'Apoyo'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Requisitos de Verificación */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.sectionTitleText}>REQUISITOS DE VERIFICACIÓN</Text>
                  <Text style={styles.sectionSubtitleText}>Define los requisitos y evidencia necesarios</Text>
                </View>
              </View>

              <View style={styles.plantillasRow}>
                {PLANTILLAS.map(p => (
                  <TouchableOpacity key={p.nombre} style={styles.plantillaBtn}
                    onPress={() => addPlantilla(p)}>
                    <Text style={styles.plantillaTxt}>+ {p.nombre}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.plantillaBtn} onPress={addCustom}>
                  <Text style={styles.plantillaTxt}>+ Personalizado</Text>
                </TouchableOpacity>
              </View>

              {requisitos.map((req, idx) => (
                <View key={idx} style={styles.reqRow}>
                  <View style={styles.reqHeader}>
                    <TextInput
                      style={styles.reqNombre}
                      value={req.nombre}
                      onChangeText={v => updateReq(idx, { nombre: v })}
                      placeholder="Nombre del requisito"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <TouchableOpacity onPress={() => removeReq(idx)} style={styles.reqDelete}>
                      <Ionicons name="close" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.reqDesc}
                    value={req.descripcion ?? ''}
                    onChangeText={v => updateReq(idx, { descripcion: v || undefined })}
                    placeholder="Descripción opcional"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <View style={styles.reqToggleRow}>
                    <Text style={styles.reqLabel}>Obligatorio</Text>
                    <Switch
                      value={req.obligatorio}
                      onValueChange={v => updateReq(idx, { obligatorio: v, min_archivos: v ? Math.max(req.min_archivos, 1) : 0 })}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>

                  <Text style={styles.reqLabel}>Tipos permitidos</Text>
                  <View style={styles.mimesRow}>
                    {TIPOS_MIME.map(m => {
                      const sel = req.tipos_archivo_permitidos.includes(m.value);
                      return (
                        <TouchableOpacity key={m.value} style={[styles.mimeChip, sel && styles.mimeChipActive]}
                          onPress={() => toggleMime(idx, m.value)}>
                          <Text style={[styles.mimeChipTxt, sel && styles.mimeChipTxtActive]}>{m.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.minMaxRow}>
                    <View style={styles.minMaxItem}>
                      <Text style={styles.reqLabel}>Mín archivos</Text>
                      <TextInput
                        style={styles.numInput}
                        value={String(req.min_archivos)}
                        onChangeText={v => updateReq(idx, { min_archivos: parseInt(v) || 0 })}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={styles.minMaxItem}>
                      <Text style={styles.reqLabel}>Máx archivos</Text>
                      <TextInput
                        style={styles.numInput}
                        value={req.max_archivos != null ? String(req.max_archivos) : ''}
                        onChangeText={v => updateReq(idx, { max_archivos: v ? parseInt(v) : undefined })}
                        keyboardType="numeric"
                        placeholder="Sin límite"
                        placeholderTextColor={colors.textSecondary}
                      />
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

const styles = StyleSheet.create({
  shell:      { backgroundColor: colors.background, flex: 1 },
  topBar:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface } as any,
  backBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 } as any,
  backTxt:    { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary, fontWeight: typography.weights.medium },
  titleContainer: { flex: 1, marginLeft: spacing.sm },
  pageTitle:  { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  pageSubtitle: { fontFamily: typography.fontFamily, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  headerRight:{ flexDirection: 'row', alignItems: 'center' },
  scroll:   { flex: 1 },
  scrollContent: { padding: spacing.xl, gap: spacing.lg },
  formColumns: { flexDirection: Platform.OS === 'web' ? 'row' : 'column', gap: spacing.lg },
  column: { flex: 1, gap: spacing.lg },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    gap: spacing.md,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  } as any,
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${colors.primary}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleText: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  sectionSubtitleText: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  fieldLabel:    { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary, marginBottom: -4 },

  sugerencias: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: -4 } as any,
  chip:        { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  chipActive:  { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
  chipTxt:     { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary },
  chipTxtActive: { color: colors.primary, fontWeight: typography.weights.medium },

  // Responsables
  typeSelector: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs } as any,
  typeBtn: { flex: 1, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: 8, alignItems: 'center', backgroundColor: colors.surface },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
  typeBtnTxt: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textSecondary },
  typeBtnTxtActive: { color: colors.primary },
  typeBtnSub: { fontFamily: typography.fontFamily, fontSize: 10, color: colors.textSecondary, marginTop: 1 },
  typeBtnSubActive: { color: colors.primary },
  selectorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, zIndex: 50 } as any,
  selectorWrap: { flex: 1, zIndex: 50 } as any,
  btnAgregar: { minWidth: 80, height: 38 },

  // Member Grid (Square Cards)
  memberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  } as any,
  memberCard: {
    width: 105,
    alignItems: 'center',
    gap: 6,
  },
  memberAvatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden' as any,
    position: 'relative' as any,
    backgroundColor: '#f8fafc',
  } as any,
  memberAvatarBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontFamily: typography.fontFamily,
    fontSize: 28,
    fontWeight: typography.weights.bold,
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  nameOverlayText: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: typography.weights.medium,
  },
  removeBadgeFloat: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  } as any,
  roleCapsule: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
  },
  roleCapsuleResp: {
    backgroundColor: `${colors.primary}12`,
  },
  roleCapsuleApoyo: {
    backgroundColor: `${colors.success}12`,
  },
  roleCapsuleText: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    fontWeight: typography.weights.bold,
  },
  roleCapsuleTextResp: {
    color: colors.primary,
  },
  roleCapsuleTextApoyo: {
    color: colors.success,
  },

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

  mimesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: spacing.xs } as any,
  mimeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  mimeChipActive: { borderColor: colors.success, backgroundColor: colors.success + '15' },
  mimeChipTxt: { fontFamily: typography.fontFamily, fontSize: 10, color: colors.textSecondary },
  mimeChipTxtActive: { color: colors.success, fontWeight: typography.weights.bold },

  minMaxRow: { flexDirection: 'row', gap: spacing.sm } as any,
  minMaxItem: { flex: 1 },
  numInput: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: colors.surface },

  tipoEvRow:    { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm } as any,
  tipoEvInput:  { flex: 1, fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: colors.surface },
  tipoEvAddBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  tipoEvChips:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm } as any,
  tipoEvChip:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 16, borderWidth: 1, borderColor: `${colors.primary}60`, backgroundColor: `${colors.primary}10` } as any,
  tipoEvChipTxt:{ fontFamily: typography.fontFamily, fontSize: 12, color: colors.primary, fontWeight: typography.weights.medium },
});
