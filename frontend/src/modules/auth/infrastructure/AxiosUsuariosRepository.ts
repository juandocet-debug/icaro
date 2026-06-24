import { api } from '../../../services/api';
import { UsuariosRepositoryPort, UsuarioEntity, UsuarioAsignacion, CrearUsuarioDTO } from '../domain/UsuariosRepositoryPort';

type ApiUsuario = {
  id: number;
  username: string;
  email: string;
  nombre_completo: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  telefono: string | null;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  asignaciones_count: number;
  /** URL absoluta de la foto. El backend ya construye la URL completa. */
  foto_url: string | null;
};

type ApiAsignacion = {
  proyecto_id: string | null;
  proyecto_nombre: string | null;
  rol_codigo: string;
  rol_nombre: string;
  componente_id: string | null;
  accion_id: string | null;
  activo: boolean;
};

const mapearUsuario = (u: ApiUsuario): UsuarioEntity => ({
  id: u.id,
  username: u.username,
  email: u.email,
  nombreCompleto: u.nombre_completo,
  primerNombre: u.primer_nombre,
  segundoNombre: u.segundo_nombre,
  primerApellido: u.primer_apellido,
  segundoApellido: u.segundo_apellido,
  telefono: u.telefono,
  isStaff: u.is_staff,
  isSuperuser: u.is_superuser,
  isActive: u.is_active,
  asignacionesCount: u.asignaciones_count ?? 0,
  photoUrl: u.foto_url ?? null,
});

const mapearAsignacion = (a: ApiAsignacion): UsuarioAsignacion => ({
  proyectoId: a.proyecto_id,
  proyectoNombre: a.proyecto_nombre,
  rolCodigo: a.rol_codigo,
  rolNombre: a.rol_nombre,
  componenteId: a.componente_id,
  accionId: a.accion_id,
  activo: a.activo,
});

export class AxiosUsuariosRepository implements UsuariosRepositoryPort {
  async listar(q?: string): Promise<UsuarioEntity[]> {
    const url = q ? `/api/auth/usuarios/?q=${encodeURIComponent(q)}` : '/api/auth/usuarios/';
    const res = await api.get<{ ok: boolean; datos: ApiUsuario[] }>(url);
    return res.data.datos.map(mapearUsuario);
  }

  async crear(dto: CrearUsuarioDTO): Promise<UsuarioEntity> {
    const res = await api.post<{ ok: boolean; datos: ApiUsuario }>('/api/auth/usuarios/', {
      cedula: dto.cedula,
      primer_nombre: dto.primer_nombre,
      segundo_nombre: dto.segundo_nombre ?? '',
      primer_apellido: dto.primer_apellido,
      segundo_apellido: dto.segundo_apellido ?? '',
      email: dto.email,
      telefono: dto.telefono ?? '',
    });
    return mapearUsuario(res.data.datos);
  }

  async actualizarActivo(userId: number, isActive: boolean): Promise<void> {
    await api.patch(`/api/auth/usuarios/${userId}/`, { is_active: isActive });
  }

  async listarAsignaciones(userId: number): Promise<UsuarioAsignacion[]> {
    const res = await api.get<{ ok: boolean; datos: ApiAsignacion[] }>(
      `/api/auth/usuarios/${userId}/asignaciones/`
    );
    return res.data.datos.map(mapearAsignacion);
  }

  async actualizar(
    userId: number,
    datos: Partial<CrearUsuarioDTO & { password?: string; is_active?: boolean; first_name?: string; last_name?: string }>
  ): Promise<UsuarioEntity> {
    const res = await api.put<{ ok: boolean; datos: ApiUsuario }>(`/api/auth/usuarios/${userId}/`, datos);
    return mapearUsuario(res.data.datos);
  }

  async eliminar(userId: number): Promise<void> {
    await api.delete(`/api/auth/usuarios/${userId}/`);
  }
}
