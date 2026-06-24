import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';

export class EliminarAccionUseCase {
  constructor(private readonly repositorio: MetaRepositoryPort) {}

  ejecutar(compId: string, accionId: string): Promise<void> {
    return this.repositorio.eliminarAccion(compId, accionId);
  }
}
