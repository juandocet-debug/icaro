import { Meta } from '../domain/Meta';
import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';

export class ObtenerMetaUseCase {
  constructor(private repo: MetaRepositoryPort) {}
  async ejecutar(proyectoId: string, metaId: string): Promise<Meta> {
    return this.repo.obtener(proyectoId, metaId);
  }
}
