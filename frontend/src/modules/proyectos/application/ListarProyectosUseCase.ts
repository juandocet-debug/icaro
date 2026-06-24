import { ProyectoRepositoryPort, PaginatedProyectos } from '../domain/ProyectoRepositoryPort';

export class ListarProyectosUseCase {
  constructor(private repository: ProyectoRepositoryPort) {}

  async ejecutar(page = 1): Promise<PaginatedProyectos> {
    return this.repository.listar(page);
  }
}
