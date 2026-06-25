import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { AppShell } from '../../../shared/components/AppShell';
import { Button } from '../../../shared/components/Button';
import { SectionTabs } from '../../../shared/components/SectionTabs';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { UsuariosContent } from '../../auth/presentation/UsuariosContent';
import { RolesTab } from './RolesTab';
import { PermisosTab } from './PermisosTab';
import { CrearRolModal } from './CrearRolModal';
import { useAuth } from '../../auth/presentation/useAuth';
import { useAccess } from '../../auth/presentation/useAccess';
import { Rol } from '../domain/Rol';
import { Permiso } from '../domain/Permiso';
import {
  listarRolesUseCase,
  crearRolUseCase,
  actualizarRolUseCase,
  eliminarRolUseCase,
  obtenerPermisosUseCase,
} from '../../../shared/dependencies';

type TabType = 'usuarios' | 'roles' | 'permisos';

export const SeguridadScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { isAuthenticated } = useAuth();
  const { accessProfile } = useAccess();
  const [activeTab, setActiveTab] = useState<TabType>('usuarios');
  const [roles, setRoles] = useState<Rol[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [rolEditar, setRolEditar] = useState<Rol | null>(null);
  const canManageSecurity = Boolean(
    isAuthenticated && accessProfile && (
      accessProfile.esSuperadministrador ||
      accessProfile.permisos.some((permiso) =>
        permiso.alcance === 'global' &&
        ['usuarios.ver', 'roles.ver', 'permisos.ver'].includes(permiso.codigo)
      )
    )
  );

  const fetchDatos = async () => {
    if (!canManageSecurity) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [rData, pData] = await Promise.all([
        listarRolesUseCase.ejecutar(),
        obtenerPermisosUseCase.ejecutar()
      ]);
      setRoles(rData);
      setPermisos(pData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManageSecurity) {
      void fetchDatos();
    }
  }, [canManageSecurity]);

  const handleGuardarRol = async (nombre: string, descripcion: string, permisosSeleccionados: string[]) => {
    setSaving(true);
    try {
      if (rolEditar) {
        await actualizarRolUseCase.ejecutar(rolEditar.id, { nombre, descripcion, permisos: permisosSeleccionados });
      } else {
        await crearRolUseCase.ejecutar({ nombre, descripcion, permisos: permisosSeleccionados });
      }
      await fetchDatos();
    } finally {
      setSaving(false);
      setRolEditar(null);
    }
  };

  const handleDesactivarRol = async (id: string) => {
    try {
      await eliminarRolUseCase.ejecutar(id);
      await fetchDatos();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditarClick = (rol: Rol) => {
    setRolEditar(rol);
    setShowCreateModal(true);
  };

  return (
    <AppShell scrollable={false} style={styles.shell}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {canManageSecurity && <>
        {/* SecurityHeader */}
        <View style={[styles.securityHeader, isMobile && styles.securityHeaderMobile]}>
          <View>
            <Text style={[styles.securityTitle, isMobile && { fontSize: 18 }]}>SEGURIDAD Y ACCESO</Text>
            <Text style={styles.securitySubtitle}>Administra usuarios, roles y permisos</Text>
          </View>
        </View>

        {/* SectionTabs */}
        <SectionTabs
          items={[
            { id: 'usuarios', label: 'Usuarios', icon: 'people-outline' },
            { id: 'roles', label: 'Roles', icon: 'shield-checkmark-outline' },
            { id: 'permisos', label: 'Permisos', icon: 'key-outline' },
          ]}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as TabType)}
        />

        {/* SectionHeader */}
        <View style={[styles.sectionHeader, isMobile && styles.sectionHeaderMobile]}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'usuarios'
              ? 'Gestión de Usuarios'
              : activeTab === 'roles'
              ? 'Roles del Sistema'
              : 'Catálogo de Permisos'}
          </Text>
          {activeTab === 'usuarios' && (
            <Button
              label="+ Nuevo usuario"
              onPress={() => setShowUserForm(true)}
              style={[styles.actionBtn, isMobile && { alignSelf: 'stretch' }]}
            />
          )}
          {activeTab === 'roles' && (
            <Button
              label="+ Nuevo rol"
              onPress={() => {
                setRolEditar(null);
                setShowCreateModal(true);
              }}
              style={[styles.actionBtn, isMobile && { alignSelf: 'stretch' }]}
            />
          )}
        </View>

        {/* SectionContent */}
        <View style={styles.sectionContent}>
          {activeTab === 'usuarios' && (
            <UsuariosContent showForm={showUserForm} setShowForm={setShowUserForm} />
          )}
          {activeTab === 'roles' && (
            <RolesTab
              roles={roles}
              permisos={permisos}
              loading={loading}
              onRefresh={fetchDatos}
              onEditar={handleEditarClick}
              onEliminar={handleDesactivarRol}
            />
          )}
          {activeTab === 'permisos' && (
            <PermisosTab permisos={permisos} />
          )}
        </View>

        <CrearRolModal
          visible={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setRolEditar(null);
          }}
          onGuardar={handleGuardarRol}
          permisos={permisos}
          rolesExistentes={roles}
          saving={saving}
          rolEditar={rolEditar}
        />
        </>}
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.background,
    alignSelf: 'stretch',
  },
  scrollContainer: {
    padding: Platform.select({ web: spacing.xl, default: spacing.md }),
    alignItems: 'stretch',
    alignSelf: 'stretch',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  } as any,
  securityHeaderMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.sm,
  } as any,
  securityTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  securitySubtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    minHeight: 48,
    width: '100%',
  } as any,
  sectionHeaderMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  } as any,
  sectionTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  actionBtn: {
    backgroundColor: colors.primary,
  },
  sectionContent: {
    marginTop: spacing.xs,
  },
});
