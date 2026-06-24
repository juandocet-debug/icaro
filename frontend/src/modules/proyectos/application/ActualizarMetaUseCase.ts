import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';
import { Meta } from '../domain/Meta';

export class ActualizarMetaUseCase {
  constructor(private readonly repositorio: MetaRepositoryPort) {}

  ejecutar(proyectoId: string, metaId: string, datos: { nombre?: string; descripcion?: string }): Promise<Meta> {
    return this.repositorio.actualizar(proyectoId, metaId, datos);
  }
}
