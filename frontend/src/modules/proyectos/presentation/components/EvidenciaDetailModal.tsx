import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/constants/colors';
import { typography } from '../../../../shared/constants/typography';
import { styles } from './MisActividadesStyles';
import { RequisitosList } from './RequisitosList';
import { SoportePreview } from './SoportePreview';
import { ReviewActionsPanel } from './ReviewActionsPanel';
import { UploadActionsPanel } from './UploadActionsPanel';

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

  const [showConfirmSend, setShowConfirmSend] = useState(false);

  const { mi_asignacion } = selectedAct;
  const isOwner = activeEv.creada_por?.id === mi_asignacion?.usuario_id || !selectedAct.es_gestor;
  const canEditActiveEv = isOwner && (activeEv.estado === 'borrador' || activeEv.estado === 'reabierta');

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

      <RequisitosList
        requisitosEvidenciaActiva={requisitosEvidenciaActiva}
        reqsCompletadosActiveEv={reqsCompletadosActiveEv}
        canEditActiveEv={canEditActiveEv}
        soporteReqId={soporteReqId}
        setSoporteReqId={setSoporteReqId}
        previewSoporte={previewSoporte}
        setPreviewSoporte={setPreviewSoporte}
        handleDeleteSoporte={handleDeleteSoporte}
      />

      <SoportePreview
        previewSoporte={previewSoporte}
        setPreviewSoporte={setPreviewSoporte}
        canEditActiveEv={canEditActiveEv}
        handleDeleteSoporte={handleDeleteSoporte}
      />
    </ScrollView>
  );

  const renderRight = () => {
    if (selectedAct.es_gestor) {
      return (
        <ReviewActionsPanel
          selectedAct={selectedAct}
          activeEv={activeEv}
          reviewObs={reviewObs}
          setReviewObs={setReviewObs}
          reviewErr={reviewErr}
          reviewSaving={reviewSaving}
          handleReviewEvidencia={handleReviewEvidencia}
          handleReabrirEvidencia={handleReabrirEvidencia}
        />
      );
    }

    return (
      <UploadActionsPanel
        activeEv={activeEv}
        requisitosEvidenciaActiva={requisitosEvidenciaActiva}
        soporteReqId={soporteReqId}
        setSoporteReqId={setSoporteReqId}
        soporteFile={soporteFile}
        setSoporteFile={setSoporteFile}
        soporteFileName={soporteFileName}
        setSoporteFileName={setSoporteFileName}
        soporteSaving={soporteSaving}
        soporteErr={soporteErr}
        handleGuardarSoporte={handleGuardarSoporte}
        reqsCompletadosActiveEv={reqsCompletadosActiveEv}
        setShowConfirmSend={setShowConfirmSend}
      />
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
