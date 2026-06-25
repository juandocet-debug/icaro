/**
 * MemberDetailModal
 * Modal de detalle de un miembro del proyecto: muestra sus roles
 * y permite editar/retirar roles o al miembro del proyecto.
 */
import React from 'react';
import {
  View, Text, StyleSheet, Modal, Image, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/constants/colors';
import { spacing } from '../../../../shared/constants/spacing';
import { typography } from '../../../../shared/constants/typography';
import { ProyectoMiembro, MemberRole } from '../../domain/ProyectoMiembro';
import { ComponentOption } from '../../domain/ProyectoMiembroRepositoryPort';

const AVATAR_COLORS = [colors.primary, colors.success, colors.accent, colors.primaryDark];

interface Props {
  visible: boolean;
  miembro: ProyectoMiembro | null;
  componentes: ComponentOption[];
  isAdmin: boolean;
  onClose: () => void;
  onEditRole: (m: ProyectoMiembro, r: MemberRole) => void;
  onRetirarRol: (asignacionId: string, rolNombre: string, nombre: string) => void;
  onRetirarDelProyecto: (miembroId: string, nombre: string) => void;
}

export const MemberDetailModal: React.FC<Props> = ({
  visible, miembro, componentes, isAdmin,
  onClose, onEditRole, onRetirarRol, onRetirarDelProyecto,
}) => {
  if (!miembro) return null;
  const nombre   = miembro.nombreCompleto || miembro.username;
  const inicial  = nombre.charAt(0).toUpperCase();

  const getScopeTexto = (r: MemberRole) => {
    if (r.rolNombre === 'Superadministrador') return 'Alcance Global';
    if (r.accionId) return 'Acción específica';
    if (r.componenteId) {
      const comp = componentes.find((c) => c.id === r.componenteId);
      return `Componente: ${comp?.name || r.componenteId}`;
    }
    return 'Proyecto completo';
  };

  const roles = miembro.roles ?? [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Header */}
          <View style={s.header}>
            <View style={[s.avatar, { backgroundColor: AVATAR_COLORS[0] }]}>
              {miembro.photoUrl
                ? <Image source={{ uri: miembro.photoUrl }} style={s.avatarImg as any} resizeMode="cover" />
                : <Text style={s.inicial}>{inicial}</Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.nombre} numberOfLines={1}>{nombre}</Text>
              <Text style={s.username}>@{miembro.username}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={s.divider} />

          <Text style={s.seccionTitulo}>
            {roles.length === 1 ? '1 Rol asignado' : `${roles.length} Roles asignados`}
          </Text>

          <ScrollView style={s.rolesScroll} showsVerticalScrollIndicator={false}>
            {roles.length === 0 ? (
              <Text style={s.vacio}>Sin roles asignados.</Text>
            ) : (
              roles.map((r, idx) => (
                <View key={r.id || idx} style={s.rolRow}>
                  <View style={s.rolIconWrap}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rolNombre}>{r.rolNombre}</Text>
                    <Text style={s.rolAlcance}>{getScopeTexto(r)}</Text>
                  </View>
                  {isAdmin && r.id && (
                    <View style={s.rolActions}>
                      <TouchableOpacity
                        onPress={() => { onClose(); onEditRole(miembro, r); }}
                        style={s.rolActionBtn}
                        accessibilityLabel="Editar rol"
                      >
                        <Ionicons name="pencil-outline" size={15} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => { onClose(); onRetirarRol(r.id, r.rolNombre, nombre); }}
                        style={s.rolActionBtn}
                        accessibilityLabel="Retirar rol"
                      >
                        <Ionicons name="close-circle-outline" size={15} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>

          {isAdmin && (
            <View style={s.footer}>
              <TouchableOpacity
                style={s.retirarBtn}
                onPress={() => { onClose(); onRetirarDelProyecto(miembro.id, nombre); }}
              >
                <Ionicons name="person-remove-outline" size={14} color={colors.error} />
                <Text style={s.retirarTxt}>Retirar del Proyecto</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  card:         { backgroundColor: colors.surface, borderRadius: 20, width: '90%', maxWidth: 420, maxHeight: '80%', padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm } as any,
  avatar:       { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' as any },
  avatarImg:    { width: '100%', height: '100%' },
  inicial:      { fontFamily: typography.fontFamily, fontSize: 22, fontWeight: typography.weights.bold, color: '#fff' },
  nombre:       { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  username:     { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary },
  closeBtn:     { padding: spacing.xs },
  divider:      { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  seccionTitulo:{ fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  rolesScroll:  { maxHeight: 280 },
  vacio:        { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary, fontStyle: 'italic' },
  rolRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border } as any,
  rolIconWrap:  { width: 28, height: 28, borderRadius: 8, backgroundColor: `${colors.primary}12`, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  rolNombre:    { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.textPrimary },
  rolAlcance:   { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  rolActions:   { flexDirection: 'row', gap: spacing.xs, alignItems: 'center' } as any,
  rolActionBtn: { padding: spacing.xs },
  footer:       { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  retirarBtn:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs } as any,
  retirarTxt:   { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.error, fontWeight: typography.weights.medium },
});
