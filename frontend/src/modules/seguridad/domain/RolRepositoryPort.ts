import { Rol, CreateRolDto, UpdateRolDto } from './Rol';
import { Permiso } from './Permiso';

export interface RolRepositoryPort {
  listar(activo?: boolean): Promise<Rol[]>;
  obtener(id: string): Promise<Rol>;
  crear(dto: CreateRolDto): Promise<Rol>;
  actualizar(id: string, dto: UpdateRolDto): Promise<Rol>;
  eliminar(id: string): Promise<void>;
  listarPermisos(): Promise<Permiso[]>;
}
