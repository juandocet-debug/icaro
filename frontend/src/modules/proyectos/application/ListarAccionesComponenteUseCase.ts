import { ProyectoMiembroRepositoryPort, ActionOption } from '../domain/ProyectoMiembroRepositoryPort';

export class ListarAccionesComponenteUseCase {
  constructor(private repo: ProyectoMiembroRepositoryPort) {}
  async ejecutar(componenteId: string): Promise<ActionOption[]> {
    return this.repo.listarAcciones(componenteId);
  }
}
