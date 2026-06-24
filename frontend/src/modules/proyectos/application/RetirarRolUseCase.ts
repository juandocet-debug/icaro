import { ProyectoMiembroRepositoryPort } from '../domain/ProyectoMiembroRepositoryPort';

export class RetirarRolUseCase {
  constructor(private repo: ProyectoMiembroRepositoryPort) {}
  async ejecutar(proyectoId: string, asignacionId: string): Promise<void> {
    return this.repo.retirarRol(proyectoId, asignacionId);
  }
}
