import React from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
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

interface ReviewActionsPanelProps {
  selectedAct: any;
  activeEv: any;
  reviewObs: string;
  setReviewObs: (val: string) => void;
  reviewErr: string | null;
  reviewSaving: boolean;
  handleReviewEvidencia: (status: string) => void;
  handleReabrirEvidencia: () => void;
}

export const ReviewActionsPanel: React.FC<ReviewActionsPanelProps> = ({
  selectedAct,
  activeEv,
  reviewObs,
  setReviewObs,
  reviewErr,
  reviewSaving,
  handleReviewEvidencia,
  handleReabrirEvidencia,
}) => {
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

  return null;
};
