export interface TipoDocumento {
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
}

export interface CreateTipoDocumentoDto {
  nombre: string;
  descripcion?: string;
  orden?: number;
}
