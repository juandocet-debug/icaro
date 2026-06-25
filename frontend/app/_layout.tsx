import React, { useEffect, useState } from 'react';
import { Slot, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { AuthProvider } from '../src/modules/auth/presentation/AuthContext';
import { AccessProvider, useAccess } from '../src/modules/auth/presentation/useAccess';
import { useAuth } from '../src/modules/auth/presentation/useAuth';
import { LoadingScreen } from '../src/shared/components/LoadingScreen';
import { Sidebar } from '../src/shared/components/Sidebar';
import { colors } from '../src/shared/constants/colors';
import { View, Platform, StyleSheet } from 'react-native';
import { ROUTE_RULES } from '../src/shared/routePermissions';
import { MobileBottomTabs } from '../src/shared/components/MobileBottomTabs';
import { useIsMobile } from '../src/shared/hooks/useIsMobile';

const W_COLLAPSED = 72;
const W_EXPANDED  = 220;

/** Segmentos que se renderizan sin el shell (Sidebar + layout) */
const BARE_SEGMENTS = new Set(['login', 'primer-ingreso', 'acceso-denegado']);

const InitialLayout = () => {
  const isMobile = useIsMobile();
  const { isAuthenticated, isLoading: authLoading, userProfile } = useAuth();
  const { accessProfile, isLoading: accessLoading, accessError, can } = useAccess();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const [isExpanded, setIsExpanded] = useState(false);

  // Mantener carga hasta que accessProfile esté listo cuando el usuario está autenticado.
  // Sin esto, el efecto de navegación se dispara con accessProfile=null, causa una
  // redirección temprana, luego otra cuando carga el perfil → parpadeo visible.
  const isLoading =
    authLoading ||
    (isAuthenticated && (accessLoading || (!accessProfile && !accessError)));
  const rootSegment = (segments[0] ?? '') as string;

  useEffect(() => {
    if (isLoading || !rootNavigationState?.key) return;

    // ── 1. Sin autenticación → login ──────────────────────────────────────────
    if (!isAuthenticated) {
      if (!BARE_SEGMENTS.has(rootSegment)) {
        router.replace('/login');
      }
      return;
    }

    // ── 2. Autenticado en login → redirigir ───────────────────────────────────
    // ── 3. Primer ingreso (must_change_password) ──────────────────────────────
    if (userProfile?.mustChangePassword && rootSegment !== 'primer-ingreso') {
      router.replace('/primer-ingreso');
      return;
    }

    if (rootSegment === 'login') {
      router.replace('/');
      return;
    }

    if (!userProfile?.mustChangePassword && accessProfile) {
      // ── 4. PostLoginRedirect: usuarios no-superadmin van directo a /proyectos ─
      // Superadministrador permanece en /. Usuarios operativos con asignaciones van
      // a /proyectos (su punto de entrada operativo). Usuarios SIN asignaciones
      // permanecen en / para ver NoAssignmentsScreen con acceso a perfil y logout.
      if (rootSegment === '' && !accessProfile.esSuperadministrador && accessProfile.asignaciones.length > 0) {
        router.replace('/proyectos');
        return;
      }

      // ── 5. Guard dinámico por ruta ─────────────────────────────────────────
      const rule = ROUTE_RULES[rootSegment];
      if (!rule) return;

      const isSuperAdmin = accessProfile.esSuperadministrador;

      if (rule.requireSuperAdmin && !isSuperAdmin) {
        router.replace('/acceso-denegado');
        return;
      }

      if (rule.requireAnyPerm && !isSuperAdmin) {
        const hasPerm = rule.requireAnyPerm.some((p) => can(p));
        if (!hasPerm) {
          router.replace('/acceso-denegado');
          return;
        }
      }

      if (rule.requireAssignment && !isSuperAdmin) {
        if (accessProfile.asignaciones.length === 0) {
          router.replace('/acceso-denegado');
          return;
        }
      }
    }
  }, [isAuthenticated, isLoading, rootNavigationState?.key, segments, userProfile, accessProfile]);

  // Slot debe montarse antes de realizar redirecciones con Expo Router.
  // La capa de carga evita que se exponga contenido mientras se restaura la sesión.
  if (isLoading) {
    return (
      <View style={styles.loadingRoot}>
        <Slot />
        <View style={styles.loadingOverlay}>
          <LoadingScreen />
        </View>
      </View>
    );
  }

  // Rutas bare (sin shell)
  if (BARE_SEGMENTS.has(rootSegment)) return <Slot />;
  if (!isAuthenticated) return <Slot />;

  const sidebarWidth = isExpanded ? W_EXPANDED : W_COLLAPSED;

  return (
    <View style={[
      styles.root,
      { flexDirection: !isMobile ? 'row' : 'column' }
    ]}>
      {!isMobile && (
        <View
          style={[
            styles.sidebarWrapper,
            { width: sidebarWidth },
            Platform.OS === 'web'
              ? ({ transition: 'width 250ms ease' } as any)
              : {},
          ]}
        >
          <Sidebar
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(v => !v)}
          />
        </View>
      )}
      <View style={[
        styles.main,
        isMobile ? { margin: 0, marginLeft: 0, borderRadius: 0 } : {}
      ]}>
        <Slot />
      </View>
      {isMobile && <MobileBottomTabs />}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.darkBg,
    ...(Platform.OS === 'web' ? { height: '100vh' } as any : {}),
  },
  loadingRoot: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  sidebarWrapper: {
    margin: 10,
    marginRight: 0,
    borderRadius: 20,
    overflow: 'hidden' as any,
    backgroundColor: colors.darkBg,
    flexShrink: 0,
  },
  main: {
    flex: 1,
    backgroundColor: colors.background,
    margin: 10,
    marginLeft: 4,
    borderRadius: 20,
    overflow: 'hidden' as any,
  },
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <AccessProvider>
        <InitialLayout />
      </AccessProvider>
    </AuthProvider>
  );
}
