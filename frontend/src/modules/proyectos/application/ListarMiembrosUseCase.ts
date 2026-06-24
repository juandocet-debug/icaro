import { ProyectoMiembroRepositoryPort } from '../domain/ProyectoMiembroRepositoryPort';
import { ProyectoMiembro } from '../domain/ProyectoMiembro';

export class ListarMiembrosUseCase {
  constructor(private repo: ProyectoMiembroRepositoryPort) {}
  async ejecutar(proyectoId: string): Promise<ProyectoMiembro[]> {
    return this.repo.listar(proyectoId);
  }
}
