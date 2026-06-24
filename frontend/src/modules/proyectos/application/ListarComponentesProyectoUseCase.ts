import { ProyectoMiembroRepositoryPort, ComponentOption } from '../domain/ProyectoMiembroRepositoryPort';

export class ListarComponentesProyectoUseCase {
  constructor(private repo: ProyectoMiembroRepositoryPort) {}
  async ejecutar(proyectoId: string): Promise<ComponentOption[]> {
    return this.repo.listarComponentes(proyectoId);
  }
}
