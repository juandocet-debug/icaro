import { EvidenciaSubida, UploadRepositoryPort } from '../domain/UploadRepositoryPort';

export class SubirEvidenciaUseCase {
  constructor(private readonly repo: UploadRepositoryPort) {}

  async ejecutar(accionId: string, archivo: File, requisitoId?: string): Promise<EvidenciaSubida> {
    return this.repo.subirEvidencia(accionId, archivo, requisitoId);
  }
}
