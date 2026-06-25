import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { SearchableSelect, SelectOption } from '../../../shared/components/SearchableSelect';
import { ProyectoMiembro } from '../domain/ProyectoMiembro';
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
} from '../../../shared/dependencies';
import { MemberRole } from '../domain/ProyectoMiembro';

const AVATAR_COLORS = [colors.primary, colors.success, colors.accent, colors.primaryDark];

interface Props {
  proyectoId: string;
  isAdmin: boolean;
}

export const ProyectoEquipo: React.FC<Props> = ({ proyectoId, isAdmin }) => {
  const [miembros, setMiembros] = useState<ProyectoMiembro[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [componentes, setComponentes] = useState<ComponentOption[]>([]);
  const [acciones, setAcciones] = useState<ActionOption[]>([]);
  const [usuariosOpts, setUsuariosOpts] = useState<SelectOption[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [rolId, setRolId] = useState('');
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [selectedAccId, setSelectedAccId] = useState<string>('');
  
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  // Modo edición de rol específico
  const [editingAsignacionId, setEditingAsignacionId] = useState<string | null>(null);

  // Modal de confirmación genérico
  const [confirm, setConfirm] = useState<{
    titulo: string;
    mensaje: string;
    onOk: () => void;
  } | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [miembrosList, rolesList] = await Promise.all([
        listarMiembrosUseCase.ejecutar(proyectoId),
        isAdmin ? listarRolesActivosUseCase.ejecutar() : Promise.resolve([]),
      ]);

      setMiembros(miembrosList);
      setRoles(rolesList);

      if (isAdmin) {
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
          console.error('Error al cargar la lista de usuarios para buscador', err);
        }
      }
      
      if (rolesList.length > 0) {
        setRolId(rolesList[0].id);
      }

      // Cargar componentes del proyecto
      const compList = await listarComponentesProyectoUseCase.ejecutar(proyectoId);
      setComponentes(compList);
    } catch {
      setError('No se pudo cargar el equipo o la configuración de roles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [proyectoId]);

  // Cargar acciones cuando se selecciona un componente
  useEffect(() => {
    const cargarAcciones = async () => {
      if (!selectedCompId) {
        setAcciones([]);
        setSelectedAccId('');
        return;
      }
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

  // Al cambiar el rol seleccionado, resetear componente y acción si no los requiere
  useEffect(() => {
    if (selectedRol) {
      if (selectedRol.tipo_alcance !== 'componente' && selectedRol.tipo_alcance !== 'accion') {
        setSelectedCompId('');
      }
      if (selectedRol.tipo_alcance !== 'accion') {
        setSelectedAccId('');
      }
    }
  }, [rolId, selectedRol]);

  const requiereComponente = selectedRol?.tipo_alcance === 'componente' || selectedRol?.tipo_alcance === 'accion';
  const requiereAccion = selectedRol?.tipo_alcance === 'accion';

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
      setUsername(''); setSelectedCompId(''); setSelectedAccId('');
      setEditingAsignacionId(null); setShowForm(false);
      await cargar();
    } catch (e: any) {
      setFormErr(e?.response?.data?.error ?? 'Error al guardar la asignación.');
    } finally {
      setSaving(false);
    }
  };

  const handleAgregarOrEditar = () => {
    if (!editingAsignacionId && !username.trim()) { setFormErr('El username es obligatorio.'); return; }
    if (!rolId) { setFormErr('Debe seleccionar un rol.'); return; }
    if (requiereComponente && !selectedCompId) { setFormErr('Este rol requiere seleccionar un componente.'); return; }
    if (requiereAccion && !selectedAccId) { setFormErr('Este rol requiere seleccionar una acción específica.'); return; }

    if (editingAsignacionId) {
      const rolNombre = roles.find(r => r.id === rolId)?.nombre ?? 'rol seleccionado';
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

  const getRolAlcanceTexto = (rolNombre: string, componenteId: string | null, accionId: string | null) => {
    if (rolNombre === 'Superadministrador') return 'Global';
    if (accionId) {
      const acc = acciones.find((a) => a.id === accionId);
      return `Acción: ${acc?.name || 'Cargando...'}`;
    }
    if (componenteId) {
      const comp = componentes.find((c) => c.id === componenteId);
      return `Componente: ${comp?.name || 'Cargando...'}`;
    }
    return 'Proyecto completo';
  };

  const rolesOptions = useMemo(() => {
    return roles.map((r) => ({
      id: r.id,
      name: r.nombre,
      description: r.descripcion,
      category: r.es_sistema ? 'ROLES DEL SISTEMA' : 'ROLES PERSONALIZADOS',
      badgeText: r.es_sistema ? 'Sistema' : 'Personalizado',
    }));
  }, [roles]);

  const componentesOptions = useMemo(() => {
    return componentes.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }, [componentes]);

  const accionesOptions = useMemo(() => {
    return acciones.map((a) => ({
      id: a.id,
      name: a.name,
    }));
  }, [acciones]);

  const canSubmit = (editingAsignacionId || username.trim().length > 0) && rolId.length > 0;

  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Equipo del Proyecto</Text>
        {isAdmin && (
          <Button
            label={showForm ? 'Cancelar' : '+ Agregar'}
            size="sm"
            variant={showForm ? 'ghost' : 'primary'}
            onPress={() => {
              if (showForm) {
                setEditingAsignacionId(null);
                setUsername('');
                setSelectedCompId('');
                setSelectedAccId('');
              }
              setShowForm(!showForm);
              setFormErr(null);
            }}
          />
        )}
      </View>

      {isAdmin && showForm && (
        <View style={styles.formBox}>
          {!!formErr && <ErrorMessage message={formErr} />}
          <View style={styles.formContent}>
            {!editingAsignacionId && (
              <View style={styles.zIdx40}>
                <Text style={styles.sublabel}>Seleccionar Usuario *</Text>
                <SearchableSelect
                  options={usuariosOpts}
                  selectedValue={username}
                  onSelect={setUsername}
                  placeholder="Buscar por nombre o username..."
                />
              </View>
            )}

            <View style={styles.zIdx30}>
              <Text style={styles.sublabel}>Seleccionar Rol *</Text>
              <SearchableSelect
                options={rolesOptions}
                selectedValue={rolId}
                onSelect={setRolId}
                placeholder="Buscar o seleccionar rol... 🔍"
              />
            </View>

            {requiereComponente && (
              <View style={styles.zIdx20}>
                <Text style={styles.sublabel}>Seleccionar Componente *</Text>
                <SearchableSelect
                  options={componentesOptions}
                  selectedValue={selectedCompId}
                  onSelect={setSelectedCompId}
                  placeholder="Buscar o seleccionar componente..."
                />
              </View>
            )}

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

      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
      ) : miembros.length === 0 ? (
        <Text style={styles.vacio}>Sin miembros asignados aún.</Text>
      ) : (
        <View style={styles.grid}>
          {miembros.map((m, idx) => {
            const memberRoles = m.roles && m.roles.length > 0 ? m.roles : [];

            return (
              <View key={m.id} style={styles.memberWrapper}>
                <View style={[styles.memberCard, { backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length] }]}>
                  {m.photoUrl ? (
                    <Image
                      source={{ uri: m.photoUrl }}
                      style={{ width: '100%', height: '100%' } as any}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.inicial}>{m.nombreCompleto ? m.nombreCompleto.charAt(0).toUpperCase() : m.username.charAt(0).toUpperCase()}</Text>
                  )}
                  <View style={styles.overlay}>
                    <Text style={styles.nombre} numberOfLines={1}>{m.nombreCompleto || m.username}</Text>
                  </View>
                </View>
                
                <View style={styles.badgesContainer}>
                  {memberRoles.map((r, rIdx) => (
                    <View key={r.id || rIdx} style={styles.badge}>
                      <Text style={styles.badgeRolText} numberOfLines={1}>{r.rolNombre}</Text>
                      <Text style={styles.badgeScopeText} numberOfLines={1}>
                        {getRolAlcanceTexto(r.rolNombre, r.componenteId, r.accionId)}
                      </Text>
                      {isAdmin && r.id && (
                        <View style={styles.badgeActions}>
                          <TouchableOpacity onPress={() => handleEditClick(m, r)} style={styles.badgeActionBtn} accessibilityLabel="Editar rol">
                            <Ionicons name="pencil-outline" size={13} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleRetirarRol(r.id, r.rolNombre, m.nombreCompleto || m.username)} style={styles.badgeActionBtn} accessibilityLabel="Retirar rol">
                            <Ionicons name="close-circle-outline" size={13} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {isAdmin && (
                  <View style={styles.memberActions}>
                    <Button label="Retirar de Proyecto" size="sm" variant="ghost" onPress={() => handleEliminar(m.id, m.nombreCompleto || m.username)} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
      {/* ── Modal de confirmación ── */}
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
    zIndex: 50,
    position: 'relative',
  },
  formContent: {
    gap: spacing.sm,
  } as any,
  sublabel: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  selectorWrapper: {
    marginTop: spacing.xs,
  },
  btnGuardar: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  } as any,
  memberWrapper: {
    alignItems: 'center',
    width: 130,
    marginBottom: spacing.sm,
  },
  memberCard: {
    width: 120,
    height: 120,
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
    bottom: 0,
    left: 0,
    right: 0,
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
  rol: {
    fontFamily: typography.fontFamily,
    fontSize: 8,
    color: `${colors.surface}C0`,
    textAlign: 'left',
    marginTop: 1,
  } as any,
  alcanceText: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  badgesContainer: {
    width: '100%',
    marginTop: spacing.xs,
    gap: 4,
    alignItems: 'center',
  } as any,
  badge: {
    backgroundColor: `${colors.primary}10`,
    borderColor: `${colors.primary}25`,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    width: '100%',
    alignItems: 'center',
  },
  badgeRolText: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textAlign: 'center',
  },
  badgeScopeText: {
    fontFamily: typography.fontFamily,
    fontSize: 8,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },
  badgeActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    justifyContent: 'center',
    alignItems: 'center',
  } as any,
  badgeActionBtn: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  memberActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  vacio: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
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
