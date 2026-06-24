import { RolRepositoryPort } from '../domain/RolRepositoryPort';
import { Rol, CreateRolDto, UpdateRolDto } from '../domain/Rol';
import { Permiso } from '../domain/Permiso';
import { api } from '../../../services/api';

export class AxiosRolRepository implements RolRepositoryPort {
  async listar(activo?: boolean): Promise<Rol[]> {
    const url = activo !== undefined ? `/api/roles/roles/?activo=${activo}` : '/api/roles/roles/';
    const res = await api.get<{ ok: boolean; datos: Rol[] }>(url);
    return res.data.datos;
  }

  async obtener(id: string): Promise<Rol> {
    const res = await api.get<{ ok: boolean; datos: Rol }>(`/api/roles/roles/${id}/`);
    return res.data.datos;
  }

  async crear(dto: CreateRolDto): Promise<Rol> {
    const res = await api.post<{ ok: boolean; datos: Rol }>('/api/roles/roles/', dto);
    return res.data.datos;
  }

  async actualizar(id: string, dto: UpdateRolDto): Promise<Rol> {
    const res = await api.patch<{ ok: boolean; datos: Rol }>(`/api/roles/roles/${id}/`, dto);
    return res.data.datos;
  }

  async eliminar(id: string): Promise<void> {
    await api.delete(`/api/roles/roles/${id}/`);
  }

  async listarPermisos(): Promise<Permiso[]> {
    const res = await api.get<{ ok: boolean; datos: Permiso[] }>('/api/roles/permisos/');
    return res.data.datos;
  }
}
