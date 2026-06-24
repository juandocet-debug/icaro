import { Meta } from '../domain/Meta';
import { MetaRepositoryPort } from '../domain/MetaRepositoryPort';

export class CrearMetaUseCase {
  constructor(private repo: MetaRepositoryPort) {}
  async ejecutar(
    proyectoId: string,
    datos: {
      nombre: string;
      descripcion?: string;
    }
  ): Promise<Meta> {
    return this.repo.crear(proyectoId, datos);
  }
}
