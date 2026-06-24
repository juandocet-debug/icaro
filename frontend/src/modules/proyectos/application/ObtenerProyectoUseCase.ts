import { ProyectoRepositoryPort } from '../domain/ProyectoRepositoryPort';
import { Proyecto } from '../domain/Proyecto';

export class ObtenerProyectoUseCase {
  constructor(private repository: ProyectoRepositoryPort) {}

  async ejecutar(id: string): Promise<Proyecto> {
    return this.repository.obtener(id);
  }
}
