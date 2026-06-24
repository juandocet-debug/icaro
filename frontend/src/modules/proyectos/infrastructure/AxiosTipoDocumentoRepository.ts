import { api } from '../../../services/api';
import { TipoDocumento, CreateTipoDocumentoDto } from '../domain/TipoDocumento';

export class AxiosTipoDocumentoRepository {
  async listar(proyectoId: string): Promise<TipoDocumento[]> {
    const res = await api.get<{ results: any[] } | { ok: boolean; datos: any[] }>(
      `/api/proyectos/${proyectoId}/tipos-documento/`
    );
    const items = 'results' in res.data ? res.data.results : (res.data as any).datos;
    return items.map((d: any) => ({
      id: d.id, nombre: d.nombre,
      descripcion: d.descripcion, orden: d.orden,
    }));
  }

  async crear(proyectoId: string, dto: CreateTipoDocumentoDto): Promise<TipoDocumento> {
    const res = await api.post<{ ok: boolean; datos: any }>(
      `/api/proyectos/${proyectoId}/tipos-documento/`, dto
    );
    const d = res.data.datos;
    return { id: d.id, nombre: d.nombre, descripcion: d.descripcion, orden: d.orden };
  }

  async eliminar(proyectoId: string, tipoId: string): Promise<void> {
    await api.delete(`/api/proyectos/${proyectoId}/tipos-documento/${tipoId}/`);
  }

  async actualizar(proyectoId: string, tipoId: string,
                   nombre: string, descripcion?: string): Promise<TipoDocumento> {
    const res = await api.patch<{ ok: boolean; datos: any }>(
      `/api/proyectos/${proyectoId}/tipos-documento/${tipoId}/`,
      { nombre, descripcion: descripcion ?? null }
    );
    const d = res.data.datos;
    return { id: d.id, nombre: d.nombre, descripcion: d.descripcion, orden: d.orden };
  }
}
