/**
 * Perfil de acceso efectivo del usuario autenticado.
 *
 * Los permisos incluyen su alcance para que el frontend no confunda un permiso
 * de proyecto con uno global.
 */
export interface PermisoConAlcance {
  codigo: string;
  /** 'global' | 'proyecto' | 'componente' | 'accion' */
  alcance: string;
}

export interface AsignacionPerfil {
  rolCodigo: string;
  rolNombre: string;
  tipoAlcance: string;
  proyectoId: string | null;
  proyectoNombre: string | null;
  componenteId: string | null;
  accionId: string | null;
  permisos?: string[];
}

export interface AccessProfile {
  esSuperadministrador: boolean;
  /** Permisos con su alcance real. Un permiso de alcance 'proyecto' no es global. */
  permisos: PermisoConAlcance[];
  asignaciones: AsignacionPerfil[];
}
