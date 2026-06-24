export interface Meta {
  id: string;
  proyectoId: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  cantidadComponentes?: number;
  cantidadAcciones?: number;
  createdAt?: string | null;
}
