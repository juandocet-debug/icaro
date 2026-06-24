/**
 * routePermissions.ts
 *
 * Mapa centralizado de reglas de acceso por segmento de ruta.
 * El guard en _layout.tsx lo consulta para decidir si redirigir a /acceso-denegado.
 *
 * Reglas:
 *  - requireAuth     : la ruta requiere autenticación (siempre true para rutas internas).
 *  - requireSuperAdmin: solo accesible para superadministradores.
 *  - requireAnyPerm  : al menos uno de estos permisos (alcance global).
 *  - requireAssignment: true si basta tener cualquier asignación activa.
 *
 * Las rutas no listadas que requieran autenticación son evaluadas por el guard genérico.
 */
export interface RouteRule {
  requireAuth: boolean;
  requireSuperAdmin?: boolean;
  /** Al menos uno de estos permisos globales es suficiente */
  requireAnyPerm?: string[];
  /** Basta tener al menos una asignación activa (cualquier proyecto) */
  requireAssignment?: boolean;
}

/** Segmento raíz → regla */
export const ROUTE_RULES: Record<string, RouteRule> = {
  // --- Siempre accesible para autenticados (o sin asignación redirige a NoAssignments) ---
  '': {
    requireAuth: true,          // index → HomeScreen maneja internamente el NoAssignments
  },

  // --- Proyectos: cualquier autenticado puede entrar; el backend filtra por asignación real ---
  'proyectos': {
    requireAuth: true,
    // Sin requireAssignment: un usuario sin proyectos ve lista vacía segura.
    // La autorización por objeto ocurre en el backend (UsuarioRolModel activo).
  },

  // --- Seguridad: requiere permisos globales de administración ---
  'seguridad': {
    requireAuth: true,
    requireAnyPerm: ['usuarios.ver', 'roles.ver', 'permisos.ver'],
  },

  // --- usuarios (gestión): solo superadmin o con permiso global ---
  'usuarios': {
    requireAuth: true,
    requireAnyPerm: ['usuarios.ver'],
  },

  // --- Rutas públicas: no bloquear ---
  'login': { requireAuth: false },
  'primer-ingreso': { requireAuth: false },
  'acceso-denegado': { requireAuth: false },
};
