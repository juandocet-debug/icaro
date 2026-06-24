import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/constants/colors';
import { typography } from '../../../../shared/constants/typography';
import { styles } from './MisActividadesStyles';
import { Button } from '../../../../shared/components/Button';

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

interface UploadActionsPanelProps {
  activeEv: any;
  requisitosEvidenciaActiva: any[];
  soporteReqId: string | number;
  setSoporteReqId: (val: any) => void;
  soporteFile: File | null;
  setSoporteFile: (file: File | null) => void;
  soporteFileName: string;
  setSoporteFileName: (name: string) => void;
  soporteSaving: boolean;
  soporteErr: string | null;
  handleGuardarSoporte: () => void;
  reqsCompletadosActiveEv: number;
  setShowConfirmSend: (show: boolean) => void;
}

export const UploadActionsPanel: React.FC<UploadActionsPanelProps> = ({
  activeEv,
  requisitosEvidenciaActiva,
  soporteReqId,
  setSoporteReqId,
  soporteFile,
  setSoporteFile,
  soporteFileName,
  setSoporteFileName,
  soporteSaving,
  soporteErr,
  handleGuardarSoporte,
  reqsCompletadosActiveEv,
  setShowConfirmSend,
}) => {
  const handleFilePick = () => {
    if (Platform.OS === 'web') {
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
    }
  };

  const isBorrador = activeEv.estado === 'borrador' || activeEv.estado === 'reabierta';

  if (!isBorrador) {
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
