export interface Rol {
  id: string;
  nombre: string;
  descripcion: string;
  es_sistema: boolean;
  activo: boolean;
  permisos: string[];
  cantidad_usuarios: number;
  tipo_alcance: 'global' | 'proyecto' | 'componente' | 'accion';
}

export interface CreateRolDto {
  nombre: string;
  descripcion: string;
  permisos: string[];
}

export interface UpdateRolDto {
  nombre?: string;
  descripcion?: string;
  permisos?: string[];
  activo?: boolean;
}
