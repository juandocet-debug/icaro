export interface CreateProyectoDto {
  name: string;
  contractNumber?: string;
  contractObject?: string;
  description?: string;
  status?: 'activo' | 'inactivo' | 'completado' | 'suspendido';
  startDate?: string;
  endDate?: string;
}
