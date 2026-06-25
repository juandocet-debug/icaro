import React from 'react';
import {
  View, Text, StyleSheet, Platform, TouchableOpacity, Image,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { useAuth } from '../../modules/auth/presentation/useAuth';
import { useAccess } from '../../modules/auth/presentation/useAccess';

const LETRA = require('../../acced/letra.png');
const LOGO  = require('../../acced/logoLogin.png');

interface NavItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: string;
  label: string;
  /** Solo visible para superadministradores */
  requireSuperAdmin?: boolean;
  /** Solo visible si el usuario tiene este permiso con alcance 'global' */
  requirePerm?: string;
}

/**
 * Catálogo de ítems de navegación.
 *
 * Visibilidad por perfil (fuente única de verdad):
 *  - Superadministrador   : Inicio · Proyectos · Seguridad · Salir
 *  - Usuario operativo    : Proyectos · Salir
 *  - Usuario sin asignar  : Proyectos · Salir
 *
 * Reglas de isVisible:
 *  - requireSuperAdmin : solo si isSuperAdmin.
 *  - requirePerm       : solo si can(perm) retorna true (alcance global).
 *  - Sin requisito     : visible para cualquier usuario autenticado.
 */
const NAV_ITEMS: NavItem[] = [
  {
    icon: 'grid',
    route: '/',
    label: 'Inicio',
  },
  {
    icon: 'folder-outline',
    route: '/proyectos',
    label: 'Proyectos',
    // Sin requisito: visible para cualquier usuario autenticado
  },
  {
    icon: 'shield-checkmark-outline',
    route: '/seguridad',
    label: 'Seguridad',
    requirePerm: 'usuarios.ver',
  },
];

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onToggle }) => {
  const pathname = usePathname();
  const { logout, userProfile } = useAuth();
  const { accessProfile, can } = useAccess();

  if (Platform.OS !== 'web') return null;

  /**
   * Determina si el usuario es superadministrador.
   *
   * Prioridad:
   *  1. accessProfile?.esSuperadministrador (dato autoritativo del backend).
   *  2. userProfile?.isStaff como fallback visual cuando accessProfile aún no cargó
   *     o sufrió un error transitorio.
   *
   * IMPORTANTE: isStaff es únicamente un fallback UI. El backend siempre
   * valida permisos de forma independiente.
   */
  const isSuperAdmin: boolean =
    accessProfile?.esSuperadministrador === true ||
    (!accessProfile && userProfile?.isStaff === true);

  /**
   * Determina si el ítem debe MOSTRARSE (única fuente de verdad para visibilidad).
   * Los ítems no autorizados se omiten del DOM completamente.
   *
   * Superadmin usa fallback visual isStaff si accessProfile aún no cargó.
   */
  const isVisible = (item: NavItem): boolean => {
    // requireSuperAdmin: solo para superadmin (con o sin accessProfile)
    if (item.requireSuperAdmin) return isSuperAdmin;

    // Superadmin ve todos los ítems sin requireSuperAdmin también
    if (isSuperAdmin) return true;

    // Principio de mínimo privilegio: sin accessProfile, solo rutas sin requisito
    if (!accessProfile) return !item.requirePerm;

    // Requiere permiso global
    if (item.requirePerm && !can(item.requirePerm)) return false;

    return true;
  };

  const visibleItems = NAV_ITEMS.filter(isVisible);

  return (
    <View style={styles.sidebar}>

      {/* Logo — click para toggle */}
      <TouchableOpacity
        style={[
          styles.logoRow,
          isExpanded && styles.logoRowExpanded,
          Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}
        ]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        {isExpanded ? (
          <Image source={LOGO} style={styles.logoImgExpanded} resizeMode="contain" />
        ) : (
          <Image source={LETRA} style={styles.logoImgCollapsed} resizeMode="contain" />
        )}
      </TouchableOpacity>

      {/* Nav — solo ítems autorizados, sin indicadores de carga */}
      <View style={styles.nav}>
        {visibleItems.map(({ icon, label, route }) => {
          const isActive = pathname === route ||
            (route !== '/' && pathname.startsWith(route));

          return (
            <TouchableOpacity
              key={`${icon}-${label}`}
              style={[
                styles.navItem,
                isActive && styles.navItemActive,
                isExpanded && styles.navItemExpanded,
                Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {}
              ]}
              onPress={() => router.push(route as any)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={icon}
                size={20}
                color={isActive ? colors.surface : 'rgba(255,255,255,0.55)'}
              />
              {isExpanded && (
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Logout — siempre visible con color diferenciado */}
      <TouchableOpacity
        style={[
          styles.logoutItem,
          isExpanded && styles.navItemExpanded,
          Platform.OS === 'web' ? ({ cursor: 'pointer', title: 'Cerrar Sesión' } as any) : {}
        ]}
        onPress={logout}
        activeOpacity={0.75}
      >
        <Ionicons name="log-out-outline" size={20} color="#f87171" />
        <Text style={[styles.navLabel, styles.logoutLabel]}>
          {isExpanded ? 'Cerrar Sesión' : 'Salir'}
        </Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: colors.darkBg,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
  logoRowExpanded: {
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.sm,
  },
  logoImgCollapsed: { width: 40, height: 40 },
  logoImgExpanded:  { width: 140, height: 40 },
  nav: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  navItem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  navItemActive: {
    backgroundColor: colors.primary,
  },
  navItemExpanded: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.sm,
  },
  logoutItem: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    flexDirection: 'row',
    gap: 4,
  },
  logoutLabel: {
    color: '#f87171',
    fontSize: 9,
    marginLeft: 2,
  },
  navLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily,
    marginLeft: spacing.sm,
  },
  navLabelActive: {
    color: colors.surface,
    fontWeight: typography.weights.medium,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginTop: spacing.xs,
  } as any,
  statusText: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
});
