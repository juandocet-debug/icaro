import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, Image,
  TouchableOpacity, Modal, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { SearchableSelect, SelectOption } from '../../../shared/components/SearchableSelect';
import { ProyectoMiembro } from '../domain/ProyectoMiembro';
import { Meta } from '../domain/Meta';
import { Rol } from '../../seguridad/domain/Rol';
import { ComponentOption, ActionOption } from '../domain/ProyectoMiembroRepositoryPort';
import {
  listarRolesActivosUseCase,
  listarComponentesProyectoUseCase,
  listarAccionesComponenteUseCase,
  asignarRolMiembroUseCase,
  actualizarAsignacionRolUseCase,
  retirarRolUseCase,
  quitarAsignacionUseCase,
  listarMiembrosUseCase,
  listarUsuariosUseCase,
  listarMetasProyectoUseCase,
} from '../../../shared/dependencies';
import { MemberRole } from '../domain/ProyectoMiembro';

const AVATAR_COLORS = [colors.primary, colors.success, colors.accent, colors.primaryDark];

// ── Modal detalle de miembro ────────────────────────────────────────────────
interface MemberDetailModalProps {
  visible: boolean;
  miembro: ProyectoMiembro | null;
  componentes: ComponentOption[];
  isAdmin: boolean;
  onClose: () => void;
  onEditRole: (m: ProyectoMiembro, r: MemberRole) => void;
  onRetirarRol: (asignacionId: string, rolNombre: string, nombre: string) => void;
  onRetirarDelProyecto: (miembroId: string, nombre: string) => void;
}

const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  visible, miembro, componentes, isAdmin,
  onClose, onEditRole, onRetirarRol, onRetirarDelProyecto,
}) => {
  if (!miembro) return null;
  const nombre = miembro.nombreCompleto || miembro.username;
  const inicial = nombre.charAt(0).toUpperCase();
  const colorIdx = 0;

  const getScopeTexto = (r: MemberRole) => {
    if (r.rolNombre === 'Superadministrador') return 'Alcance Global';
    if (r.accionId) return `Acción específica`;
    if (r.componenteId) {
      const comp = componentes.find((c) => c.id === r.componenteId);
      return `Componente: ${comp?.name || r.componenteId}`;
    }
    return 'Proyecto completo';
  };

  const roles = miembro.roles ?? [];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={md.overlay}>
        <View style={md.card}>
          {/* Header */}
          <View style={md.header}>
            <View style={[md.avatar, { backgroundColor: AVATAR_COLORS[colorIdx] }]}>
              {miembro.photoUrl ? (
                <Image source={{ uri: miembro.photoUrl }} style={md.avatarImg as any} resizeMode="cover" />
              ) : (
                <Text style={md.inicial}>{inicial}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={md.nombre} numberOfLines={1}>{nombre}</Text>
              <Text style={md.username}>@{miembro.username}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={md.closeBtn} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={md.divider} />

          {/* Roles */}
          <Text style={md.seccionTitulo}>
            {roles.length === 1 ? '1 Rol asignado' : `${roles.length} Roles asignados`}
          </Text>

          <ScrollView style={md.rolesScroll} showsVerticalScrollIndicator={false}>
            {roles.length === 0 ? (
              <Text style={md.vacio}>Sin roles asignados.</Text>
            ) : (
              roles.map((r, idx) => (
                <View key={r.id || idx} style={md.rolRow}>
                  <View style={md.rolIconWrap}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={md.rolNombre}>{r.rolNombre}</Text>
                    <Text style={md.rolAlcance}>{getScopeTexto(r)}</Text>
                  </View>
                  {isAdmin && r.id && (
                    <View style={md.rolActions}>
                      <TouchableOpacity
                        onPress={() => { onClose(); onEditRole(miembro, r); }}
                        style={md.rolActionBtn}
                        accessibilityLabel="Editar rol"
                      >
                        <Ionicons name="pencil-outline" size={15} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => { onClose(); onRetirarRol(r.id, r.rolNombre, nombre); }}
                        style={md.rolActionBtn}
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

          {/* Footer */}
          {isAdmin && (
            <View style={md.footer}>
              <TouchableOpacity
                style={md.retirarBtn}
                onPress={() => { onClose(); onRetirarDelProyecto(miembro.id, nombre); }}
              >
                <Ionicons name="person-remove-outline" size={14} color={colors.error} />
                <Text style={md.retirarTxt}>Retirar del Proyecto</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ── Componente principal ────────────────────────────────────────────────────
interface Props {
  proyectoId: string;
  isAdmin: boolean;
}

export const ProyectoEquipo: React.FC<Props> = ({ proyectoId, isAdmin }) => {
  const [miembros, setMiembros] = useState<ProyectoMiembro[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [componentes, setComponentes] = useState<ComponentOption[]>([]);
  const [acciones, setAcciones] = useState<ActionOption[]>([]);
  const [usuariosOpts, setUsuariosOpts] = useState<SelectOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [rolId, setRolId] = useState('');
  const [selectedMetaId, setSelectedMetaId] = useState<string>('');
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [selectedAccId, setSelectedAccId] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const [editingAsignacionId, setEditingAsignacionId] = useState<string | null>(null);

  // Modal confirmación genérico
  const [confirm, setConfirm] = useState<{
    titulo: string;
    mensaje: string;
    onOk: () => void;
  } | null>(null);

  // Modal detalle miembro
  const [miembroDetalle, setMiembroDetalle] = useState<ProyectoMiembro | null>(null);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  const cargar = async () => {
    setLoading(true);
    setError(null);

    try {
      const miembrosList = await listarMiembrosUseCase.ejecutar(proyectoId);
      setMiembros(miembrosList);
    } catch (err) {
      console.error('Error al listar miembros del proyecto', err);
      setError('No se pudo cargar el equipo del proyecto.');
      setLoading(false);
      return;
    }

    if (isAdmin) {
      try {
        const rolesList = await listarRolesActivosUseCase.ejecutar();
        setRoles(rolesList);
        if (rolesList.length > 0) setRolId(rolesList[0].id);
      } catch (err) {
        console.error('Error al listar roles activos', err);
      }

      try {
        const todosUsuarios = await listarUsuariosUseCase.ejecutar();
        setUsuariosOpts(
          todosUsuarios
            .filter((u) => u.isActive)
            .map((u) => ({
              id: u.username,
              name: u.nombreCompleto || u.username,
              description: u.username,
              photoUrl: u.photoUrl,
            }))
        );
      } catch (err) {
        console.error('Error al cargar usuarios', err);
      }

      try {
        const compList = await listarComponentesProyectoUseCase.ejecutar(proyectoId);
        setComponentes(compList);
      } catch (err) {
        console.error('Error al listar componentes', err);
      }

      try {
        const metasList = await listarMetasProyectoUseCase.ejecutar(proyectoId);
        setMetas(metasList.filter((m) => m.activo));
      } catch (err) {
        console.error('Error al listar metas', err);
      }
    }

    setLoading(false);
  };

  useEffect(() => { cargar(); }, [proyectoId]);

  // ── Cargar acciones cuando se selecciona componente ────────────────────────
  useEffect(() => {
    const cargarAcciones = async () => {
      if (!selectedCompId) { setAcciones([]); setSelectedAccId(''); return; }
      try {
        const accList = await listarAccionesComponenteUseCase.ejecutar(selectedCompId);
        setAcciones(accList);
      } catch (err) {
        console.error('Error al cargar acciones del componente', err);
      }
    };
    cargarAcciones();
  }, [selectedCompId]);

  const selectedRol = useMemo(() => roles.find((r) => r.id === rolId), [roles, rolId]);

  // Al cambiar rol, resetear selecciones de alcance
  useEffect(() => {
    if (selectedRol) {
      if (selectedRol.tipo_alcance !== 'componente' && selectedRol.tipo_alcance !== 'accion') {
        setSelectedMetaId('');
        setSelectedCompId('');
      }
      if (selectedRol.tipo_alcance !== 'accion') {
        setSelectedAccId('');
      }
    }
  }, [rolId, selectedRol]);

  // Al cambiar meta, limpiar componente
  useEffect(() => {
    setSelectedCompId('');
  }, [selectedMetaId]);

  const requiereComponente = selectedRol?.tipo_alcance === 'componente' || selectedRol?.tipo_alcance === 'accion';
  const requiereAccion = selectedRol?.tipo_alcance === 'accion';

  // ── Opciones derivadas ─────────────────────────────────────────────────────
  const rolesOptions = useMemo(() =>
    roles.map((r) => ({
      id: r.id,
      name: r.nombre,
      description: r.descripcion,
      category: r.es_sistema ? 'ROLES DEL SISTEMA' : 'ROLES PERSONALIZADOS',
      badgeText: r.es_sistema ? 'Sistema' : 'Personalizado',
    })), [roles]);

  const metasOptions = useMemo(() =>
    metas.map((m) => ({ id: m.id, name: m.nombre })), [metas]);

  // Componentes filtrados por la meta seleccionada
  const componentesOptions = useMemo(() => {
    const lista = selectedMetaId
      ? componentes.filter((c) => c.metaId === selectedMetaId)
      : componentes;
    return lista.map((c) => ({ id: c.id, name: c.name }));
  }, [componentes, selectedMetaId]);

  const accionesOptions = useMemo(() =>
    acciones.map((a) => ({ id: a.id, name: a.name })), [acciones]);

  const canSubmit = (editingAsignacionId || username.trim().length > 0) && rolId.length > 0;

  // ── Guardar ────────────────────────────────────────────────────────────────
  const ejecutarGuardar = async () => {
    setSaving(true);
    setFormErr(null);
    try {
      if (editingAsignacionId) {
        await actualizarAsignacionRolUseCase.ejecutar(
          proyectoId, editingAsignacionId, rolId,
          requiereComponente ? selectedCompId : null,
          requiereAccion ? selectedAccId : null
        );
      } else {
        await asignarRolMiembroUseCase.ejecutar(
          proyectoId, username.trim(), rolId,
          requiereComponente ? selectedCompId : null,
          requiereAccion ? selectedAccId : null
        );
      }
      resetForm();
      await cargar();
    } catch (e: any) {
      setFormErr(e?.response?.data?.error ?? 'Error al guardar la asignación.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setUsername(''); setRolId(''); setSelectedMetaId('');
    setSelectedCompId(''); setSelectedAccId('');
    setEditingAsignacionId(null); setShowForm(false); setFormErr(null);
  };

  const handleAgregarOrEditar = () => {
    if (!editingAsignacionId && !username.trim()) { setFormErr('El username es obligatorio.'); return; }
    if (!rolId) { setFormErr('Debe seleccionar un rol.'); return; }
    if (requiereComponente && !selectedCompId) { setFormErr('Este rol requiere seleccionar un componente.'); return; }
    if (requiereAccion && !selectedAccId) { setFormErr('Este rol requiere seleccionar una acción específica.'); return; }

    if (editingAsignacionId) {
      const rolNombre = roles.find((r) => r.id === rolId)?.nombre ?? 'rol seleccionado';
      setConfirm({
        titulo: 'Confirmar cambio de rol',
        mensaje: `¿Confirmas cambiar el rol de ${username} a "${rolNombre}"?`,
        onOk: ejecutarGuardar,
      });
    } else {
      ejecutarGuardar();
    }
  };

  const handleEditClick = (m: ProyectoMiembro, r: MemberRole) => {
    setEditingAsignacionId(r.id);
    setUsername(m.username);
    setRolId(r.rolId);
    // Recuperar metaId del componente si existe
    if (r.componenteId) {
      const comp = componentes.find((c) => c.id === r.componenteId);
      setSelectedMetaId(comp?.metaId || '');
    }
    setSelectedCompId(r.componenteId || '');
    setSelectedAccId(r.accionId || '');
    setShowForm(true);
    setFormErr(null);
  };

  const handleEliminar = (miembroId: string, nombreMiembro: string) => {
    setConfirm({
      titulo: 'Retirar del proyecto',
      mensaje: `¿Confirmas retirar a ${nombreMiembro} del proyecto? Se eliminarán todas sus asignaciones de rol.`,
      onOk: async () => {
        try {
          await quitarAsignacionUseCase.ejecutar(proyectoId, miembroId);
          await cargar();
        } catch {
          setError('No se pudo eliminar el miembro.');
        }
      },
    });
  };

  const handleRetirarRol = (asignacionId: string, rolNombre: string, nombreMiembro: string) => {
    setConfirm({
      titulo: 'Retirar rol',
      mensaje: `¿Confirmas retirar el rol "${rolNombre}" a ${nombreMiembro}?`,
      onOk: async () => {
        try {
          await retirarRolUseCase.ejecutar(proyectoId, asignacionId);
          await cargar();
        } catch {
          setError('No se pudo retirar el rol.');
        }
      },
    });
  };

  // ── Texto resumen de roles para tarjeta ────────────────────────────────────
  const getRolResumen = (m: ProyectoMiembro) => {
    const roles = m.roles ?? [];
    if (roles.length === 0) return { principal: 'Sin rol', extra: '' };
    const principal = roles[0].rolNombre;
    const extra = roles.length > 1 ? `+${roles.length - 1} más` : '';
    return { principal, extra };
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Card padding="md" style={styles.card}>
      {/* Header del panel */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Equipo del Proyecto</Text>
        {isAdmin && (
          <Button
            label={showForm ? 'Cancelar' : '+ Agregar'}
            size="sm"
            variant={showForm ? 'ghost' : 'primary'}
            onPress={() => {
              if (showForm) resetForm(); else setShowForm(true);
            }}
          />
        )}
      </View>

      {/* Formulario de asignación */}
      {isAdmin && showForm && (
        <View style={styles.formBox}>
          {!!formErr && <ErrorMessage message={formErr} />}
          <View style={styles.formContent}>

            {/* Usuario */}
            {!editingAsignacionId && (
              <View style={styles.zIdx50}>
                <Text style={styles.sublabel}>Seleccionar Usuario *</Text>
                <SearchableSelect
                  options={usuariosOpts}
                  selectedValue={username}
                  onSelect={setUsername}
                  placeholder="Buscar por nombre o username..."
                />
              </View>
            )}

            {/* Rol */}
            <View style={styles.zIdx40}>
              <Text style={styles.sublabel}>Seleccionar Rol *</Text>
              <SearchableSelect
                options={rolesOptions}
                selectedValue={rolId}
                onSelect={setRolId}
                placeholder="Buscar o seleccionar rol... 🔍"
              />
            </View>

            {/* Meta (solo cuando requiere componente) */}
            {requiereComponente && (
              <View style={styles.zIdx30}>
                <Text style={styles.sublabel}>Seleccionar Meta *</Text>
                <SearchableSelect
                  options={metasOptions}
                  selectedValue={selectedMetaId}
                  onSelect={setSelectedMetaId}
                  placeholder="Elige la meta del proyecto..."
                />
              </View>
            )}

            {/* Componente (filtrado por meta) */}
            {requiereComponente && selectedMetaId && (
              <View style={styles.zIdx20}>
                <Text style={styles.sublabel}>
                  Seleccionar Componente *
                  {componentesOptions.length === 0
                    ? '  (esta meta no tiene componentes)'
                    : ` (${componentesOptions.length} disponibles)`}
                </Text>
                <SearchableSelect
                  options={componentesOptions}
                  selectedValue={selectedCompId}
                  onSelect={setSelectedCompId}
                  placeholder="Buscar o seleccionar componente..."
                />
              </View>
            )}

            {/* Acción */}
            {requiereAccion && selectedCompId ? (
              <View style={styles.zIdx10}>
                <Text style={styles.sublabel}>Seleccionar Acción *</Text>
                <SearchableSelect
                  options={accionesOptions}
                  selectedValue={selectedAccId}
                  onSelect={setSelectedAccId}
                  placeholder="Buscar o seleccionar acción..."
                />
              </View>
            ) : null}

            <Button
              label={editingAsignacionId ? 'Guardar Cambios' : 'Agregar Miembro'}
              onPress={handleAgregarOrEditar}
              loading={saving}
              disabled={!canSubmit}
              size="sm"
              style={[styles.btnGuardar, !canSubmit && styles.btnDisabled]}
            />
          </View>
        </View>
      )}

      {!!error && <ErrorMessage message={error} />}

      {/* Grid de miembros */}
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
      ) : miembros.length === 0 ? (
        <Text style={styles.vacio}>Sin miembros asignados aún.</Text>
      ) : (
        <View style={styles.grid}>
          {miembros.map((m, idx) => {
            const { principal, extra } = getRolResumen(m);
            const totalRoles = (m.roles ?? []).length;
            return (
              <TouchableOpacity
                key={m.id}
                style={styles.memberWrapper}
                activeOpacity={0.85}
                onPress={() => setMiembroDetalle(m)}
                accessibilityLabel={`Ver detalles de ${m.nombreCompleto || m.username}`}
              >
                {/* Foto / Inicial */}
                <View style={[styles.memberCard, { backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }]}>
                  {m.photoUrl ? (
                    <Image
                      source={{ uri: m.photoUrl }}
                      style={{ width: '100%', height: '100%' } as any}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.inicial}>
                      {(m.nombreCompleto || m.username).charAt(0).toUpperCase()}
                    </Text>
                  )}
                  <View style={styles.overlay}>
                    <Text style={styles.nombre} numberOfLines={1}>
                      {m.nombreCompleto || m.username}
                    </Text>
                  </View>
                </View>

                {/* Rol principal + badge extra */}
                <View style={styles.rolChip}>
                  <Text style={styles.rolChipText} numberOfLines={1}>{principal}</Text>
                  {!!extra && <Text style={styles.rolChipExtra}>{extra}</Text>}
                </View>

                {/* Indicador de roles */}
                {totalRoles > 0 && (
                  <View style={styles.verDetalle}>
                    <Ionicons name="information-circle-outline" size={11} color={colors.primary} />
                    <Text style={styles.verDetalleTxt}>Ver roles</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── Modal detalle de miembro ── */}
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

      {/* ── Modal de confirmación genérico ── */}
      {!!confirm && (
        <Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitulo}>{confirm?.titulo}</Text>
              <Text style={styles.confirmMensaje}>{confirm?.mensaje}</Text>
              <View style={styles.confirmBtns}>
                <Button label="Cancelar" variant="ghost" size="sm" onPress={() => setConfirm(null)} />
                <Button
                  label="✓  Confirmar"
                  size="sm"
                  onPress={() => { confirm?.onOk(); setConfirm(null); }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Card>
  );
};

// ── Estilos panel principal ────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titulo: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  formBox: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 60,
    position: 'relative',
  },
  formContent: { gap: spacing.sm } as any,
  sublabel: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  btnGuardar: { marginTop: spacing.sm, backgroundColor: colors.primary },
  btnDisabled: { opacity: 0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md } as any,
  memberWrapper: { alignItems: 'center', width: 130, marginBottom: spacing.sm },
  memberCard: {
    width: 120, height: 120,
    borderRadius: 16,
    overflow: 'hidden' as any,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  inicial: {
    fontFamily: typography.fontFamily,
    fontSize: 36,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    opacity: 0.35,
  },
  overlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: `${colors.darkBg}B8`,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  nombre: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    textAlign: 'center',
  } as any,
  rolChip: {
    marginTop: 6,
    backgroundColor: `${colors.primary}14`,
    borderColor: `${colors.primary}30`,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignItems: 'center',
    width: '100%',
  },
  rolChipText: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textAlign: 'center',
  },
  rolChipExtra: {
    fontFamily: typography.fontFamily,
    fontSize: 8,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },
  verDetalle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  } as any,
  verDetalleTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    color: colors.primary,
  },
  vacio: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  zIdx50: { zIndex: 50, position: 'relative' } as any,
  zIdx40: { zIndex: 40, position: 'relative' } as any,
  zIdx30: { zIndex: 30, position: 'relative' } as any,
  zIdx20: { zIndex: 20, position: 'relative' } as any,
  zIdx10: { zIndex: 10, position: 'relative' } as any,
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCard: {
    width: 340,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  } as any,
  confirmTitulo: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  confirmMensaje: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  confirmBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  } as any,
});

// ── Estilos modal detalle miembro ─────────────────────────────────────────
const md = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    maxHeight: '85%' as any,
  } as any,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  } as any,
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden' as any,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  inicial: {
    fontFamily: typography.fontFamily,
    fontSize: 22,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    opacity: 0.5,
  },
  nombre: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  username: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: { padding: spacing.xs },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  seccionTitulo: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  rolesScroll: { maxHeight: 280 },
  rolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: `${colors.primary}08`,
    borderRadius: 10,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: `${colors.primary}18`,
  } as any,
  rolIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rolNombre: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  rolAlcance: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rolActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  } as any,
  rolActionBtn: { padding: 6 },
  vacio: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  footer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  retirarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
    backgroundColor: `${colors.error}08`,
  } as any,
  retirarTxt: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.error,
    fontWeight: typography.weights.medium,
  },
});
