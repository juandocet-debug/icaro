import { Accion } from '../domain/Accion';
import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';

export class ListarAccionesUseCase {
  constructor(private repo: MetaRepositoryPort) {}
  async ejecutar(componenteId: string): Promise<Accion[]> {
    return this.repo.listarAcciones(componenteId);
  }
}
