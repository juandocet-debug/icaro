import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/constants/colors';
import { typography } from '../../../../shared/constants/typography';
import { styles } from './MisActividadesStyles';

import { env } from '../../../../config/env';

const toUrl = (url: string) => {
  const API_BASE = env.apiUrl;
  return url?.startsWith('http') ? url : `${API_BASE}${url}`;
};

/** Genera URL de thumbnail Cloudinary 160x160 c_fill para carga rápida en grilla */
const cloudinaryThumb = (url: string): string => {
  if (!url) return url;
  const fullUrl = toUrl(url);
  // Solo transforma URLs de Cloudinary
  if (!fullUrl.includes('res.cloudinary.com')) return fullUrl;
  // Inserta transformaciones antes de /upload/
  return fullUrl.replace('/upload/', '/upload/c_fill,w_160,h_160,q_auto,f_auto/');
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

interface RequisitosListProps {
  requisitosEvidenciaActiva: any[];
  reqsCompletadosActiveEv: number;
  canEditActiveEv: boolean;
  soporteReqId: string | number;
  setSoporteReqId: (id: any) => void;
  previewSoporte: any;
  setPreviewSoporte: (file: any) => void;
  handleDeleteSoporte: (id: any) => void;
}

export const RequisitosList: React.FC<RequisitosListProps> = ({
  requisitosEvidenciaActiva,
  reqsCompletadosActiveEv,
  canEditActiveEv,
  soporteReqId,
  setSoporteReqId,
  previewSoporte,
  setPreviewSoporte,
  handleDeleteSoporte,
}) => {
  return (
    <View>
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
                  {req.archivos_cargados} de {req.min_archivos}{req.max_archivos && req.max_archivos !== req.min_archivos ? ` (máx. ${req.max_archivos})` : ''}
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
                        <Image 
                          source={{ uri: cloudinaryThumb(file.file_url) }} 
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
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
    </View>
  );
};
