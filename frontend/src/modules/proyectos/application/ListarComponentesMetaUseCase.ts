import { Componente } from '../domain/Componente';
import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';

export class ListarComponentesMetaUseCase {
  constructor(private repo: MetaRepositoryPort) {}
  async ejecutar(proyectoId: string, metaId: string): Promise<Componente[]> {
    return this.repo.listarComponentes(proyectoId, metaId);
  }
}
