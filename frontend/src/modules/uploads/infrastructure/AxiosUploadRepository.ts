import { api } from '../../../services/api';
import { EvidenciaSubida, UploadRepositoryPort } from '../domain/UploadRepositoryPort';

type ApiUpload = {
  id: string;
  accion_id: string | null;
  requisito_id: string | null;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  status: string;
};

const map = (d: ApiUpload): EvidenciaSubida => ({
  id: d.id,
  accionId: d.accion_id,
  requisitoId: d.requisito_id,
  fileUrl: d.file_url,
  fileName: d.file_name,
  fileType: d.file_type,
  fileSize: d.file_size,
  status: d.status as EvidenciaSubida['status'],
});

export class AxiosUploadRepository implements UploadRepositoryPort {
  async subirEvidencia(accionId: string, archivo: File, requisitoId?: string): Promise<EvidenciaSubida> {
    const form = new FormData();
    form.append('archivo', archivo);
    if (requisitoId) form.append('requisito_id', requisitoId);
    const res = await api.post<{ ok: boolean; datos: ApiUpload }>(
      `/api/uploads/${accionId}/uploads/`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return map(res.data.datos);
  }

  async listarEvidencias(accionId: string): Promise<EvidenciaSubida[]> {
    const res = await api.get<{ ok: boolean; datos: ApiUpload[] }>(
      `/api/uploads/${accionId}/uploads/`,
    );
    return (res.data.datos ?? []).map(map);
  }
}
