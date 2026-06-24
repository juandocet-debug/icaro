import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';

export class EliminarMetaUseCase {
  constructor(private readonly repositorio: MetaRepositoryPort) {}

  ejecutar(proyectoId: string, metaId: string): Promise<void> {
    return this.repositorio.eliminar(proyectoId, metaId);
  }
}
