export interface EvidenciaSubida {
  id: string;
  accionId: string | null;
  requisitoId: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  status: 'pendiente' | 'aprobado' | 'rechazado';
}

export interface UploadRepositoryPort {
  subirEvidencia(accionId: string, archivo: File, requisitoId?: string): Promise<EvidenciaSubida>;
  listarEvidencias(accionId: string): Promise<EvidenciaSubida[]>;
}
