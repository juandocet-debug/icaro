export interface UsuarioEntity {
  id: number;
  username: string;
  email: string;
  nombreCompleto: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string | null;
  isStaff: boolean;
  isSuperuser: boolean;
  isActive: boolean;
  asignacionesCount: number;
  /** URL absoluta pública a la foto de perfil, o null si no tiene. */
  photoUrl: string | null;
}


export interface UsuarioAsignacion {
  proyectoId: string | null;
  proyectoNombre: string | null;
  rolCodigo: string;
  rolNombre: string;
  componenteId: string | null;
  accionId: string | null;
  activo: boolean;
}

export interface CrearUsuarioDTO {
  cedula: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  email: string;
  telefono?: string;
}

export interface UsuariosRepositoryPort {
  listar(q?: string): Promise<UsuarioEntity[]>;
  crear(dto: CrearUsuarioDTO): Promise<UsuarioEntity>;
  actualizarActivo(userId: number, isActive: boolean): Promise<void>;
  listarAsignaciones(userId: number): Promise<UsuarioAsignacion[]>;
  actualizar(
    userId: number,
    datos: Partial<CrearUsuarioDTO & { password?: string; is_active?: boolean; first_name?: string; last_name?: string }>
  ): Promise<UsuarioEntity>;
  eliminar(userId: number): Promise<void>;
}
