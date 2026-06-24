import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { ResumenVerificacion } from '../domain/Accion';

type NodeKind = 'meta' | 'componente' | 'accion';

interface Props {
  kind: NodeKind;
  title: string;
  subtitle?: string | null;
  badge?: string;
  counter?: number;
  expanded?: boolean;
  onToggle?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  onEvidencia?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  // Solo para acciones
  ejecucion?: number;
  proyeccion?: number | null;
  unidad?: string | null;
  avancePorcentaje?: number | null;
  numRequisitos?: number;
  resumenVerificacion?: ResumenVerificacion | null;
  responsables?: { id: string; username: string; nombreCompleto: string; fotoUrl?: string | null }[];
  onManageResponsibles?: () => void;
}

const ESTADO_COLOR: Record<string, string> = {
  completo: colors.success,
  incompleto: '#f59e0b',
  pendiente: colors.textSecondary,
  sin_requisitos: colors.textSecondary,
};

const ESTADO_LABEL: Record<string, string> = {
  completo: 'Verificación completa',
  incompleto: 'Verificación incompleta',
  pendiente: 'Verificación pendiente',
  sin_requisitos: '',
};

export const MetaMapNode: React.FC<Props> = ({
  kind, title, subtitle, badge, counter, expanded, onToggle, onAdd, addLabel,
  onEvidencia, onEdit, onDelete, ejecucion, proyeccion, unidad, avancePorcentaje, numRequisitos,
  resumenVerificacion, responsables, onManageResponsibles,
}) => {
  const pct = avancePorcentaje != null
    ? Math.min(Math.round(avancePorcentaje), 100)
    : proyeccion && proyeccion > 0
      ? Math.min(Math.round(((ejecucion ?? 0) / proyeccion) * 100), 100)
      : null;

  const borderColor = kind === 'meta' ? colors.primary
    : kind === 'componente' ? colors.primaryDark
    : colors.success;

  const kindLabel = kind === 'meta' ? 'Meta'
    : kind === 'componente' ? 'Componente'
    : 'Acción';

  const kindIcon = kind === 'meta' ? 'flag-outline'
    : kind === 'componente' ? 'folder-open-outline'
    : 'checkmark-circle-outline';

  // Determinación de la acción principal del botón tipo píldora
  const hasPillButton = !!onAdd || !!onEvidencia;
  const pillAction = onAdd ?? onEvidencia;
  const pillLabel = onAdd ? (addLabel ?? '+ Agregar') : 'Evidencia';

  return (
    <View style={[styles.card, { borderTopColor: borderColor }]}>
      {/* Header Row */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: borderColor + '12', borderColor: borderColor + '30' }]}>
          <Ionicons name={kindIcon as any} size={11} color={borderColor} style={{ marginRight: 4 }} />
          <Text style={[styles.badgeTxt, { color: borderColor }]}>{badge || kindLabel}</Text>
        </View>

        <View style={styles.headerActions}>
          {onEdit && (
            <TouchableOpacity style={styles.actionIconBtn} onPress={onEdit} accessibilityLabel="Editar">
              <Ionicons name="pencil-outline" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionIconBtn} onPress={onDelete} accessibilityLabel="Eliminar">
              <Ionicons name="trash-outline" size={14} color={colors.error + 'D0'} />
            </TouchableOpacity>
          )}
          {onToggle && (
            <TouchableOpacity style={styles.toggleBtn} onPress={onToggle} accessibilityLabel={expanded ? 'Colapsar' : 'Expandir'}>
              <Ionicons name={expanded ? 'remove-outline' : 'add-outline'} size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Body Section */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={3}>
          {subtitle || 'Sin descripción disponible para este elemento.'}
        </Text>

        {/* Progreso para acciones */}
        {kind === 'accion' && (
          <View style={styles.progContainer}>
            {pct !== null ? (
              <>
                <View style={styles.progBg}>
                  <View style={[styles.progFill, { width: `${pct}%` as any, backgroundColor: borderColor }]} />
                </View>
                <Text style={styles.progTxt}>
                  {ejecucion ?? 0} / {proyeccion} {unidad} · {pct}%
                </Text>
              </>
            ) : (
              <Text style={styles.sinProy}>Sin proyección cargada</Text>
            )}
            {resumenVerificacion && resumenVerificacion.total_requisitos > 0 ? (
              <View style={styles.resumenRow}>
                <View style={[styles.resumenDot, { backgroundColor: ESTADO_COLOR[resumenVerificacion.estado] }]} />
                <Text style={[styles.resumenTxt, { color: ESTADO_COLOR[resumenVerificacion.estado] }]}>
                  {resumenVerificacion.requisitos_cumplidos}/{resumenVerificacion.total_requisitos}
                  {' '}{ESTADO_LABEL[resumenVerificacion.estado]}
                </Text>
              </View>
            ) : numRequisitos != null && numRequisitos > 0 ? (
              <Text style={styles.reqCount}>{numRequisitos} requisito{numRequisitos !== 1 ? 's' : ''}</Text>
            ) : null}
          </View>
        )}
      </View>

      {/* Footer Section */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {counter !== undefined ? (
            <View style={styles.counterContainer}>
              <Ionicons name="layers-outline" size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.counterTxt}>{counter} {kind === 'meta' ? 'componentes' : 'acciones'}</Text>
            </View>
          ) : (
            <View style={styles.statusDotRow}>
              <View style={[styles.statusDot, { backgroundColor: borderColor }]} />
              <Text style={styles.statusTxt}>{kindLabel}</Text>

              {/* Avatares y botón de gestión inline si es acción */}
              {kind === 'accion' && (
                <View style={styles.responsablesInlineRow}>
                  <View style={styles.avatarPile}>
                    {responsables?.slice(0, 3).map((resp, idx) => (
                      <View key={resp.id} style={[styles.avatarCircle, { marginLeft: idx > 0 ? -6 : 0 }]}>
                        {resp.fotoUrl ? (
                          <Image source={{ uri: resp.fotoUrl }} style={styles.avatarImage} />
                        ) : (
                          <Text style={styles.avatarInitials}>
                            {(resp.nombreCompleto || resp.username).substring(0, 2).toUpperCase()}
                          </Text>
                        )}
                      </View>
                    ))}
                    {responsables && responsables.length > 3 && (
                      <View style={[styles.avatarCircle, styles.avatarMore, { marginLeft: -6 }]}>
                        <Text style={styles.avatarMoreText}>+{responsables.length - 3}</Text>
                      </View>
                    )}
                  </View>
                  {onManageResponsibles && (
                    <TouchableOpacity style={styles.manageRespBtn} onPress={onManageResponsibles} accessibilityLabel="Gestionar responsables">
                      <Ionicons name="people-outline" size={13} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {hasPillButton && pillAction && (
          <TouchableOpacity style={styles.pillButton} onPress={pillAction}>
            <Text style={styles.pillButtonText}>{pillLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const NODE_WIDTH = 240;

const styles = StyleSheet.create({
  card: {
    width: NODE_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    padding: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 135,
  } as any,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  } as any,
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
  } as any,
  badgeTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase' as any,
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as any,
  actionIconBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  toggleBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  body: {
    flex: 1,
    marginBottom: 8,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 13,
  },
  progContainer: {
    marginTop: 8,
  },
  progBg: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden' as any,
    marginBottom: 4,
  },
  progFill: {
    height: '100%',
    borderRadius: 2,
  },
  progTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    color: colors.textSecondary,
  },
  sinProy: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  reqCount: {
    fontFamily: typography.fontFamily,
    fontSize: 8.5,
    color: colors.textSecondary,
    marginTop: 3,
  },
  resumenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  } as any,
  resumenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  resumenTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 8.5,
    fontWeight: typography.weights.medium,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 2,
  } as any,
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  } as any,
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  } as any,
  counterTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    color: colors.textSecondary,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  } as any,
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  statusTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    color: colors.textSecondary,
  },
  pillButton: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillButtonText: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
  },
  responsablesInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    gap: 4,
  } as any,
  avatarPile: {
    flexDirection: 'row',
    alignItems: 'center',
  } as any,
  avatarCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    overflow: 'hidden' as any,
  } as any,
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontFamily: typography.fontFamily,
    fontSize: 7,
    fontWeight: typography.weights.bold,
    color: '#334155',
  },
  avatarMore: {
    backgroundColor: '#94a3b8',
  },
  avatarMoreText: {
    fontFamily: typography.fontFamily,
    fontSize: 6.5,
    fontWeight: typography.weights.bold,
    color: '#ffffff',
  },
  manageRespBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
});
