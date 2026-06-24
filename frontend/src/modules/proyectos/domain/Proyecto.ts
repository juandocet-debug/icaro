export type EstadoProyecto = 'activo' | 'inactivo' | 'completado' | 'suspendido';

export interface Proyecto {
  id: string;
  name: string;
  contractNumber: string | null;
  contractObject: string | null;
  description: string | null;
  status: EstadoProyecto;
  startDate: string | null;
  endDate: string | null;
  createdById: number | null;
  coverImageUrl: string | null;
}
