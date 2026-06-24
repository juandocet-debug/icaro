import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ActivityIndicator, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { Accion, RequisitoVerificacion } from '../domain/Accion';
import { subirEvidenciaUseCase } from '../../../shared/dependencies';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubida: () => void;
  accion: Accion;
}

const MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/msword': 'DOC',
};

const ESTADO_COLOR: Record<string, string> = {
  completo: colors.success,
  incompleto: '#f59e0b',
  pendiente: colors.textSecondary,
  sin_requisitos: colors.textSecondary,
};

function tiposLabel(tipos: string[]) {
  return tipos.map(t => MIME_LABELS[t] ?? t).join(', ');
}

function mimeAccept(tipos: string[]) {
  return tipos.join(',');
}

export const EvidenciaModal: React.FC<Props> = ({ visible, onClose, onSubida, accion }) => {
  const requisitos = accion.requisitosVerificacion ?? [];
  const tieneRequisitos = requisitos.length > 0;

  const [requisito, setRequisito] = useState<RequisitoVerificacion | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const reset = () => {
    setRequisito(null);
    setArchivo(null);
    setNombreArchivo('');
    setError(null);
    setExito(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const seleccionarArchivo = () => {
    if (Platform.OS !== 'web') {
      setError('La carga de archivos solo está disponible en la versión web.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    if (tieneRequisitos && requisito) {
      input.accept = mimeAccept(requisito.tipos_archivo_permitidos);
    }
    input.onchange = (e: Event) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) {
        setArchivo(f);
        setNombreArchivo(f.name);
        setError(null);
      }
    };
    input.click();
  };

  const subir = async () => {
    if (!archivo) { setError('Seleccione un archivo.'); return; }
    if (tieneRequisitos && !requisito) { setError('Seleccione un requisito.'); return; }

    setLoading(true);
    setError(null);
    try {
      await subirEvidenciaUseCase.ejecutar(accion.id, archivo, requisito?.id);
      setExito(true);
      onSubida();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.errores?.length) {
        setError(data.errores.join(' · '));
      } else {
        setError(data?.error ?? 'Error al subir el archivo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Cargar evidencia</Text>
            <TouchableOpacity onPress={handleClose} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.accionNombre} numberOfLines={2}>{accion.nombre}</Text>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Resumen de cumplimiento */}
            {accion.resumenVerificacion && tieneRequisitos && (
              <View style={[styles.resumenBox, { borderColor: ESTADO_COLOR[accion.resumenVerificacion.estado] }]}>
                <Text style={[styles.resumenTxt, { color: ESTADO_COLOR[accion.resumenVerificacion.estado] }]}>
                  {accion.resumenVerificacion.requisitos_cumplidos}/{accion.resumenVerificacion.total_requisitos} requisitos cumplidos
                  {' · '}{accion.resumenVerificacion.estado === 'completo' ? 'Verificación completa' :
                    accion.resumenVerificacion.estado === 'incompleto' ? 'Verificación incompleta' : 'Verificación pendiente'}
                </Text>
              </View>
            )}

            {/* Selector de requisito */}
            {tieneRequisitos && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Requisito *</Text>
                {requisitos.map(req => {
                  const sel = requisito?.id === req.id;
                  const cumplido = req.cumplido ?? false;
                  const cargados = req.archivos_cargados ?? 0;
                  return (
                    <TouchableOpacity
                      key={req.id ?? req.nombre}
                      style={[styles.reqRow, sel && styles.reqRowSel]}
                      onPress={() => { setRequisito(req); setArchivo(null); setNombreArchivo(''); setError(null); }}
                    >
                      <View style={styles.reqRowContent}>
                        <View style={styles.reqRowLeft}>
                          <Text style={[styles.reqNombre, sel && styles.reqNombreSel]}>{req.nombre}</Text>
                          <Text style={styles.reqMeta}>
                            {tiposLabel(req.tipos_archivo_permitidos)} · {req.min_archivos}
                            {req.max_archivos ? `–${req.max_archivos}` : '+'} archivo(s)
                          </Text>
                        </View>
                        <View style={[styles.reqBadge, { backgroundColor: cumplido ? colors.success + '20' : colors.border }]}>
                          <Text style={[styles.reqBadgeTxt, { color: cumplido ? colors.success : colors.textSecondary }]}>
                            {cargados}/{req.max_archivos ?? req.min_archivos}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Tipos permitidos del requisito seleccionado */}
            {tieneRequisitos && requisito && (
              <View style={styles.hint}>
                <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
                <Text style={styles.hintTxt}>
                  Tipos permitidos: {tiposLabel(requisito.tipos_archivo_permitidos)}
                </Text>
              </View>
            )}

            {!tieneRequisitos && (
              <View style={styles.hint}>
                <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.hintTxt}>Esta acción acepta cualquier evidencia libre.</Text>
              </View>
            )}

            {/* Selector de archivo */}
            {(!tieneRequisitos || !!requisito) && (
              <TouchableOpacity style={styles.fileBtn} onPress={seleccionarArchivo} activeOpacity={0.7}>
                <Ionicons name="attach-outline" size={18} color={colors.primary} />
                <Text style={styles.fileBtnTxt} numberOfLines={1}>
                  {nombreArchivo || 'Seleccionar archivo...'}
                </Text>
              </TouchableOpacity>
            )}

            {error && <ErrorMessage message={error} />}

            {exito && (
              <View style={styles.exitoBox}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.exitoTxt}>Evidencia cargada correctamente.</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button label="Cancelar" variant="secondary" size="sm" onPress={handleClose} style={styles.btnCancel} />
            {!exito && (
              loading
                ? <ActivityIndicator color={colors.primary} />
                : <Button label="Subir evidencia" size="sm" onPress={subir} disabled={!archivo} />
            )}
            {exito && (
              <Button label="Subir otra" size="sm" onPress={reset} />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 420,
    maxHeight: '85%' as any,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  } as any,
  title: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  accionNombre: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  body: { flex: 1, maxHeight: 400 },
  resumenBox: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: spacing.md,
  },
  resumenTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.medium,
  },
  section: { marginBottom: spacing.md },
  sectionLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase' as any,
    marginBottom: 6,
  },
  reqRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: 6,
  },
  reqRowSel: { borderColor: colors.primary, backgroundColor: colors.primary + '0a' },
  reqRowContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as any,
  reqRowLeft: { flex: 1 },
  reqNombre: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  reqNombreSel: { color: colors.primary, fontWeight: typography.weights.bold },
  reqMeta: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reqBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  reqBadgeTxt: { fontFamily: typography.fontFamily, fontSize: 11, fontWeight: typography.weights.bold },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: spacing.md,
  } as any,
  hintTxt: { fontFamily: typography.fontFamily, fontSize: 12, color: colors.textSecondary, flex: 1 },
  fileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed' as any,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  } as any,
  fileBtnTxt: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.primary,
    flex: 1,
  },
  errorMsg: { marginBottom: spacing.sm },
  exitoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success + '15',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  } as any,
  exitoTxt: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.success,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  } as any,
  btnCancel: { marginRight: 'auto' as any },
});
