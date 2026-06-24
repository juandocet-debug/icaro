import { api } from '../../../services/api';
import { Meta } from '../domain/Meta';
import { Componente } from '../domain/Componente';
import { Accion } from '../domain/Accion';
import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';

type ApiMeta = {
  id: string;
  proyecto_id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  cantidad_componentes?: number;
  cantidad_acciones?: number;
  created_at?: string | null;
};

type ApiComponente = {
  id: string;
  proyecto_id: string;
  meta_id: string;
  name: string;
  description: string | null;
};

type ApiAccion = {
  id: string;
  componente_id: string;
  name: string;
  description: string | null;
  unidad_medida: string | null;
  proyeccion_cuantitativa: string | null;
  ejecucion_acumulada: string;
  avance_porcentaje?: number | null;
  requisitos_verificacion?: any[];
  resumen_verificacion?: {
    total_requisitos: number;
    requisitos_cumplidos: number;
    estado: string;
  } | null;
  responsables?: { id: string; username: string; nombre_completo: string; foto_url: string | null }[];
  start_date?: string | null;
  end_date?: string | null;
};

const mapMeta = (d: ApiMeta): Meta => ({
  id: d.id,
  proyectoId: d.proyecto_id,
  nombre: d.nombre,
  descripcion: d.descripcion,
  activo: d.activo,
  cantidadComponentes: d.cantidad_componentes,
  cantidadAcciones: d.cantidad_acciones,
  createdAt: d.created_at ?? null,
});

const mapComponente = (d: ApiComponente): Componente => ({
  id: d.id,
  proyectoId: d.proyecto_id,
  metaId: d.meta_id,
  nombre: d.name,
  descripcion: d.description,
});

const mapAccion = (d: ApiAccion): Accion => ({
  id: d.id,
  componenteId: d.componente_id,
  nombre: d.name,
  descripcion: d.description,
  unidadMedida: d.unidad_medida,
  proyeccion: d.proyeccion_cuantitativa != null ? Number(d.proyeccion_cuantitativa) : null,
  ejecucion: Number(d.ejecucion_acumulada || 0),
  avancePorcentaje: d.avance_porcentaje ?? null,
  requisitosVerificacion: d.requisitos_verificacion ?? [],
  resumenVerificacion: d.resumen_verificacion
    ? {
        total_requisitos: d.resumen_verificacion.total_requisitos,
        requisitos_cumplidos: d.resumen_verificacion.requisitos_cumplidos,
        estado: d.resumen_verificacion.estado as any,
      }
    : null,
  responsables: (d.responsables ?? []).map(r => ({
    id: r.id,
    username: r.username,
    nombreCompleto: r.nombre_completo,
    fotoUrl: r.foto_url,
  })),
  startDate: d.start_date ?? null,
  endDate: d.end_date ?? null,
});

export class AxiosMetaRepository implements MetaRepositoryPort {
  async listar(proyectoId: string): Promise<Meta[]> {
    const res = await api.get<{ ok: boolean; datos: ApiMeta[] }>(
      `/api/proyectos/${proyectoId}/metas/`
    );
    return (res.data.datos || []).map(mapMeta);
  }

  async obtener(proyectoId: string, metaId: string): Promise<Meta> {
    const res = await api.get<{ ok: boolean; datos: ApiMeta }>(
      `/api/proyectos/${proyectoId}/metas/${metaId}/`
    );
    return mapMeta(res.data.datos);
  }

  async crear(proyectoId: string, datos: { nombre: string; descripcion?: string }): Promise<Meta> {
    const res = await api.post<{ ok: boolean; datos: ApiMeta }>(
      `/api/proyectos/${proyectoId}/metas/`,
      { nombre: datos.nombre, descripcion: datos.descripcion }
    );
    return mapMeta(res.data.datos);
  }

  async actualizar(proyectoId: string, metaId: string, datos: { nombre?: string; descripcion?: string }): Promise<Meta> {
    const payload: any = {};
    if (datos.nombre !== undefined) payload.nombre = datos.nombre;
    if (datos.descripcion !== undefined) payload.descripcion = datos.descripcion;
    const res = await api.patch<{ ok: boolean; datos: ApiMeta }>(
      `/api/proyectos/${proyectoId}/metas/${metaId}/`,
      payload
    );
    return mapMeta(res.data.datos);
  }

  async archivar(proyectoId: string, metaId: string): Promise<void> {
    await api.post(`/api/proyectos/${proyectoId}/metas/${metaId}/archivar/`);
  }

  async eliminar(proyectoId: string, metaId: string): Promise<void> {
    await api.delete(`/api/proyectos/${proyectoId}/metas/${metaId}/`);
  }

  async listarComponentes(proyectoId: string, metaId: string): Promise<Componente[]> {
    const res = await api.get<{ ok: boolean; datos: ApiComponente[] }>(
      `/api/componentes/${proyectoId}/componentes/?meta_id=${metaId}`
    );
    return (res.data.datos || []).map(mapComponente);
  }

  async crearComponente(proyectoId: string, metaId: string, datos: { nombre: string; descripcion?: string }): Promise<Componente> {
    const res = await api.post<{ ok: boolean; datos: ApiComponente }>(
      `/api/componentes/${proyectoId}/componentes/`,
      { meta_id: metaId, name: datos.nombre, description: datos.descripcion }
    );
    return mapComponente(res.data.datos);
  }

  async listarAcciones(componenteId: string): Promise<Accion[]> {
    const res = await api.get<{ ok: boolean; datos: ApiAccion[] }>(
      `/api/acciones/${componenteId}/acciones/`
    );
    return (res.data.datos || []).map(mapAccion);
  }

  async crearAccion(componenteId: string, datos: {
    nombre: string;
    descripcion?: string;
    unidadMedida?: string;
    proyeccion?: number;
    requisitosVerificacion?: any[];
    tiposEvidencia?: string[];
    startDate?: string | null;
    endDate?: string | null;
  }): Promise<Accion> {
    const res = await api.post<{ ok: boolean; datos: ApiAccion }>(
      `/api/acciones/${componenteId}/acciones/`,
      {
        name: datos.nombre,
        description: datos.descripcion,
        unidad_medida: datos.unidadMedida,
        proyeccion_cuantitativa: datos.proyeccion ?? null,
        ejecucion_acumulada: 0,
        requisitos_verificacion: datos.requisitosVerificacion ?? [],
        tipos_evidencia_permitidos: datos.tiposEvidencia ?? [],
        start_date: datos.startDate ?? null,
        end_date: datos.endDate ?? null,
      }
    );
    return mapAccion(res.data.datos);
  }
  async actualizarComponente(proyectoId: string, compId: string, datos: { nombre?: string; descripcion?: string }): Promise<Componente> {
    const payload: any = {};
    if (datos.nombre !== undefined) payload.name = datos.nombre;
    if (datos.descripcion !== undefined) payload.description = datos.descripcion;
    const res = await api.put<{ ok: boolean; datos: ApiComponente }>(
      `/api/componentes/${proyectoId}/componentes/${compId}/`,
      payload
    );
    return mapComponente(res.data.datos);
  }

  async eliminarComponente(proyectoId: string, compId: string): Promise<void> {
    await api.delete(`/api/componentes/${proyectoId}/componentes/${compId}/`);
  }

  async actualizarAccion(compId: string, accionId: string, datos: {
    nombre?: string;
    descripcion?: string;
    unidadMedida?: string;
    proyeccion?: number;
    tiposEvidencia?: string[];
    startDate?: string | null;
    endDate?: string | null;
  }): Promise<Accion> {
    const payload: any = {};
    if (datos.nombre !== undefined) payload.name = datos.nombre;
    if (datos.descripcion !== undefined) payload.description = datos.descripcion;
    if (datos.unidadMedida !== undefined) payload.unidad_medida = datos.unidadMedida;
    if (datos.proyeccion !== undefined) payload.proyeccion_cuantitativa = datos.proyeccion;
    if (datos.tiposEvidencia !== undefined) payload.tipos_evidencia_permitidos = datos.tiposEvidencia;
    if (datos.startDate !== undefined) payload.start_date = datos.startDate;
    if (datos.endDate !== undefined) payload.end_date = datos.endDate;
    const res = await api.put<{ ok: boolean; datos: ApiAccion }>(
      `/api/acciones/${compId}/acciones/${accionId}/`,
      payload
    );
    return mapAccion(res.data.datos);
  }

  async eliminarAccion(compId: string, accionId: string): Promise<void> {
    await api.delete(`/api/acciones/${compId}/acciones/${accionId}/`);
  }
}
