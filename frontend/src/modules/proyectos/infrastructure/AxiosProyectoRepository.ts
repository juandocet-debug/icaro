import { ProyectoRepositoryPort, PaginatedProyectos } from '../domain/ProyectoRepositoryPort';
import { CreateProyectoDto } from '../domain/CreateProyectoDto';
import { Proyecto } from '../domain/Proyecto';
import { api } from '../../../services/api';

type ApiProyecto = {
  id: string;
  name: string;
  contract_number: string | null;
  contract_object: string | null;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_by_id: number | null;
  cover_image_url: string | null;
};

import { env } from '../../../config/env';

const API_BASE = env.apiUrl;

const toAbsolute = (url: string | null): string | null => {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
};

const mapear = (d: ApiProyecto): Proyecto => ({
  id: d.id,
  name: d.name,
  contractNumber: d.contract_number,
  contractObject: d.contract_object,
  description: d.description,
  status: d.status as Proyecto['status'],
  startDate: d.start_date,
  endDate: d.end_date,
  createdById: d.created_by_id,
  coverImageUrl: toAbsolute(d.cover_image_url),
});

export class AxiosProyectoRepository implements ProyectoRepositoryPort {
  async listar(page = 1): Promise<PaginatedProyectos> {
    const res = await api.get<{
      ok: boolean;
      count: number;
      next: string | null;
      previous: string | null;
      datos: ApiProyecto[];
    }>(`/api/proyectos/?page=${page}&page_size=20`);
    return {
      count: res.data.count,
      next: res.data.next,
      previous: res.data.previous,
      results: res.data.datos.map(mapear),
    };
  }

  async obtener(id: string): Promise<Proyecto> {
    const res = await api.get<{ ok: boolean; datos: ApiProyecto }>(
      `/api/proyectos/${id}/`
    );
    return mapear(res.data.datos);
  }

  async crear(dto: CreateProyectoDto): Promise<Proyecto> {
    const res = await api.post<{ ok: boolean; datos: ApiProyecto }>(
      '/api/proyectos/',
      {
        name:            dto.name,
        contract_number: dto.contractNumber ?? null,
        contract_object: dto.contractObject ?? null,
        description:     dto.description    ?? null,
        status:          dto.status         ?? 'activo',
        start_date:      dto.startDate      ?? null,
        end_date:        dto.endDate        ?? null,
      }
    );
    return mapear(res.data.datos);
  }

  async eliminar(id: string): Promise<void> {
    await api.delete(`/api/proyectos/${id}/`);
  }

  async actualizar(id: string, campos: Partial<Proyecto>): Promise<Proyecto> {
    const body: any = {};
    if (campos.name !== undefined) body.name = campos.name;
    if (campos.description !== undefined) body.description = campos.description;
    if (campos.contractNumber !== undefined) body.contract_number = campos.contractNumber;
    if (campos.contractObject !== undefined) body.contract_object = campos.contractObject;
    if (campos.status !== undefined) body.status = campos.status;
    if (campos.startDate !== undefined) body.start_date = campos.startDate;
    if (campos.endDate !== undefined) body.end_date = campos.endDate;

    const res = await api.put<{ ok: boolean; datos: ApiProyecto }>(
      `/api/proyectos/${id}/`,
      body
    );
    return mapear(res.data.datos);
  }

  async subirPortada(proyectoId: string, archivo: File): Promise<Proyecto> {
    const formData = new FormData();
    formData.append('portada', archivo);
    const res = await api.patch<{ ok: boolean; datos: ApiProyecto }>(
      `/api/proyectos/${proyectoId}/portada/`,
      formData
    );
    return mapear(res.data.datos);
  }
}
