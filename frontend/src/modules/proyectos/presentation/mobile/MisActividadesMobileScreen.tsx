import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Platform, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useMisActividades } from '../hooks/useMisActividades';

const DateTimePicker = Platform.OS !== 'web' ? require('@react-native-community/datetimepicker').default : null;
import { colors } from '../../../../shared/constants/colors';
import { spacing } from '../../../../shared/constants/spacing';
import { typography } from '../../../../shared/constants/typography';
import { EvidenciaCaptureSheet } from '../EvidenciaCaptureSheet';
import { ErrorMessage } from '../../../../shared/components/ErrorMessage';

const fileIcon = (t: string): any =>
  t?.startsWith('image/') ? 'image-outline'
  : t === 'application/pdf' ? 'document-text-outline'
  : t?.includes('spreadsheetml') ? 'grid-outline' : 'document-outline';

const fileColor = (t: string) =>
  t?.startsWith('image/') ? '#10b981' : t === 'application/pdf' ? '#ef4444' : colors.primary;

const toUrl = (url: string) => {
  const API_BASE = (process.env as any).EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
  return url?.startsWith('http') ? url : `${API_BASE}${url}`;
};

interface MisActividadesMobileScreenProps {
  selectedAccionId?: string;
}

export const MisActividadesMobileScreen: React.FC<MisActividadesMobileScreenProps> = ({ selectedAccionId }) => {
  const state = useMisActividades(selectedAccionId);
  const [activeAccordionId, setActiveAccordionId] = useState<string | null>(selectedAccionId || null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
  }, [state.previewSoporte]);

  const handleWheel = (e: any) => {
    if (Platform.OS === 'web') {
      const delta = e.deltaY * -0.003;
      setZoomScale(prev => Math.min(Math.max(1, prev + delta), 4));
    }
  };

  const handleMouseDown = (e: any) => {
    if (Platform.OS === 'web') {
      isDragging.current = true;
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: any) => {
    if (Platform.OS === 'web' && isDragging.current) {
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      setPan({ x: newX, y: newY });
    }
  };

  const handleMouseUpOrLeave = () => {
    if (Platform.OS === 'web') {
      isDragging.current = false;
    }
  };

  useEffect(() => {
    if (selectedAccionId) {
      setActiveAccordionId(selectedAccionId);
      state.cargarDetalle(selectedAccionId);
    }
  }, [selectedAccionId]);

  // Estados locales para la selección rápida de carga de soporte en móvil
  const [cargarSoporteAct, setCargarSoporteAct] = useState<any | null>(null);
  const [cargarSoporteReq, setCargarSoporteReq] = useState<any | null>(null);

  const toggleAccordion = (id: string) => {
    if (activeAccordionId === id) {
      setActiveAccordionId(null);
      state.setActiveEvId(null);
    } else {
      setActiveAccordionId(id);
      state.cargarDetalle(id);
    }
  };

  // Filtrado final de actividades locales según estado de la pestaña
  const acts = state.filteredActs;

  // Totales de progreso real promediando el avance de cada acción
  const completadasCount = state.todasActs.filter(a => a.verificacion?.estado === 'completo').length;
  const totalCount = state.todasActs.length;
  const totalPct = state.todasActs.reduce((acc, a) => acc + (a.accion?.avance_porcentaje || 0), 0);
  const pctAvance = totalCount > 0 ? Math.round(totalPct / totalCount) : 0;

  // Lógica de carga de archivo recibida desde EvidenciaCaptureSheet
  const handleFileCaptured = async (file: any, fileName: string) => {
    if (!cargarSoporteAct || !cargarSoporteReq) return;
    
    // Si no tiene una evidencia operativa (carpeta activa), debemos crearla automáticamente
    let evId = state.activeEv?.id;
    if (!evId) {
      try {
        state.setEvNombre(cargarSoporteReq.nombre);
        state.setEvDescripcion('Cargado desde app móvil');
        state.setEvFecha(new Date().toISOString().split('T')[0]);
        
        // Crear carpeta de evidencia
        const res = await apiPostEvidencia(cargarSoporteAct.accion.id, cargarSoporteReq.nombre);
        evId = res.id;
      } catch (err) {
        alert('Error al inicializar carpeta de evidencia.');
        return;
      }
    }

    if (evId) {
      state.setSoporteFile(file);
      state.setSoporteFileName(fileName);
      state.setSoporteReqId(cargarSoporteReq.id);
      
      // Auto-guardar inmediatamente al capturar en móvil
      await handleAutoGuardarSoporte(cargarSoporteAct.accion.id, evId, cargarSoporteReq.id, file, fileName);
    }
  };

  // Helper local para crear evidencia (carpeta) al vuelo en móvil
  const apiPostEvidencia = async (accionId: string, nombre: string) => {
    const { api } = require('../../../../services/api');
    const res = await api.post(`/api/mis-actividades/${accionId}/evidencias-operativas/`, {
      nombre: nombre.trim(),
      descripcion: 'Registro rápido móvil',
      fecha_ejecucion: new Date().toISOString().split('T')[0],
      cantidad_ejecutada: 1,
    });
    // Forzar actualización de listado de evidencias
    await state.cargarDetalle(accionId);
    return res.data.datos;
  };

  // Auto-guardado de soporte inmediato para simplificar flujo de usuario en móvil
  const handleAutoGuardarSoporte = async (accionId: string, evId: string, reqId: string, file: any, fileName: string) => {
    const { api } = require('../../../../services/api');
    try {
      const fd = new FormData();
      fd.append('archivo', file, fileName);
      fd.append('requisito_id', reqId);
      await api.post(`/api/mis-actividades/${accionId}/evidencias-operativas/${evId}/soportes/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Evidencia subida correctamente.');
      setCargarSoporteAct(null);
      setCargarSoporteReq(null);
      await state.cargarDetalle(accionId);
    } catch (e: any) {
      const d = e?.response?.data;
      alert(d?.error || d?.errores?.join(' · ') || 'Error al subir la evidencia.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabecera */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Mis Actividades</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Selector de Pestañas (Todas, Pendientes, Completadas) */}
      <View style={styles.tabBar}>
        {state.FILTROS.map(f => {
          const active = state.estado === f.id;
          return (
            <TouchableOpacity 
              key={f.id} 
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => state.setEstado(f.id as any)}
            >
              <Text style={[styles.tabTxt, active && styles.tabTxtActive]}>
                {f.label} ({f.cnt})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Barra de Búsqueda */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar actividad..."
              value={state.q}
              onChangeText={state.setQ}
              placeholderTextColor="#94a3b8"
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="funnel-outline" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Tarjeta de Avance del Proyecto */}
        <View style={styles.progressCard}>
          <View style={styles.progressLeft}>
            <Text style={styles.progressTitle}>Avance del Proyecto</Text>
            <Text style={styles.progressSubtitle}>
              {completadasCount} / {totalCount} acciones completadas
            </Text>
            <View style={styles.progressLineBg}>
              <View style={[styles.progressLineFill, { width: `${pctAvance}%` }]} />
            </View>
          </View>
          <View style={styles.progressRight}>
            <Svg width="56" height="56" viewBox="0 0 36 36">
              <Circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <Circle 
                cx="18" cy="18" r="15.915" fill="none" stroke="#7c3aed" strokeWidth="3"
                strokeDasharray={`${pctAvance} ${100 - pctAvance}`}
                strokeDashoffset="25"
              />
            </Svg>
            <View style={styles.pctOverlay}>
              <Text style={styles.pctText}>{pctAvance}%</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Acciones Asignadas</Text>

        {state.loading ? (
          <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 24 }} />
        ) : acts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="clipboard-outline" size={36} color="#94a3b8" style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTxt}>No tienes actividades en este estado.</Text>
          </View>
        ) : (
          acts.map(a => {
            const isExpanded = activeAccordionId === a.accion.id;
            const statusLabel = a.verificacion?.estado === 'completo' ? 'Completado' : 'Pendiente';
            const statusBg = a.verificacion?.estado === 'completo' ? '#dcfce7' : '#fef3c7';
            const statusColor = a.verificacion?.estado === 'completo' ? '#166534' : '#b45309';

            return (
              <View key={a.accion.id} style={styles.accionCard}>
                {/* Cabecera del Acordeón */}
                <TouchableOpacity 
                  style={styles.accionHeader} 
                  onPress={() => toggleAccordion(a.accion.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.accionIconBox}>
                    <Ionicons name="clipboard-outline" size={18} color="#fff" />
                  </View>
                  <View style={styles.accionMeta}>
                    <Text style={styles.accionName} numberOfLines={1}>{a.accion.nombre}</Text>
                    <Text style={styles.accionDesc} numberOfLines={1}>
                      {a.mi_asignacion?.roles?.join(' · ') || 'Miembro'}
                    </Text>
                    <Text style={styles.accionDate}>
                      <Ionicons name="calendar-outline" size={10} /> 12 May 2026
                    </Text>
                  </View>
                  <View style={styles.accionRight}>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                    <Ionicons 
                      name={isExpanded ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#64748b" 
                      style={{ marginTop: 4 }}
                    />
                  </View>
                </TouchableOpacity>

                {/* Contenido Expandido */}
                {isExpanded && (
                  <View style={styles.accionBody}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={styles.evCountTxt}>
                        Requisitos: {state.reqsCompletadosActiveEv} / {state.requisitosEvidenciaActiva.length} cumplidos
                      </Text>
                      <TouchableOpacity 
                        style={styles.addEvBtn} 
                        onPress={state.openEvModal}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add-circle" size={14} color="#7c3aed" />
                        <Text style={styles.addEvBtnTxt}>Nueva Evidencia</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Selector de Carpetas de Evidencias */}
                    {state.evidencias.length > 0 ? (
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={{ gap: 8, paddingVertical: 4, marginBottom: 12 } as any}
                      >
                        {state.evidencias.map((ev: any) => {
                          const active = state.activeEvId === ev.id;
                          return (
                            <TouchableOpacity
                              key={ev.id}
                              style={[styles.folderPill, active && styles.folderPillActive]}
                              onPress={() => state.setActiveEvId(ev.id)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="folder-open" size={12} color={active ? '#ffffff' : '#64748b'} />
                              <Text style={[styles.folderPillTxt, active && styles.folderPillTxtActive]}>
                                {ev.nombre}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    ) : (
                      <View style={{ backgroundColor: '#fff8e1', borderRadius: 8, padding: 8, marginBottom: 12 }}>
                        <Text style={{ fontSize: 11, color: '#b45309', fontFamily: typography.fontFamily }}>
                          ⚠️ No hay carpetas de evidencia creadas. Presiona "+ Nueva Evidencia" para registrar una.
                        </Text>
                      </View>
                    )}

                    {state.detailLoad ? (
                      <ActivityIndicator size="small" color="#7c3aed" style={{ paddingVertical: 12 }} />
                    ) : (
                      <View style={{ gap: 14, marginTop: 4 }}>
                        {state.requisitosEvidenciaActiva.map((req: any) => {
                          const isActionCompleted = a.verificacion?.estado === 'completo';
                          const isEditable = !isActionCompleted && (!state.activeEv || state.activeEv.estado === 'borrador' || state.activeEv.estado === 'reabierta');
                          const canUpload = isEditable && (!req.max_archivos || req.archivos_cargados < req.max_archivos);

                          return (
                            <View key={req.id} style={{
                              backgroundColor: '#f8fafc',
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: '#e2e8f0',
                              padding: 12,
                            }}>
                              {/* Requirement Header */}
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 } as any}>
                                  <Ionicons 
                                    name={req.cumplido ? "checkmark-circle" : "ellipse-outline"} 
                                    size={15} 
                                    color={req.cumplido ? colors.success : '#94a3b8'} 
                                  />
                                  <Text style={{ fontFamily: typography.fontFamily, fontSize: 13, fontWeight: '700', color: '#1e293b' }}>
                                    {req.nombre}
                                  </Text>
                                  {req.obligatorio && (
                                    <Text style={{ fontSize: 9, color: '#ef4444', fontWeight: 'bold', backgroundColor: '#fef2f2', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                                      Obligatorio
                                    </Text>
                                  )}
                                </View>
                                <Text style={{ fontFamily: typography.fontFamily, fontSize: 11, fontWeight: '700', color: req.cumplido ? colors.success : '#f59e0b' }}>
                                  {req.archivos_cargados} de {req.max_archivos ?? req.min_archivos}
                                </Text>
                              </View>

                              {/* Horizontal thumbnails scroll list + Upload dashed card */}
                              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 10 } as any}>
                                {/* Uploaded files thumbnails */}
                                {(req.evidencias || []).map((file: any) => (
                                  <View key={file.id} style={{ position: 'relative' }}>
                                    <TouchableOpacity
                                      style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 8,
                                        borderWidth: 1,
                                        borderColor: '#cbd5e1',
                                        backgroundColor: '#ffffff',
                                        overflow: 'hidden',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                      onPress={() => state.setPreviewSoporte(file)}
                                    >
                                      {file.file_type?.startsWith('image/') ? (
                                        <Image source={{ uri: toUrl(file.file_url) }} style={{ width: '100%', height: '100%' }} />
                                      ) : (
                                        <View style={{ alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                                          <Ionicons name={fileIcon(file.file_type)} size={28} color={fileColor(file.file_type)} />
                                          <Text style={{ fontSize: 8, fontFamily: typography.fontFamily, color: '#64748b', marginTop: 2, textAlign: 'center', width: 70 }} numberOfLines={1}>
                                            {file.file_name}
                                          </Text>
                                        </View>
                                      )}
                                    </TouchableOpacity>

                                    {/* Inline Delete Button on thumbnail */}
                                    {isEditable && (
                                      <TouchableOpacity
                                        style={{
                                          position: 'absolute',
                                          top: -4,
                                          right: -4,
                                          width: 20,
                                          height: 20,
                                          borderRadius: 10,
                                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          borderWidth: 1,
                                          borderColor: '#ef4444',
                                        }}
                                        onPress={async () => {
                                          if (confirm('¿Estás seguro de eliminar este soporte?')) {
                                            try {
                                              await state.handleDeleteSoporte(file.id);
                                              alert('Soporte eliminado correctamente.');
                                            } catch (err) {
                                              alert('Error al eliminar.');
                                            }
                                          }
                                        }}
                                      >
                                        <Ionicons name="close-circle" size={14} color="#ef4444" />
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                ))}

                                {/* Tocar para subir (always visible if capacity & editable) */}
                                {canUpload && (
                                  <TouchableOpacity
                                    style={{
                                      width: 80,
                                      height: 80,
                                      borderRadius: 8,
                                      borderWidth: 1.5,
                                      borderColor: '#cbd5e1',
                                      borderStyle: 'dashed',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: '#ffffff',
                                    }}
                                    onPress={() => {
                                      setCargarSoporteAct(a);
                                      setCargarSoporteReq(req);
                                    }}
                                  >
                                    <Ionicons name="camera-outline" size={24} color="#7c3aed" />
                                    <Text style={{ fontSize: 9, fontFamily: typography.fontFamily, color: '#7c3aed', marginTop: 2, fontWeight: '700' }}>
                                      Subir foto
                                    </Text>
                                  </TouchableOpacity>
                                )}
                              </ScrollView>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Hoja/Modal de Carga de Soporte al capturar/hacer clic */}
      {!!cargarSoporteReq && (
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Subir Soporte</Text>
              <Text style={styles.sheetSubtitle}>{cargarSoporteReq.nombre}</Text>
            </View>
            <EvidenciaCaptureSheet 
              allowedTypes={cargarSoporteReq.tipos_archivo_permitidos}
              onFileCaptured={handleFileCaptured}
            />
            <TouchableOpacity 
              style={styles.sheetCloseBtn}
              onPress={() => {
                setCargarSoporteAct(null);
                setCargarSoporteReq(null);
              }}
            >
              <Text style={styles.sheetCloseTxt}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal de Crear Nueva Evidencia Operativa (Carpeta) */}
      {state.showEvModal && (
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Nueva Evidencia Operativa</Text>
              <Text style={styles.sheetSubtitle}>Crea una carpeta para agrupar soportes</Text>
            </View>

            {(() => {
              const tipos: string[] = state.selectedAct?.accion?.tipos_evidencia_permitidos ?? [];
              if (tipos.length === 0) {
                return (
                  <View style={{ backgroundColor: '#fef3c7', borderRadius: 8, padding: 12, marginBottom: spacing.sm }}>
                    <Text style={{ fontSize: 12, color: '#92400e', fontFamily: typography.fontFamily }}>
                      El coordinador aún no ha definido los tipos de evidencia para esta acción. Solicita que los configure antes de registrar.
                    </Text>
                  </View>
                );
              }
              return (
                <View style={{ marginBottom: spacing.sm }}>
                  <Text style={styles.labelField}>Tipo de evidencia *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingVertical: 4 } as any}>
                    {tipos.map((t: string) => (
                      <TouchableOpacity key={t}
                        style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                          borderWidth: 1.5,
                          borderColor: state.evNombre === t ? '#7c3aed' : '#cbd5e1',
                          backgroundColor: state.evNombre === t ? '#f5f3ff' : '#ffffff' }}
                        onPress={() => state.setEvNombre(t)}>
                        <Text style={{ fontSize: 12,
                          color: state.evNombre === t ? '#7c3aed' : '#475569',
                          fontWeight: state.evNombre === t ? '700' : '400',
                          fontFamily: typography.fontFamily }}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              );
            })()}

            <Text style={styles.labelField}>¿A cuánto equivale esta entrega/evidencia? *</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
              <TextInput
                style={[styles.textInputField, { flex: 1, marginTop: 4 }]}
                value={state.evCantidad}
                onChangeText={state.setEvCantidad}
                placeholder="Ej. 1, 2.5, 10"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />
              <Text style={{ fontFamily: typography.fontFamily, fontSize: 14, color: '#334155', fontWeight: '700', marginTop: 4 }}>
                {state.selectedAct?.accion?.unidad_medida || 'unidades'}
              </Text>
            </View>

            <Text style={styles.labelField}>Descripción / Bitácora</Text>
            <TextInput
              style={styles.textInputField}
              value={state.evDescripcion}
              onChangeText={state.setEvDescripcion}
              placeholder="Detalla las actividades realizadas..."
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.labelField}>Fecha de Ejecución</Text>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                value={state.evFecha}
                onChange={(e) => state.setEvFecha(e.target.value)}
                style={{
                  fontFamily: typography.fontFamily,
                  fontSize: 14,
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: '#ffffff',
                  marginTop: 4,
                  marginBottom: spacing.md,
                  outlineStyle: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                } as any}
              />
            ) : (
              <View style={{ marginBottom: spacing.md }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    backgroundColor: '#ffffff',
                    marginTop: 4,
                  }}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{
                    fontFamily: typography.fontFamily,
                    fontSize: 14,
                    color: state.evFecha ? colors.textPrimary : '#94a3b8',
                  }}>
                    {state.evFecha || 'Seleccionar fecha'}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color="#94a3b8" />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={state.evFecha ? new Date(state.evFecha + 'T12:00:00') : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event: any, selectedDate?: any) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        const yyyy = selectedDate.getFullYear();
                        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                        const dd = String(selectedDate.getDate()).padStart(2, '0');
                        state.setEvFecha(`${yyyy}-${mm}-${dd}`);
                      }
                    }}
                  />
                )}
              </View>
            )}

            {!!state.evModalErr && <ErrorMessage message={state.evModalErr} />}

            <TouchableOpacity 
              style={[styles.sheetSubmitBtn, (!state.evNombre || !state.evCantidad || (state.selectedAct?.accion?.tipos_evidencia_permitidos ?? []).length === 0) && { opacity: 0.5 }]}
              onPress={state.handleCreateEvidencia}
              disabled={state.evModalSaving || !state.evNombre || !state.evCantidad || (state.selectedAct?.accion?.tipos_evidencia_permitidos ?? []).length === 0}
            >
              <Text style={styles.sheetSubmitTxt}>
                {state.evModalSaving ? 'Creando...' : 'Crear Evidencia'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.sheetCloseBtn}
              onPress={() => state.setShowEvModal(false)}
            >
              <Text style={styles.sheetCloseTxt}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal de Vista Previa de Evidencia Inline */}
      {!!state.previewSoporte && (
        <Modal
          visible={!!state.previewSoporte}
          transparent
          animationType="fade"
          onRequestClose={() => state.setPreviewSoporte(null)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 16,
          }}>
            <View style={{
              width: '95%',
              maxWidth: 500,
              backgroundColor: '#ffffff',
              borderRadius: 16,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}>
              {/* Header */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#f1f5f9',
              } as any}>
                <Text style={{ fontFamily: typography.fontFamily, fontSize: 13, fontWeight: '700', color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                  {state.previewSoporte.file_name}
                </Text>
                <TouchableOpacity onPress={() => state.setPreviewSoporte(null)}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View 
                style={{ padding: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', minHeight: 380, overflow: 'hidden' }}
                {...(Platform.OS === 'web' ? {
                  onWheel: handleWheel,
                  onMouseDown: handleMouseDown,
                  onMouseMove: handleMouseMove,
                  onMouseUp: handleMouseUpOrLeave,
                  onMouseLeave: handleMouseUpOrLeave,
                } : {})}
              >
                {state.previewSoporte.file_type?.startsWith('image/') ? (
                  Platform.OS === 'web' ? (
                    <View style={{ width: '100%', height: 380, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <Image
                        source={{ uri: toUrl(state.previewSoporte.file_url) }}
                        style={{
                          width: '100%',
                          height: 380,
                          borderRadius: 8,
                          transform: [
                            { scale: zoomScale },
                            { translateX: pan.x / zoomScale },
                            { translateY: pan.y / zoomScale }
                          ],
                          cursor: isDragging.current ? 'grabbing' : 'grab',
                        } as any}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    <ScrollView
                      maximumZoomScale={4}
                      minimumZoomScale={1}
                      showsHorizontalScrollIndicator={false}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ width: '100%', height: 380, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Image
                        source={{ uri: toUrl(state.previewSoporte.file_url) }}
                        style={{
                          width: '100%',
                          height: '100%',
                        }}
                        resizeMode="contain"
                      />
                    </ScrollView>
                  )
                ) : (
                  <View style={{ alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Ionicons name={fileIcon(state.previewSoporte.file_type)} size={48} color={fileColor(state.previewSoporte.file_type)} />
                    <Text style={{ fontFamily: typography.fontFamily, fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
                      Vista previa no disponible para este formato.
                    </Text>
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={{ flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' } as any}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                  }}
                  onPress={() => state.setPreviewSoporte(null)}
                >
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: 12, fontWeight: '600', color: '#475569' }}>
                    Cerrar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      window.open(toUrl(state.previewSoporte.file_url), '_blank');
                    }
                  }}
                >
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: 12, fontWeight: '600', color: '#ffffff' }}>
                    Ver original ↗
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  } as any,
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  } as any,
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#7c3aed',
  },
  tabTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: '#64748b',
    fontWeight: typography.weights.medium,
  },
  tabTxtActive: {
    color: '#7c3aed',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  } as any,
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    height: 40,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  } as any,
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    outlineStyle: 'none',
  } as any,
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  } as any,
  progressLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  progressTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  progressSubtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  progressLineBg: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden' as any,
  },
  progressLineFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 3,
  },
  progressRight: {
    width: 56,
    height: 56,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pctOverlay: {
    position: 'absolute',
  },
  pctText: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: spacing.xs,
  },
  emptyBox: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  emptyTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  accionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden' as any,
  },
  accionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  } as any,
  accionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accionMeta: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  accionName: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  accionDesc: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  accionDate: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  accionRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    fontWeight: '700',
  },
  accionBody: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: spacing.md,
  },
  evCountTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: spacing.sm,
  },
  evidenceCarousel: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  carouselCard: {
    width: 100,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
    alignItems: 'center',
    gap: 4,
  },
  carouselThumbnail: {
    width: 84,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden' as any,
    backgroundColor: '#fff',
  },
  carouselImg: {
    width: '100%',
    height: '100%',
  },
  carouselDocIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselEmptyThumbnail: {
    width: 84,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed' as any,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: '#334155',
    width: '100%',
    textAlign: 'center',
  },
  carouselStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  } as any,
  carouselStatusTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    fontWeight: '700',
  },
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.md,
    gap: spacing.md,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sheetTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  sheetSubtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  sheetCloseBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginTop: spacing.xs,
  },
  sheetCloseTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  addEvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f5f3ff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  addEvBtnTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#7c3aed',
  },
  folderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  folderPillActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  folderPillTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  folderPillTxtActive: {
    color: '#ffffff',
  },
  labelField: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    color: '#344054',
    marginBottom: 4,
  },
  textInputField: {
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: '#1d2939',
    backgroundColor: '#ffffff',
    marginBottom: spacing.sm,
    height: 40,
  },
  sheetSubmitBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    marginTop: spacing.xs,
  },
  sheetSubmitTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
