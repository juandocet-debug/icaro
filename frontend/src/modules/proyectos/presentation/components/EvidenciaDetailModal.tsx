import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/constants/colors';
import { typography } from '../../../../shared/constants/typography';
import { styles } from './MisActividadesStyles';
import { Button } from '../../../../shared/components/Button';

const toUrl = (url: string) => {
  const API_BASE = (process.env as any).EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
  return url?.startsWith('http') ? url : `${API_BASE}${url}`;
};

const fileIcon = (t: string): any =>
  t?.startsWith('image/') ? 'image-outline'
  : t === 'application/pdf' ? 'document-text-outline'
  : t?.includes('spreadsheetml') ? 'grid-outline' : 'document-outline';

const fileColor = (t: string) =>
  t?.startsWith('image/') ? '#10b981' : t === 'application/pdf' ? '#ef4444' : colors.primary;

const MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/msword': 'DOC',
};

function tiposLabel(tipos: string[]) {
  if (!tipos || tipos.length === 0) return 'Cualquier formato';
  return tipos.map(t => MIME_LABELS[t] ?? t.split('/').pop()?.toUpperCase() ?? t).join(', ');
}

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

export const EvidenciaDetailModal = ({
  activeEvId, setActiveEvId, activeEv, selectedAct, requisitosEvidenciaActiva, reqsCompletadosActiveEv,
  previewSoporte, setPreviewSoporte, handleDeleteSoporte, setSoporteReqId,
  soporteReqId, soporteFile, setSoporteFile, soporteFileName, setSoporteFileName,
  soporteObs, setSoporteObs, handleGuardarSoporte, soporteSaving, soporteErr, handleEnviarEvidencia,
  reviewObs, setReviewObs, handleReviewEvidencia, reviewSaving, reviewErr, handleReabrirEvidencia
}: any) => {

  if (!activeEvId || !activeEv || !selectedAct) return null;

  const [showConfirmSend, setShowConfirmSend] = React.useState(false);

  const [zoomScale, setZoomScale] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const isDragging = React.useRef(false);
  const dragStart = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
  }, [previewSoporte]);

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

  const renderConfirmSendModal = () => (
    <Modal visible={showConfirmSend} transparent animationType="fade" onRequestClose={() => setShowConfirmSend(false)}>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}>
        <View style={{
          width: 360,
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 24,
          alignItems: 'center',
          shadowColor: '#090d16',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 6,
        }}>
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: '#fff7ed',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#ffedd5',
          }}>
            <Ionicons name="alert-circle" size={28} color="#ea580c" />
          </View>

          <Text style={{
            fontFamily: typography.fontFamily,
            fontSize: 16,
            fontWeight: '700',
            color: colors.textPrimary,
            textAlign: 'center',
            marginBottom: 8,
          }}>
            ¿Enviar evidencia a revisión?
          </Text>

          <Text style={{
            fontFamily: typography.fontFamily,
            fontSize: 12,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 18,
            marginBottom: 24,
          }}>
            Una vez enviada, la evidencia quedará bloqueada en revisión. <Text style={{ fontWeight: 'bold', color: colors.textPrimary }}>No podrás eliminar ni editar</Text> ningún soporte de archivo. Si requieres hacer cambios, deberás solicitar autorización a tu coordinador para que la reabra.
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, width: '100%' } as any}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                backgroundColor: colors.surface,
              }}
              onPress={() => setShowConfirmSend(false)}
            >
              <Text style={{ fontFamily: typography.fontFamily, fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
                Cancelar
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
              onPress={async () => {
                setShowConfirmSend(false);
                await handleEnviarEvidencia();
              }}
            >
              <Text style={{ fontFamily: typography.fontFamily, fontSize: 13, fontWeight: '600', color: '#ffffff' }}>
                Sí, enviar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const { mi_asignacion } = selectedAct;
  const isOwner = activeEv.creada_por?.id === mi_asignacion?.usuario_id || !selectedAct.es_gestor;
  const canEditActiveEv = isOwner && (activeEv.estado === 'borrador' || activeEv.estado === 'reabierta');

  const handleFilePick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf,.doc,.docx,.xls,.xlsx';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setSoporteFile(file);
        setSoporteFileName(file.name);
      }
    };
    input.click();
  };

  const renderLeft = () => (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <View style={styles.activeEvMetaBox}>
        <Text style={styles.activeEvMetaText}>
          Registrado por <Text style={{ fontWeight: 'bold' }}>{activeEv.creada_por?.nombre}</Text> · {activeEv.created_at}
        </Text>
        {activeEv.fecha_ejecucion && (
          <Text style={styles.activeEvMetaText}>
            Fecha ejecución: {activeEv.fecha_ejecucion} {activeEv.cantidad_ejecutada > 0 ? `· Cantidad: ${activeEv.cantidad_ejecutada}` : ''}
          </Text>
        )}
        {!!activeEv.observacion_coordinador && (
          <View style={styles.activeEvObsBox}>
            <Text style={styles.activeEvObsTitle}>Observación de Coordinación:</Text>
            <Text style={styles.activeEvObsText}>{activeEv.observacion_coordinador}</Text>
          </View>
        )}
      </View>

      <View style={styles.reqHeaderRow}>
        <Text style={styles.sectionTitle}>Evidencias requeridas</Text>
        <Text style={styles.reqCountBadge}>{reqsCompletadosActiveEv}/{requisitosEvidenciaActiva.length} completadas</Text>
      </View>

      <View style={{ gap: 16 }}>
        {requisitosEvidenciaActiva.map((req: any) => {
          const cumplido = req.cumplido;
          return (
            <View key={req.id} style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: cumplido ? colors.success + '40' : colors.border,
              padding: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.02,
              shadowRadius: 4,
              elevation: 1,
            }}>
              {/* Requirement Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 } as any}>
                  <Ionicons 
                    name={cumplido ? "checkmark-circle" : "ellipse-outline"} 
                    size={16} 
                    color={cumplido ? colors.success : colors.textSecondary} 
                  />
                  <Text style={{ fontFamily: typography.fontFamily, fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                    {req.nombre}
                  </Text>
                  {req.obligatorio && (
                    <Text style={{ fontSize: 9, color: '#ef4444', fontWeight: 'bold', backgroundColor: '#fef2f2', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                      Obligatorio
                    </Text>
                  )}
                </View>
                <Text style={{ fontFamily: typography.fontFamily, fontSize: 11, fontWeight: '700', color: cumplido ? colors.success : '#f59e0b' }}>
                  {req.archivos_cargados} de {req.max_archivos ?? req.min_archivos}
                </Text>
              </View>

              {/* Requirement description / help text */}
              <Text style={{ fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary, marginBottom: 10 }}>
                Formatos: {tiposLabel(req.tipos_archivo_permitidos)}
              </Text>

              {/* Files list side-by-side + Cargar button */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' } as any}>
                {/* Uploaded files for this requirement */}
                {(req.evidencias || []).map((file: any) => {
                  const isPreview = previewSoporte?.id === file.id;
                  return (
                    <TouchableOpacity
                      key={file.id}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: isPreview ? colors.primary : colors.border,
                        overflow: 'hidden',
                        backgroundColor: colors.background,
                        position: 'relative',
                      }}
                      onPress={() => setPreviewSoporte(file)}
                    >
                      {file.file_type?.startsWith('image/') ? (
                        <Image source={{ uri: toUrl(file.file_url) }} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name={fileIcon(file.file_type)} size={28} color={fileColor(file.file_type)} />
                          <Text style={{ fontSize: 8, fontFamily: typography.fontFamily, color: colors.textSecondary, marginTop: 2, textAlign: 'center', width: '90%' }} numberOfLines={1}>
                            {file.file_name}
                          </Text>
                        </View>
                      )}
                      
                      {/* Delete button directly on thumbnail if editable */}
                      {canEditActiveEv && (
                        <TouchableOpacity
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            width: 18,
                            height: 18,
                            borderRadius: 9,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 1,
                            elevation: 1,
                          }}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteSoporte(file.id);
                          }}
                        >
                          <Ionicons name="close-circle" size={14} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  );
                })}

                {/* Add/Upload button placeholder */}
                {canEditActiveEv && (!req.max_archivos || req.archivos_cargados < req.max_archivos) && (
                  <TouchableOpacity
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: soporteReqId === req.id ? colors.primary : '#cbd5e1',
                      borderStyle: 'dashed',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: soporteReqId === req.id ? `${colors.primary}05` : '#f8fafc',
                    }}
                    onPress={() => setSoporteReqId(req.id)}
                  >
                    <Ionicons name="add" size={24} color={soporteReqId === req.id ? colors.primary : '#64748b'} />
                    <Text style={{ fontSize: 8, fontFamily: typography.fontFamily, color: soporteReqId === req.id ? colors.primary : '#64748b', marginTop: 2, textAlign: 'center' }}>
                      Cargar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {previewSoporte && (
        <View style={styles.previewBox}>
          <View style={styles.previewHeaderRow}>
            <Text style={styles.sectionTitle}>Vista previa de la evidencia seleccionada</Text>
            <TouchableOpacity onPress={() => setPreviewSoporte(null)}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {previewSoporte.file_type?.startsWith('image/') ? (
            <View 
              style={{ width: '100%', height: 280, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 8, backgroundColor: '#f8fafc' }}
              {...(Platform.OS === 'web' ? {
                onWheel: handleWheel,
                onMouseDown: handleMouseDown,
                onMouseMove: handleMouseMove,
                onMouseUp: handleMouseUpOrLeave,
                onMouseLeave: handleMouseUpOrLeave,
              } : {})}
            >
              <Image 
                source={{ uri: toUrl(previewSoporte.file_url) }} 
                style={{
                  width: '100%',
                  height: 280,
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
            <View style={styles.previewIconBox}>
              <Ionicons name={fileIcon(previewSoporte.file_type)} size={48} color={fileColor(previewSoporte.file_type)} />
            </View>
          )}
          <View style={styles.previewFooter}>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewFileName} numberOfLines={1}>{previewSoporte.file_name}</Text>
              <Text style={styles.previewMetaText}>{previewSoporte.created_at}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 } as any}>
              {canEditActiveEv && (
                <TouchableOpacity
                  style={[styles.btnActionIcon, { borderColor: '#ef4444' }]}
                  onPress={() => handleDeleteSoporte(previewSoporte.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.btnOpenNewTab}
                onPress={() => { if (Platform.OS === 'web') (window as any).open(toUrl(previewSoporte.file_url), '_blank'); }}
              >
                <Text style={styles.btnOpenNewTabTxt}>Abrir en nueva pestaña ↗</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderRight = () => {
    if (selectedAct.es_gestor && (activeEv.estado === 'aprobada' || activeEv.estado === 'observada')) {
      return (
        <View style={[styles.panelDerechoScroll, { padding: 16 }]}>
          <Text style={styles.uploadPanelTitle}>Revisión de evidencia</Text>
          <View style={styles.reviewStatusBox}>
            <Text style={styles.reviewStatusLabel}>ESTADO DE LA EVIDENCIA</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 } as any}>
              <View style={[styles.statusDot, { backgroundColor: estadoColor(activeEv.estado) }]} />
              <Text style={[styles.reviewStatusVal, { color: estadoColor(activeEv.estado) }]}>{estadoLabel(activeEv.estado)}</Text>
            </View>
          </View>
          <Button
            label="Habilitar edición (Reabrir)"
            onPress={handleReabrirEvidencia}
            style={{ backgroundColor: '#6366f1', marginTop: 16 }}
          />
        </View>
      );
    }

    if (selectedAct.es_gestor && activeEv.estado === 'enviada') {
      return (
        <ScrollView style={styles.panelDerechoScroll} contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.uploadPanelTitle}>Revisión de evidencia</Text>
          <View style={styles.reviewStatusBox}>
            <Text style={styles.reviewStatusLabel}>ESTADO ACTUAL</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 } as any}>
              <View style={[styles.statusDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={[styles.reviewStatusVal, { color: '#f59e0b' }]}>Enviada a revisión</Text>
            </View>
          </View>
          <Text style={styles.formLabel}>Observación (Opcional si se aprueba, obligatoria si se observa)</Text>
          {Platform.OS === 'web' ? (
            <textarea
              style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 8, borderColor: colors.border, marginBottom: 16, fontFamily: typography.fontFamily, fontSize: 14 }}
              value={reviewObs}
              onChange={(e: any) => setReviewObs(e.target.value)}
              placeholder="Escribe el motivo del rechazo o comentarios..."
            />
          ) : null}
          {!!reviewErr && <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 16 }}>{reviewErr}</Text>}
          <Button
            label={reviewSaving ? 'Guardando...' : 'Aprobar Evidencia'}
            onPress={() => handleReviewEvidencia('aprobar')}
            disabled={reviewSaving}
            style={{ backgroundColor: colors.success, marginBottom: 8 }}
          />
          <Button
            label={reviewSaving ? 'Guardando...' : 'Observar (Devolver)'}
            onPress={() => handleReviewEvidencia('observar')}
            disabled={reviewSaving || !reviewObs.trim()}
            style={{ backgroundColor: '#ef4444' }}
          />
        </ScrollView>
      );
    }

    if (activeEv.estado !== 'borrador' && activeEv.estado !== 'reabierta') {
      return (
        <View style={[styles.panelDerechoScroll, { padding: 16 }]}>
          <Text style={styles.uploadPanelTitle}>Carga de evidencia</Text>
          <View style={styles.reviewStatusBox}>
            <Text style={styles.reviewStatusLabel}>ESTADO DE LA EVIDENCIA</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 } as any}>
              <View style={[styles.statusDot, { backgroundColor: estadoColor(activeEv.estado) }]} />
              <Text style={[styles.reviewStatusVal, { color: estadoColor(activeEv.estado) }]}>{estadoLabel(activeEv.estado)}</Text>
            </View>
          </View>
          <Text style={{ fontFamily: typography.fontFamily, fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
            Esta evidencia ya fue enviada a revisión y no puede ser modificada.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.panelDerechoScroll} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.uploadPanelTitle}>Carga de evidencia</Text>
        <Text style={styles.formLabel}>Requisito a cargar *</Text>
        <View style={styles.pickerWrapper}>
          {Platform.OS === 'web' ? (
            <select
              style={styles.htmlSelect}
              value={soporteReqId}
              onChange={(e: any) => setSoporteReqId(e.target.value)}
            >
              <option value="">Selecciona el requisito...</option>
              {requisitosEvidenciaActiva.map((r: any) => (
                <option key={r.id} value={r.id}>{r.nombre} {!r.cumplido ? '(Falta)' : ''}</option>
              ))}
            </select>
          ) : null}
        </View>

        {soporteReqId && Platform.OS === 'web' && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.formLabel}>Archivo / Foto *</Text>
            <TouchableOpacity
              style={{ width: '100%', height: 160, borderRadius: 12, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed', backgroundColor: `${colors.primary}05`, alignItems: 'center', justifyContent: 'center', padding: 8, overflow: 'hidden' } as any}
              onPress={handleFilePick}
            >
              {soporteFile && (() => {
                const ext = soporteFileName?.split('.').pop()?.toLowerCase();
                const isImage = (soporteFile.type && soporteFile.type.startsWith('image/')) || 
                  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif', 'bmp'].includes(ext || '');
                return isImage;
              })() ? (
                <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <Image
                    source={{ uri: URL.createObjectURL(soporteFile) }}
                    style={{ width: '100%', height: '100%', borderRadius: 8 }}
                    resizeMode="contain"
                  />
                  <View style={{ position: 'absolute', bottom: 4, left: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 }}>
                    <Text style={{ fontFamily: typography.fontFamily, fontSize: 10, color: '#fff', textAlign: 'center' }} numberOfLines={1}>
                      {soporteFileName}
                    </Text>
                  </View>
                </View>
              ) : (
                <>
                  <Ionicons name="camera" size={32} color={colors.primary} style={{ marginBottom: 8 }} />
                  {soporteFileName ? (
                    <Text style={{ fontFamily: typography.fontFamily, fontSize: 13, color: colors.textPrimary, textAlign: 'center', fontWeight: 'bold' }}>{soporteFileName}</Text>
                  ) : (
                    <>
                      <Text style={{ fontFamily: typography.fontFamily, fontSize: 13, color: colors.primary, fontWeight: 'bold' }}>Haz clic aquí para seleccionar</Text>
                      <Text style={{ fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>JPG, PNG, PDF, Excel (Máx. 10MB)</Text>
                    </>
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {!!soporteErr && <Text style={{ color: '#ef4444', fontSize: 12, marginBottom: 16 }}>{soporteErr}</Text>}

        <Button
          label={soporteSaving ? 'Subiendo...' : 'Subir archivo'}
          onPress={handleGuardarSoporte}
          loading={soporteSaving}
          disabled={!soporteReqId || !soporteFile || soporteSaving}
          style={{ backgroundColor: colors.primary, marginBottom: 24 }}
        />

        <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 24 }} />

        <View style={styles.reviewStatusBox}>
          <Text style={styles.reviewStatusLabel}>ESTADO DE LA EVIDENCIA</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 } as any}>
            <View style={[styles.statusDot, { backgroundColor: estadoColor(activeEv.estado) }]} />
            <Text style={[styles.reviewStatusVal, { color: estadoColor(activeEv.estado) }]}>{estadoLabel(activeEv.estado)}</Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.infoTxt}>Cuando completes todas las evidencias, haz clic en el botón de abajo para enviar la ejecución al coordinador.</Text>
        </View>

        <Button
          label="Enviar Evidencia a Revisión"
          onPress={() => setShowConfirmSend(true)}
          disabled={reqsCompletadosActiveEv < requisitosEvidenciaActiva.length}
          style={{ backgroundColor: colors.primary, marginTop: 16 }}
        />

        {reqsCompletadosActiveEv < requisitosEvidenciaActiva.length && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#fff7ed',
            borderRadius: 8,
            padding: 10,
            marginTop: 12,
            borderWidth: 1,
            borderColor: '#ffedd5',
          } as any}>
            <Ionicons name="warning" size={16} color="#c2410c" />
            <Text style={{
              fontFamily: typography.fontFamily,
              fontSize: 11,
              color: '#c2410c',
              flex: 1,
              lineHeight: 14,
            }}>
              Para enviar, completa todos los requisitos obligatorios a la izquierda (tienes {reqsCompletadosActiveEv} de {requisitosEvidenciaActiva.length} completados).
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <>
      <Modal visible={!!activeEvId && !!activeEv} transparent animationType="slide" onRequestClose={() => setActiveEvId(null)}>
        <View style={styles.modalOverlayDark}>
          <View style={styles.modalLarge}>
            <View style={styles.modalLargeHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 } as any}>
                <Ionicons name="folder-open" size={24} color={colors.primary} />
                <Text style={styles.modalTitle}>{activeEv.nombre}</Text>
                <View style={[styles.badge, { backgroundColor: estadoColor(activeEv.estado) + '15' }]}>
                  <Text style={[styles.badgeTxt, { color: estadoColor(activeEv.estado) }]}>{estadoLabel(activeEv.estado)}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setActiveEvId(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalLargeBody}>
              <View style={styles.modalLargeLeft}>{renderLeft()}</View>
              <View style={styles.modalLargeRight}>{renderRight()}</View>
            </View>
          </View>
        </View>
      </Modal>
      {renderConfirmSendModal()}
    </>
  );
};
