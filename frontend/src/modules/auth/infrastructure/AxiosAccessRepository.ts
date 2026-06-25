import { api } from '../../../services/api';
import { AccessRepositoryPort } from '../domain/AccessRepositoryPort';
import { AccessProfile, PermisoConAlcance, AsignacionPerfil } from '../domain/AccessProfile';

type ApiPermiso = { codigo: string; alcance: string };
type ApiAsignacion = {
  rol_codigo: string;
  rol_nombre: string;
  tipo_alcance: string;
  proyecto_id: string | null;
  proyecto_nombre: string | null;
  componente_id: string | null;
  accion_id: string | null;
  permisos?: string[];
};
type ApiAcceso = {
  ok: boolean;
  datos: {
    es_superadministrador: boolean;
    permisos: ApiPermiso[];
    asignaciones: ApiAsignacion[];
  };
};

export class AxiosAccessRepository implements AccessRepositoryPort {
  async obtenerMiAcceso(): Promise<AccessProfile> {
    const res = await api.get<ApiAcceso>('/api/auth/mi-acceso/');

    // Validar que el servidor devolvió una respuesta reconocible
    if (!res.data?.ok || !res.data?.datos) {
      throw new Error(
        `GET /api/auth/mi-acceso/ devolvió una respuesta inválida: ok=${res.data?.ok}`
      );
    }

    const d = res.data.datos;

    // Verificar campos mínimos obligatorios
    if (typeof d.es_superadministrador !== 'boolean') {
      throw new Error('Campo es_superadministrador ausente o incorrecto en la respuesta de mi-acceso.');
    }

    return {
      esSuperadministrador: d.es_superadministrador,
      permisos: Array.isArray(d.permisos)
        ? d.permisos.map((p: ApiPermiso): PermisoConAlcance => ({
            codigo: p.codigo,
            alcance: p.alcance,
          }))
        : [],
      asignaciones: Array.isArray(d.asignaciones)
        ? d.asignaciones.map((a: ApiAsignacion): AsignacionPerfil => ({
            rolCodigo: a.rol_codigo,
            rolNombre: a.rol_nombre,
            tipoAlcance: a.tipo_alcance,
            proyectoId: a.proyecto_id,
            proyectoNombre: a.proyecto_nombre,
            componenteId: a.componente_id,
            accionId: a.accion_id,
            permisos: a.permisos || [],
          }))
        : [],
    };
  }
}
