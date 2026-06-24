export interface MemberRole {
  id: string;
  rolId: string;
  rolNombre: string;
  componenteId: string | null;
  accionId: string | null;
}

export interface ProyectoMiembro {
  id: string;
  usuarioId: number;
  username: string;
  email: string;
  nombreCompleto: string;
  cargo: string | null;
  rolId: string;
  rolNombre: string;
  proyectoId: string | null;
  componenteId: string | null;
  accionId: string | null;
  photoUrl?: string | null;
  roles?: MemberRole[];
}

