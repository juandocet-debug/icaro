import { Meta } from '../domain/Meta';
import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';

export class ListarMetasProyectoUseCase {
  constructor(private repo: MetaRepositoryPort) {}
  async ejecutar(proyectoId: string): Promise<Meta[]> {
    return this.repo.listar(proyectoId);
  }
}
