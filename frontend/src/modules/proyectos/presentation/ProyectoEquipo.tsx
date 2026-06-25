/**
 * ProyectoEquipo
 * Muestra la grilla de miembros del proyecto y el formulario de asignación de roles.
 * La lógica está en hooks/useProyectoEquipo.ts
 * El modal de detalle está en components/MemberDetailModal.tsx
 */
import React from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Image,
  TouchableOpacity, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { SearchableSelect } from '../../../shared/components/SearchableSelect';
import { ProyectoMiembro } from '../domain/ProyectoMiembro';
import { MemberDetailModal } from './components/MemberDetailModal';
import { useProyectoEquipo } from './hooks/useProyectoEquipo';

const AVATAR_COLORS = [colors.primary, colors.success, colors.accent, colors.primaryDark];

interface Props {
  proyectoId: string;
  isAdmin: boolean;
  initialMiembros?: any[] | null;
}

export const ProyectoEquipo: React.FC<Props> = ({ proyectoId, isAdmin, initialMiembros }) => {
  const {
    miembros, loading, refreshing, error,
    showForm, setShowForm, formErr, saving, editingAsignacionId,
    username, setUsername, rolId, setRolId,
    selectedMetaId, setSelectedMetaId, selectedCompId, setSelectedCompId,
    selectedAccId, setSelectedAccId,
    confirm, setConfirm, miembroDetalle, setMiembroDetalle,
    rolesOptions, metasOptions, componentesOptions, accionesOptions, usuariosOpts,
    requiereComponente, requiereAccion, canSubmit, componentes,
    cargarDatosFormulario, resetForm, getRolResumen,
    handleAgregarOrEditar, handleEditClick, handleEliminar, handleRetirarRol,
  } = useProyectoEquipo({ proyectoId, isAdmin, initialMiembros });

  return (
    <Card padding="md" style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs } as any}>
          <Text style={s.titulo}>Equipo del Proyecto</Text>
          {refreshing && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />}
        </View>
        {isAdmin && (
          <Button
            label={showForm ? 'Cancelar' : '+ Agregar'}
            size="sm"
            variant={showForm ? 'ghost' : 'primary'}
            onPress={() => {
              if (showForm) { resetForm(); }
              else { setShowForm(true); cargarDatosFormulario(); }
            }}
          />
        )}
      </View>

      {/* Formulario de asignación */}
      {isAdmin && showForm && (
        <View style={s.formBox}>
          {!!formErr && <ErrorMessage message={formErr} />}
          <View style={s.formContent}>
            {!editingAsignacionId && (
              <View style={s.zIdx50}>
                <Text style={s.sublabel}>Seleccionar Usuario *</Text>
                <SearchableSelect options={usuariosOpts} selectedValue={username} onSelect={setUsername} placeholder="Buscar por nombre o username..." />
              </View>
            )}
            <View style={s.zIdx40}>
              <Text style={s.sublabel}>Seleccionar Rol *</Text>
              <SearchableSelect options={rolesOptions} selectedValue={rolId} onSelect={setRolId} placeholder="Buscar o seleccionar rol... 🔍" />
            </View>
            {requiereComponente && (
              <View style={s.zIdx30}>
                <Text style={s.sublabel}>Seleccionar Meta *</Text>
                <SearchableSelect options={metasOptions} selectedValue={selectedMetaId} onSelect={setSelectedMetaId} placeholder="Elige la meta del proyecto..." />
              </View>
            )}
            {requiereComponente && selectedMetaId && (
              <View style={s.zIdx20}>
                <Text style={s.sublabel}>
                  {`Seleccionar Componente *${componentesOptions.length === 0 ? '  (sin componentes)' : ` (${componentesOptions.length})`}`}
                </Text>
                <SearchableSelect options={componentesOptions} selectedValue={selectedCompId} onSelect={setSelectedCompId} placeholder="Buscar o seleccionar componente..." />
              </View>
            )}
            {requiereAccion && selectedCompId && (
              <View style={s.zIdx10}>
                <Text style={s.sublabel}>Seleccionar Acción *</Text>
                <SearchableSelect options={accionesOptions} selectedValue={selectedAccId} onSelect={setSelectedAccId} placeholder="Buscar o seleccionar acción..." />
              </View>
            )}
            <Button
              label={editingAsignacionId ? 'Guardar Cambios' : 'Agregar Miembro'}
              onPress={handleAgregarOrEditar}
              loading={saving}
              disabled={!canSubmit}
              size="sm"
              style={[s.btnGuardar, !canSubmit && s.btnDisabled]}
            />
          </View>
        </View>
      )}

      {!!error && <ErrorMessage message={error} />}

      {/* Grid de miembros */}
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
      ) : miembros.length === 0 ? (
        <Text style={s.vacio}>Sin miembros asignados aún.</Text>
      ) : (
        <View style={s.grid}>
          {miembros.map((m, idx) => {
            const { principal, extra } = getRolResumen(m);
            const totalRoles = (m.roles ?? []).length;
            return (
              <TouchableOpacity
                key={m.id}
                style={s.memberWrapper}
                activeOpacity={0.85}
                onPress={() => setMiembroDetalle(m)}
                accessibilityLabel={`Ver detalles de ${m.nombreCompleto || m.username}`}
              >
                <View style={[s.memberCard, { backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }]}>
                  {m.photoUrl
                    ? <Image source={{ uri: m.photoUrl }} style={{ width: '100%', height: '100%' } as any} resizeMode="cover" />
                    : <Text style={s.inicial}>{(m.nombreCompleto || m.username).charAt(0).toUpperCase()}</Text>
                  }
                  <View style={s.overlay}>
                    <Text style={s.nombre} numberOfLines={1}>{m.nombreCompleto || m.username}</Text>
                  </View>
                </View>
                <View style={s.rolChip}>
                  <Text style={s.rolChipText} numberOfLines={1}>{principal}</Text>
                  {!!extra && <Text style={s.rolChipExtra}>{extra}</Text>}
                </View>
                {totalRoles > 0 && (
                  <View style={s.verDetalle}>
                    <Ionicons name="information-circle-outline" size={11} color={colors.primary} />
                    <Text style={s.verDetalleTxt}>Ver roles</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Modal detalle de miembro */}
      <MemberDetailModal
        visible={!!miembroDetalle}
        miembro={miembroDetalle}
        componentes={componentes}
        isAdmin={isAdmin}
        onClose={() => setMiembroDetalle(null)}
        onEditRole={(m, r) => { setMiembroDetalle(null); handleEditClick(m, r); }}
        onRetirarRol={(id, rolNombre, nombre) => { setMiembroDetalle(null); handleRetirarRol(id, rolNombre, nombre); }}
        onRetirarDelProyecto={(id, nombre) => { setMiembroDetalle(null); handleEliminar(id, nombre); }}
      />

      {/* Modal de confirmación genérico */}
      {!!confirm && (
        <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
          <View style={s.confirmOverlay}>
            <View style={s.confirmCard}>
              <Text style={s.confirmTitulo}>{confirm?.titulo}</Text>
              <Text style={s.confirmMensaje}>{confirm?.mensaje}</Text>
              <View style={s.confirmBtns}>
                <Button label="Cancelar" variant="ghost" size="sm" onPress={() => setConfirm(null)} />
                <Button label="✓  Confirmar" size="sm" onPress={() => { confirm?.onOk(); setConfirm(null); }} />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Card>
  );
};

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  card:       { marginBottom: spacing.md },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  titulo:     { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  formBox:    { marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, zIndex: 60, position: 'relative' },
  formContent:{ gap: spacing.sm } as any,
  sublabel:   { fontFamily: typography.fontFamily, fontSize: 11, fontWeight: typography.weights.bold, color: colors.textSecondary, textTransform: 'uppercase', marginTop: spacing.xs },
  btnGuardar: { marginTop: spacing.sm, backgroundColor: colors.primary },
  btnDisabled:{ opacity: 0.5 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md } as any,
  memberWrapper: { alignItems: 'center', width: 130, marginBottom: spacing.sm },
  memberCard: { width: 120, height: 120, borderRadius: 16, overflow: 'hidden' as any, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  inicial:    { fontFamily: typography.fontFamily, fontSize: 36, fontWeight: typography.weights.bold, color: colors.surface, opacity: 0.35 },
  overlay:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: `${colors.darkBg}B8`, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  nombre:     { fontFamily: typography.fontFamily, fontSize: 10, fontWeight: typography.weights.bold, color: colors.surface, textAlign: 'center' } as any,
  rolChip:    { marginTop: 6, backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}30`, borderWidth: 1, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 8, alignItems: 'center', width: '100%' },
  rolChipText:{ fontFamily: typography.fontFamily, fontSize: 9, fontWeight: typography.weights.bold, color: colors.primary, textAlign: 'center' },
  rolChipExtra: { fontFamily: typography.fontFamily, fontSize: 8, color: colors.textSecondary, textAlign: 'center', marginTop: 1 },
  verDetalle: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 } as any,
  verDetalleTxt: { fontFamily: typography.fontFamily, fontSize: 9, color: colors.primary },
  vacio:      { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary, fontStyle: 'italic' },
  zIdx50:     { zIndex: 50, position: 'relative' } as any,
  zIdx40:     { zIndex: 40, position: 'relative' } as any,
  zIdx30:     { zIndex: 30, position: 'relative' } as any,
  zIdx20:     { zIndex: 20, position: 'relative' } as any,
  zIdx10:     { zIndex: 10, position: 'relative' } as any,
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  confirmCard:{ width: 340, backgroundColor: colors.surface, borderRadius: 14, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 } as any,
  confirmTitulo: { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: spacing.sm },
  confirmMensaje: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  confirmBtns:{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm } as any,
});
