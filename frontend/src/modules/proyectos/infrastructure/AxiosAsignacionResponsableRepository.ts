import { api } from '../../../services/api';
import {
  AsignacionResponsable,
  MiembroAsignable,
  AsignacionResponsableRepositoryPort
} from '../domain/AsignacionResponsableRepositoryPort';

type ApiAsignacion = {
  id: string;
  usuario_id: number;
  username: string;
  nombre_completo: string;
  tipo_asignacion: string;
  activo: boolean;
  foto_url: string | null;
};

type ApiUser = {
  id: number;
  username: string;
  nombre_completo: string;
  email: string;
};

const mapAsignacion = (d: ApiAsignacion): AsignacionResponsable => ({
  id: d.id,
  usuarioId: d.usuario_id,
  username: d.username,
  nombreCompleto: d.nombre_completo,
  tipoAsignacion: d.tipo_asignacion as 'responsable' | 'apoyo',
  activo: d.activo,
  fotoUrl: d.foto_url
});

const mapUser = (d: ApiUser): MiembroAsignable => ({
  id: d.id,
  username: d.username,
  nombreCompleto: d.nombre_completo,
  email: d.email
});

export class AxiosAsignacionResponsableRepository implements AsignacionResponsableRepositoryPort {
  async listarResponsables(componenteId: string, accionId: string): Promise<AsignacionResponsable[]> {
    const res = await api.get<{ ok: boolean; datos: ApiAsignacion[] }>(
      `/api/acciones/${componenteId}/acciones/${accionId}/responsables/`
    );
    return (res.data.datos || []).map(mapAsignacion);
  }

  async buscarMiembrosAsignables(componenteId: string, accionId: string, query?: string): Promise<MiembroAsignable[]> {
    const res = await api.get<{ ok: boolean; datos: ApiUser[] }>(
      `/api/acciones/${componenteId}/acciones/${accionId}/responsables/`,
      { params: { buscar: 1, q: query || '' } }
    );
    return (res.data.datos || []).map(mapUser);
  }

  async asignarResponsable(
    componenteId: string,
    accionId: string,
    usuarioId: number,
    tipoAsignacion: 'responsable' | 'apoyo'
  ): Promise<AsignacionResponsable> {
    const res = await api.post<{ ok: boolean; datos: ApiAsignacion }>(
      `/api/acciones/${componenteId}/acciones/${accionId}/responsables/`,
      { usuario_id: usuarioId, tipo_asignacion: tipoAsignacion }
    );
    return mapAsignacion(res.data.datos);
  }

  async retirarResponsable(componenteId: string, accionId: string, asignacionId: string): Promise<void> {
    await api.delete(
      `/api/acciones/${componenteId}/acciones/${accionId}/responsables/${asignacionId}/`
    );
  }

  async listarMisActividades(estado?: string, q?: string, page?: number, proyectoId?: string): Promise<{ count: number; datos: any[] }> {
    const res = await api.get<{ ok: boolean; count: number; datos: any[] }>(
      '/api/mis-actividades/',
      { params: { estado, q, page, proyecto_id: proyectoId || undefined } }
    );
    return {
      count: res.data.count,
      datos: res.data.datos || []
    };
  }

  async registrarEjecucion(accionId: string, cantidad: number): Promise<any> {
    const res = await api.post<{ ok: boolean; datos: any }>(
      `/api/mis-actividades/${accionId}/ejecucion/`,
      { cantidad }
    );
    return res.data.datos;
  }
}
