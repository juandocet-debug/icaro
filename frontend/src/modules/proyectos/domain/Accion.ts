export interface RequisitoVerificacion {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  obligatorio: boolean;
  tipos_archivo_permitidos: string[];
  min_archivos: number;
  max_archivos?: number | null;
  orden?: number;
  archivos_cargados?: number;
  cumplido?: boolean;
}

export interface ResumenVerificacion {
  total_requisitos: number;
  requisitos_cumplidos: number;
  estado: 'sin_requisitos' | 'pendiente' | 'incompleto' | 'completo';
}

export interface ResponsableResumen {
  id: string;
  username: string;
  nombreCompleto: string;
  fotoUrl?: string | null;
}

export interface Accion {
  id: string;
  componenteId: string;
  nombre: string;
  descripcion: string | null;
  unidadMedida: string | null;
  proyeccion: number | null;
  ejecucion: number;
  avancePorcentaje?: number | null;
  requisitosVerificacion: RequisitoVerificacion[];
  resumenVerificacion?: ResumenVerificacion | null;
  responsables?: ResponsableResumen[];
  startDate?: string | null;
  endDate?: string | null;
  requiereGrupos?: boolean;
}
