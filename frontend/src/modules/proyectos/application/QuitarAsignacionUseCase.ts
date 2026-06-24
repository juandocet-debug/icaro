import { ProyectoMiembroRepositoryPort } from '../domain/ProyectoMiembroRepositoryPort';

export class QuitarAsignacionUseCase {
  constructor(private repo: ProyectoMiembroRepositoryPort) {}
  async ejecutar(proyectoId: string, miembroId: string): Promise<void> {
    return this.repo.eliminar(proyectoId, miembroId);
  }
}
