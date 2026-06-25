import React, { useEffect, useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, ActivityIndicator,
  TouchableOpacity, Modal, ScrollView, Platform, useWindowDimensions,
} from 'react-native';
import { Card }         from '../../../shared/components/Card';
import { Button }       from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { UserAvatar }   from '../../../shared/components/UserAvatar';
import { colors }       from '../../../shared/constants/colors';
import { spacing }      from '../../../shared/constants/spacing';
import { typography }   from '../../../shared/constants/typography';
import { Ionicons }     from '@expo/vector-icons';
import { UsuarioEntity } from '../domain/UsuariosRepositoryPort';
import { UsuarioAsignacionesModal } from './UsuarioAsignacionesModal';
import {
  listarUsuariosUseCase,
  crearUsuarioUseCase,
  actualizarActivoUsuarioUseCase,
  actualizarUsuarioUseCase,
  eliminarUsuarioUseCase,
} from '../../../shared/dependencies';
import { useAccess } from './useAccess';
import { useAuth } from './useAuth';
import { EditarUsuarioModal } from './EditarUsuarioModal';
import { ConfirmarEliminarUsuarioModal } from './ConfirmarEliminarUsuarioModal';

const AVATAR_COLORS = [colors.primary, colors.success, colors.accent, colors.primaryDark];

interface UsuariosContentProps {
  showForm: boolean;
  setShowForm: (show: boolean) => void;
}

interface FormState {
  cedula: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  email: string;
  telefono: string;
}

const FORM_EMPTY: FormState = {
  cedula: '',
  primerNombre: '',
  segundoNombre: '',
  primerApellido: '',
  segundoApellido: '',
  email: '',
  telefono: '',
};

export const UsuariosContent: React.FC<UsuariosContentProps> = ({ showForm, setShowForm }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { accessProfile } = useAccess();
  const { userProfile } = useAuth();
  const isSuperAdmin = accessProfile?.esSuperadministrador === true;
  const canDesactivar = isSuperAdmin ||
    (accessProfile?.permisos ?? []).some((p: any) => p.codigo === 'usuarios.desactivar');

  const [usuarios, setUsuarios] = useState<UsuarioEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(FORM_EMPTY);

  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEst, setFiltroEst] = useState<'todos' | 'activo' | 'inactivo'>('todos');

  const [selectedUserForAsig, setSelectedUserForAsig] = useState<UsuarioEntity | null>(null);
  const [editingUser, setEditingUser] = useState<UsuarioEntity | null>(null);
  const [deletingUser, setDeletingUser] = useState<UsuarioEntity | null>(null);
  // Modal de credenciales temporales (mostrado UNA VEZ tras crear usuario)
  const [credenciales, setCredenciales] = useState<{ username: string; password: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const setField = (field: keyof FormState) => (val: string) =>
    setForm(prev => ({ ...prev, [field]: val }));

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listarUsuariosUseCase.ejecutar();
      setUsuarios(data);
    } catch {
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const limpiarForm = () => {
    setForm(FORM_EMPTY);
    setFormErr(null);
  };

  const handleCrear = async () => {
    // Validación mínima en frontend
    if (!form.cedula.trim() || !form.primerNombre.trim() || !form.primerApellido.trim() || !form.email.trim()) {
      setFormErr('Cédula, primer nombre, primer apellido y correo son obligatorios.');
      return;
    }
    setSaving(true);
    setFormErr(null);
    try {
      const nuevoUsuario = await crearUsuarioUseCase.ejecutar({
        cedula: form.cedula.trim(),
        primer_nombre: form.primerNombre.trim(),
        segundo_nombre: form.segundoNombre.trim() || undefined,
        primer_apellido: form.primerApellido.trim(),
        segundo_apellido: form.segundoApellido.trim() || undefined,
        email: form.email.trim(),
        telefono: form.telefono.trim() || undefined,
      });
      limpiarForm();
      setShowForm(false);
      await cargar();
      // Mostrar credenciales temporales UNA VEZ
      if (nuevoUsuario.tempPassword) {
        setCredenciales({ username: nuevoUsuario.username, password: nuevoUsuario.tempPassword });
      }
    } catch (e: any) {
      setFormErr(e?.response?.data?.error ?? 'Error al crear el usuario.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (u: UsuarioEntity) => {
    try {
      await actualizarActivoUsuarioUseCase.ejecutar(u.id, !u.isActive);
      await cargar();
    } catch {
      setError('No se pudo actualizar el usuario.');
    }
  };

  const handleActualizar = async (datos: any) => {
    if (!editingUser) return;
    await actualizarUsuarioUseCase.ejecutar(editingUser.id, datos);
    await cargar();
  };

  const handleEliminar = async () => {
    if (!deletingUser) return;
    await eliminarUsuarioUseCase.ejecutar(deletingUser.id);
    await cargar();
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      if (q && ![u.nombreCompleto, u.username, u.email].some(x => x?.toLowerCase().includes(q))) return false;
      if (filtroEst === 'activo' && !u.isActive) return false;
      if (filtroEst === 'inactivo' && u.isActive) return false;
      return true;
    });
  }, [usuarios, searchQuery, filtroEst]);

  return (
    <View style={styles.contentContainer}>

      {/* ── Modal Credenciales Temporales (se muestra UNA VEZ tras crear usuario) ── */}
      <Modal visible={!!credenciales} transparent animationType="fade">
        <View style={styles.overlay}>
          <Card padding="lg" style={[styles.modalCard, { maxWidth: 420 }]}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.success + '22', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="key-outline" size={20} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formTitulo, { fontSize: 16 }]}>Usuario creado</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Entrega estas credenciales al usuario. Solo se muestran una vez.</Text>
              </View>
            </View>

            {/* Advertencia */}
            <View style={{ backgroundColor: '#FFF3CD', borderRadius: 8, padding: spacing.sm, marginBottom: spacing.md, flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
              <Ionicons name="warning-outline" size={16} color="#856404" style={{ marginTop: 1 }} />
              <Text style={{ color: '#856404', fontSize: 12, flex: 1 }}>
                Esta contraseña NO se puede recuperar después. Cópiala ahora.
              </Text>
            </View>

            {/* Credenciales */}
            <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
              <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: spacing.sm }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 2 }}>USUARIO (CÉDULA)</Text>
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600', letterSpacing: 1 }}>
                  {credenciales?.username}
                </Text>
              </View>
              <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: spacing.sm }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 2 }}>CONTRASEÑA TEMPORAL</Text>
                <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '700', letterSpacing: 2, fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier' }}>
                  {credenciales?.password}
                </Text>
              </View>
            </View>

            {/* Acciones */}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: copiado ? colors.success : colors.primary, borderRadius: 8, padding: spacing.sm + 2, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                onPress={async () => {
                  if (credenciales) {
                    const texto = `Usuario: ${credenciales.username}\nContraseña: ${credenciales.password}`;
                    if (Platform.OS === 'web') {
                      try { await navigator.clipboard.writeText(texto); } catch {}
                    }
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 2000);
                  }
                }}
              >
                <Ionicons name={copiado ? 'checkmark' : 'copy-outline'} size={16} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>
                  {copiado ? 'Copiado' : 'Copiar credenciales'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => { setCredenciales(null); setCopiado(false); }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13 }}>Listo</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </Modal>

      {/* ── Modal Nuevo Usuario ── */}
      <Modal visible={showForm} transparent animationType="fade">
        <View style={styles.overlay}>
          <Card padding="lg" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.formTitulo}>Nuevo Usuario</Text>
              <TouchableOpacity
                onPress={() => { setShowForm(false); limpiarForm(); }}
                style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {!!formErr && <ErrorMessage message={formErr} />}

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>

              {/* IDENTIFICACIÓN */}
              <Text style={styles.sectionLabel}>IDENTIFICACIÓN</Text>
              <View style={styles.formRow}>
                <View style={[styles.fieldWrapper, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Cédula <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 12345678"
                    placeholderTextColor={colors.textSecondary}
                    value={form.cedula}
                    onChangeText={setField('cedula')}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* NOMBRES */}
              <Text style={styles.sectionLabel}>NOMBRES</Text>
              <View style={[styles.formRow, isMobile && { flexDirection: 'column' }]}>
                <View style={[styles.fieldWrapper, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Primer nombre <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Primer nombre"
                    placeholderTextColor={colors.textSecondary}
                    value={form.primerNombre}
                    onChangeText={setField('primerNombre')}
                  />
                </View>
                <View style={[styles.fieldWrapper, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Segundo nombre</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Segundo nombre (opcional)"
                    placeholderTextColor={colors.textSecondary}
                    value={form.segundoNombre}
                    onChangeText={setField('segundoNombre')}
                  />
                </View>
              </View>
              <View style={[styles.formRow, isMobile && { flexDirection: 'column' }]}>
                <View style={[styles.fieldWrapper, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Primer apellido <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Primer apellido"
                    placeholderTextColor={colors.textSecondary}
                    value={form.primerApellido}
                    onChangeText={setField('primerApellido')}
                  />
                </View>
                <View style={[styles.fieldWrapper, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Segundo apellido</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Segundo apellido (opcional)"
                    placeholderTextColor={colors.textSecondary}
                    value={form.segundoApellido}
                    onChangeText={setField('segundoApellido')}
                  />
                </View>
              </View>

              {/* CONTACTO */}
              <Text style={styles.sectionLabel}>CONTACTO</Text>
              <View style={[styles.formRow, isMobile && { flexDirection: 'column' }]}>
                <View style={[styles.fieldWrapper, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Correo electrónico <Text style={styles.required}>*</Text></Text>
                  <TextInput
                    style={styles.input}
                    placeholder="correo@ejemplo.com"
                    placeholderTextColor={colors.textSecondary}
                    value={form.email}
                    onChangeText={setField('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={[styles.fieldWrapper, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Teléfono</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+51 999 888 777"
                    placeholderTextColor={colors.textSecondary}
                    value={form.telefono}
                    onChangeText={setField('telefono')}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

            </ScrollView>

            <Text style={styles.hint}>
              La contraseña inicial será la cédula. El usuario deberá cambiarla en su primer ingreso.
            </Text>

            <View style={styles.modalActions}>
              <Button label="Cancelar" variant="ghost" onPress={() => { setShowForm(false); limpiarForm(); }} />
              <Button label="Crear Usuario" onPress={handleCrear} loading={saving} />
            </View>
          </Card>
        </View>
      </Modal>

      {/* ── Modal Asignaciones ── */}
      <UsuarioAsignacionesModal
        visible={selectedUserForAsig !== null}
        onClose={() => setSelectedUserForAsig(null)}
        userId={selectedUserForAsig ? selectedUserForAsig.id : null}
        userName={selectedUserForAsig ? selectedUserForAsig.nombreCompleto : ''}
      />

      {/* ── Modal Editar Usuario ── */}
      <EditarUsuarioModal
        key={editingUser?.id ?? 'no-user'}
        visible={editingUser !== null}
        onClose={() => setEditingUser(null)}
        usuario={editingUser}
        onSave={handleActualizar}
      />

      {/* ── Modal Confirmar Eliminar ── */}
      <ConfirmarEliminarUsuarioModal
        visible={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        usuario={deletingUser}
        onConfirm={handleEliminar}
      />

      {/* ── Filtros ── */}
      <Card padding="md" style={styles.filterCard}>
        <View style={styles.filterGrid}>
          <TextInput
            style={[styles.input, styles.searchInput]}
            placeholder="Buscar por nombre, usuario o correo..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Estado</Text>
            <View style={styles.pillRow}>
              {(['todos', 'activo', 'inactivo'] as const).map(o => (
                <TouchableOpacity key={o} onPress={() => setFiltroEst(o)} style={[styles.pill, filtroEst === o && styles.pillActive]}>
                  <Text style={[styles.pillText, filtroEst === o && styles.pillTextActive]}>
                    {o === 'todos' ? 'Todos' : o === 'activo' ? 'Activos' : 'Inactivos'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Card>

      {!!error && <ErrorMessage message={error} />}

      {/* ── Lista: Tabla en web, Cards en móvil ── */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : isMobile ? (
        /* ── Cards móvil ── */
        <View style={styles.cardList}>
          {usuariosFiltrados.length === 0 && (
            <Text style={styles.vacio}>No se encontraron usuarios.</Text>
          )}
          {usuariosFiltrados.map((u, idx) => (
            <View key={u.id} style={[styles.userCard, !u.isActive && { opacity: 0.6 }]}>
              {/* Avatar + Info */}
              <View style={styles.userCardTop}>
                <UserAvatar
                  name={u.nombreCompleto || u.username}
                  photoUrl={u.photoUrl}
                  size={44}
                  fallbackColor={AVATAR_COLORS[idx % AVATAR_COLORS.length]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.userCardName} numberOfLines={1}>
                    {u.nombreCompleto || u.username}
                  </Text>
                  <Text style={styles.userCardSub} numberOfLines={1}>@{u.username}</Text>
                  {!!u.email && <Text style={styles.userCardEmail} numberOfLines={1}>{u.email}</Text>}
                </View>
                {/* Badge estado */}
                <View style={[styles.badge, { backgroundColor: u.isActive ? 'rgba(40,167,111,0.1)' : colors.border }]}>
                  <Text style={[styles.badgeTxt, { color: u.isActive ? colors.success : colors.textSecondary }]}>
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              </View>

              {/* Asignaciones row */}
              <View style={styles.userCardMeta}>
                {u.isSuperuser ? (
                  <View style={styles.globalBadge}>
                    <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                    <Text style={styles.globalBadgeTxt}>Superadmin Global</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => setSelectedUserForAsig(u)}>
                    <Text style={styles.asignacionesLink}>
                      {u.asignacionesCount === 0 ? 'Sin asignaciones'
                        : u.asignacionesCount === 1 ? '1 proyecto'
                        : `${u.asignacionesCount} proyectos`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Acciones: todos inline, solo iconos */}
              <View style={styles.userCardActions}>
                <View style={styles.cardActionsRow}>
                  {isSuperAdmin && (
                    <TouchableOpacity
                      style={[styles.cardIconBtn, { borderColor: colors.primary }]}
                      onPress={() => setEditingUser(u)}
                      accessibilityLabel="Editar usuario"
                    >
                      <Ionicons name="create-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                  {isSuperAdmin && !u.isSuperuser && u.id !== userProfile?.userId && (
                    <TouchableOpacity
                      style={[styles.cardIconBtn, { borderColor: colors.error }]}
                      onPress={() => setDeletingUser(u)}
                      accessibilityLabel="Eliminar usuario"
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                  {canDesactivar && u.id !== userProfile?.userId && (!u.isSuperuser || isSuperAdmin) && (
                    <TouchableOpacity
                      style={[
                        styles.cardIconBtn,
                        { borderColor: u.isActive ? colors.error : colors.success },
                      ]}
                      onPress={() => toggleActivo(u)}
                      accessibilityLabel={u.isActive ? 'Desactivar' : 'Activar'}
                    >
                      <Ionicons
                        name={u.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                        size={16}
                        color={u.isActive ? colors.error : colors.success}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        /* ── Tabla web ── */
        <Card padding="none" style={styles.tabla}>
          {/* Header */}
          <View style={styles.th}>
            <Text style={[styles.thCell, { flex: 2.2 }]}>Usuario</Text>
            <Text style={[styles.thCell, { flex: 1.5 }]}>Cédula</Text>
            <Text style={[styles.thCell, { flex: 2 }]}>Correo</Text>
            <Text style={[styles.thCell, { width: 120 }]}>Teléfono</Text>
            <Text style={[styles.thCell, { width: 80 }]}>Estado</Text>
            <Text style={[styles.thCell, { width: 130 }]}>Asignaciones</Text>
            <Text style={[styles.thCell, { width: 160 }]}>Acciones</Text>
          </View>

          {/* Rows */}
          {usuariosFiltrados.map((u, idx) => (
            <View
              key={u.id}
              style={[styles.tr, idx % 2 === 0 && styles.trAlt, !u.isActive && styles.trInactivo]}
            >
              {/* Usuario */}
              <View style={[styles.tdCell, { flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }] as any}>
                <UserAvatar
                  name={u.nombreCompleto || u.username}
                  photoUrl={u.photoUrl}
                  size={36}
                  fallbackColor={AVATAR_COLORS[idx % AVATAR_COLORS.length]}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.td} numberOfLines={1}>{u.nombreCompleto || u.username}</Text>
                  <Text style={styles.tdSub}>@{u.username}</Text>
                </View>
              </View>

              {/* Cédula */}
              <Text style={[styles.td, styles.tdCell, { flex: 1.5 }]} numberOfLines={1}>
                {u.username || '—'}
              </Text>

              {/* Correo */}
              <Text style={[styles.td, styles.tdCell, { flex: 2 }]} numberOfLines={1}>
                {u.email || '—'}
              </Text>

              {/* Teléfono */}
              <Text style={[styles.td, styles.tdCell, { width: 120 }]} numberOfLines={1}>
                {u.telefono || '—'}
              </Text>

              {/* Estado */}
              <View style={[styles.tdCell, { width: 80 }]}>
                <View style={[styles.badge, { backgroundColor: u.isActive ? 'rgba(40,167,111,0.1)' : colors.border }]}>
                  <Text style={[styles.badgeTxt, { color: u.isActive ? colors.success : colors.textSecondary }]}>
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </Text>
                </View>
              </View>

              {/* Asignaciones */}
              <View style={[styles.tdCell, { width: 130 }]}>
                {u.isSuperuser ? (
                  <View style={styles.globalBadge}>
                    <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                    <Text style={styles.globalBadgeTxt}>Global</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => setSelectedUserForAsig(u)}>
                    <Text style={styles.asignacionesLink}>
                      {u.asignacionesCount === 0
                        ? 'Sin asignaciones'
                        : u.asignacionesCount === 1
                        ? '1 proyecto'
                        : `${u.asignacionesCount} proyectos`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Acciones */}
              <View style={[styles.tdCell, { width: 160, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }] as any}>
                {isSuperAdmin && (
                  <>
                    <TouchableOpacity
                      onPress={() => setEditingUser(u)}
                      style={[styles.actionBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
                    >
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    {(!u.isSuperuser && u.id !== userProfile?.userId) && (
                      <TouchableOpacity
                        onPress={() => setDeletingUser(u)}
                        style={[styles.actionBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </>
                )}
                {canDesactivar &&
                  u.id !== userProfile?.userId &&
                  (!u.isSuperuser || isSuperAdmin) && (
                  <Button
                    label={u.isActive ? 'Desactivar' : 'Activar'}
                    size="sm"
                    variant="ghost"
                    onPress={() => toggleActivo(u)}
                  />
                )}
              </View>
            </View>
          ))}

          {usuariosFiltrados.length === 0 && (
            <Text style={styles.vacio}>No se encontraron usuarios.</Text>
          )}
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: { alignSelf: 'stretch' },
  loader:           { marginTop: spacing.xxl },

  // Modal
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  modalCard:   { width: 580, maxWidth: '95%' as any },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  formTitulo:  { fontFamily: typography.fontFamily, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },

  // Secciones del formulario
  sectionLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  } as any,
  formRow:      { flexDirection: 'row', gap: spacing.sm } as any,
  fieldWrapper: { marginBottom: spacing.sm },
  fieldLabel:   { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: 4, fontWeight: typography.weights.medium },
  required:     { color: colors.error },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    height: 38,
  },
  searchInput: { flex: 2, minWidth: 240 },

  hint:         { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.textSecondary, fontStyle: 'italic', marginTop: spacing.md, marginBottom: spacing.md },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm } as any,

  // Filtros
  filterCard:  { marginBottom: spacing.md, alignSelf: 'stretch' as any },
  filterGrid:  { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md } as any,
  filterGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs } as any,
  filterLabel: { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.textSecondary, textTransform: 'uppercase' } as any,
  pillRow:     { flexDirection: 'row', gap: 4 } as any,
  pill:        { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  pillActive:  { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText:    { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary },
  pillTextActive: { color: colors.surface, fontWeight: typography.weights.bold },

  // Tabla (web)
  tabla:      { alignSelf: 'stretch' as any },
  th:         { flexDirection: 'row', paddingVertical: spacing.xs, paddingHorizontal: spacing.lg, borderBottomWidth: 2, borderBottomColor: colors.border },
  thCell:     { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 } as any,
  tr:         { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  trAlt:      { backgroundColor: 'rgba(108,85,201,0.03)' },
  trInactivo: { opacity: 0.5 },
  tdCell:     { paddingRight: spacing.sm },
  td:         { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textPrimary },
  tdSub:      { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.textSecondary },
  avatar:     { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inicial:    { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.surface },

  badge:       { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' as any },
  badgeTxt:    { fontFamily: typography.fontFamily, fontSize: 10, fontWeight: typography.weights.medium },
  globalBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(108,85,201,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' as any } as any,
  globalBadgeTxt: { fontFamily: typography.fontFamily, fontSize: 10, fontWeight: typography.weights.bold, color: colors.primary },
  asignacionesLink: { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.primary, textDecorationLine: 'underline', fontWeight: typography.weights.medium } as any,
  vacio:       { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary, fontStyle: 'italic', padding: spacing.lg },
  actionBtn:   { padding: 4 },

  // Cards móvil
  cardList: { gap: spacing.sm } as any,
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  } as any,
  userCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm } as any,
  userCardName: { fontFamily: typography.fontFamily, fontSize: 14, fontWeight: '700', color: colors.textPrimary } as any,
  userCardSub:  { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary },
  userCardEmail:{ fontFamily: typography.fontFamily, fontSize: 11, color: '#6366f1' },
  userCardMeta: { paddingTop: 4 },
  userCardActions: {
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 6,
  } as any,
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
  } as any,
  cardIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'transparent',
  } as any,
  cardIconTxt: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: '600',
  } as any,
  cardToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  } as any,
  cardToggleDanger:  { backgroundColor: 'rgba(239,68,68,0.08)' },
  cardToggleSuccess: { backgroundColor: 'rgba(40,167,111,0.08)' },
  cardActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' } as any,
  cardActionTxt: { fontFamily: typography.fontFamily, fontSize: 12, fontWeight: '600' } as any,
});

