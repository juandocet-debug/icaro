
export interface AsignacionResponsable {
  id: string;
  usuarioId: number;
  username: string;
  nombreCompleto: string;
  tipoAsignacion: 'responsable' | 'apoyo';
  activo: boolean;
  fotoUrl?: string | null;
}

export interface MiembroAsignable {
  id: number;
  username: string;
  nombreCompleto: string;
  email: string;
}

export interface AsignacionResponsableRepositoryPort {
  listarResponsables(componenteId: string, accionId: string): Promise<AsignacionResponsable[]>;
  buscarMiembrosAsignables(componenteId: string, accionId: string, query?: string): Promise<MiembroAsignable[]>;
  asignarResponsable(componenteId: string, accionId: string, usuarioId: number, tipoAsignacion: 'responsable' | 'apoyo'): Promise<AsignacionResponsable>;
  retirarResponsable(componenteId: string, accionId: string, asignacionId: string): Promise<void>;
  listarMisActividades(estado?: string, q?: string, page?: number, proyectoId?: string): Promise<{ count: number; datos: any[] }>;
  registrarEjecucion(accionId: string, cantidad: number): Promise<any>;
}
