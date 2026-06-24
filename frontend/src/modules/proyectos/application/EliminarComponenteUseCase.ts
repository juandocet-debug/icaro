import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';

export class EliminarComponenteUseCase {
  constructor(private readonly repositorio: MetaRepositoryPort) {}

  ejecutar(proyectoId: string, compId: string): Promise<void> {
    return this.repositorio.eliminarComponente(proyectoId, compId);
  }
}
