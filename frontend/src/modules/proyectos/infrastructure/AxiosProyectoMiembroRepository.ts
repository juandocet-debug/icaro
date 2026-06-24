import { api } from '../../../services/api';
import { ProyectoMiembro } from '../domain/ProyectoMiembro';
import { ProyectoMiembroRepositoryPort, ComponentOption, ActionOption } from '../domain/ProyectoMiembroRepositoryPort';

type ApiMiembro = {
  id: string;
  usuario_id: number;
  username: string;
  email: string;
  nombre_completo: string;
  cargo: string | null;
  rol_id: string;
  rol_nombre: string;
  proyecto_id: string | null;
  componente_id: string | null;
  accion_id: string | null;
  foto_url?: string | null;
  roles?: {
    id: string;
    rol_id: string;
    rol_nombre: string;
    componente_id: string | null;
    accion_id: string | null;
  }[];
};

const mapear = (d: ApiMiembro): ProyectoMiembro => ({
  id: d.id,
  usuarioId: d.usuario_id,
  username: d.username,
  email: d.email,
  nombreCompleto: d.nombre_completo,
  cargo: d.cargo,
  rolId: d.rol_id,
  rolNombre: d.rol_nombre,
  proyectoId: d.proyecto_id,
  componenteId: d.componente_id,
  accionId: d.accion_id,
  photoUrl: d.foto_url ?? null,
  roles: d.roles ? d.roles.map(r => ({
    id: r.id,
    rolId: r.rol_id,
    rolNombre: r.rol_nombre,
    componenteId: r.componente_id,
    accionId: r.accion_id,
  })) : [],
});

export class AxiosProyectoMiembroRepository implements ProyectoMiembroRepositoryPort {
  async listar(proyectoId: string): Promise<ProyectoMiembro[]> {
    const res = await api.get<{ ok: boolean; datos: ApiMiembro[] }>(
      `/api/proyectos/${proyectoId}/miembros/`
    );
    return res.data.datos.map(mapear);
  }

  async agregar(
    proyectoId: string,
    username: string,
    rolId: string,
    componenteId?: string | null,
    accionId?: string | null
  ): Promise<ProyectoMiembro> {
    const res = await api.post<{ ok: boolean; datos: ApiMiembro }>(
      `/api/proyectos/${proyectoId}/miembros/`,
      {
        username,
        rol_id: rolId,
        componente_id: componenteId || null,
        accion_id: accionId || null,
      }
    );
    return mapear(res.data.datos);
  }

  async actualizarRol(
    proyectoId: string,
    miembroId: string,
    rolId: string,
    componenteId?: string | null,
    accionId?: string | null
  ): Promise<ProyectoMiembro> {
    const res = await api.patch<{ ok: boolean; datos: ApiMiembro }>(
      `/api/proyectos/${proyectoId}/miembros/${miembroId}/`,
      {
        rol_id: rolId,
        componente_id: componenteId || null,
        accion_id: accionId || null,
      }
    );
    return mapear(res.data.datos);
  }

  async actualizarAsignacionRol(
    proyectoId: string,
    asignacionId: string,
    rolId: string,
    componenteId?: string | null,
    accionId?: string | null
  ): Promise<ProyectoMiembro> {
    const res = await api.patch<{ ok: boolean; datos: ApiMiembro }>(
      `/api/proyectos/${proyectoId}/miembros/roles/${asignacionId}/`,
      {
        rol_id: rolId,
        componente_id: componenteId || null,
        accion_id: accionId || null,
      }
    );
    return mapear(res.data.datos);
  }

  async eliminar(proyectoId: string, miembroId: string): Promise<void> {
    await api.delete(`/api/proyectos/${proyectoId}/miembros/${miembroId}/`);
  }

  async retirarRol(proyectoId: string, asignacionId: string): Promise<void> {
    await api.delete(`/api/proyectos/${proyectoId}/miembros/roles/${asignacionId}/`);
  }

  async listarComponentes(proyectoId: string): Promise<ComponentOption[]> {
    const res = await api.get<{ ok: boolean; datos: any[] }>(
      `/api/componentes/${proyectoId}/componentes/`
    );
    const data = res.data.datos || [];
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      metaId: c.meta_id || null,
    }));
  }

  async listarAcciones(componenteId: string): Promise<ActionOption[]> {
    const res = await api.get<{ ok: boolean; datos: any[] }>(
      `/api/acciones/${componenteId}/acciones/`
    );
    return (res.data.datos || []).map((a) => ({ id: a.id, name: a.name, description: a.description,
      unidadMedida: a.unidad_medida, proyeccion: a.proyeccion_cuantitativa == null ? null : Number(a.proyeccion_cuantitativa),
      ejecucion: Number(a.ejecucion_acumulada || 0) }));
  }

  async crearComponente(proyectoId: string, metaId: string, nombre: string, descripcion?: string): Promise<ComponentOption> {
    const res = await api.post<{ ok: boolean; datos: any }>(`/api/componentes/${proyectoId}/componentes/`, { meta_id: metaId, name: nombre, description: descripcion });
    return { id: res.data.datos.id, name: res.data.datos.name, metaId: res.data.datos.meta_id };
  }

  async crearAccion(componenteId: string, datos: { nombre: string; descripcion?: string; unidadMedida?: string; proyeccion?: number; ejecucion?: number }): Promise<ActionOption> {
    const res = await api.post<{ ok: boolean; datos: any }>(`/api/acciones/${componenteId}/acciones/`, { name: datos.nombre, description: datos.descripcion, unidad_medida: datos.unidadMedida, proyeccion_cuantitativa: datos.proyeccion, ejecucion_acumulada: datos.ejecucion || 0 });
    const a = res.data.datos;
    return { id: a.id, name: a.name, description: a.description, unidadMedida: a.unidad_medida, proyeccion: a.proyeccion_cuantitativa == null ? null : Number(a.proyeccion_cuantitativa), ejecucion: Number(a.ejecucion_acumulada || 0) };
  }
}
