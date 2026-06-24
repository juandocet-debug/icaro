import { ProyectoMiembroRepositoryPort } from '../domain/ProyectoMiembroRepositoryPort';
import { ProyectoMiembro } from '../domain/ProyectoMiembro';

export class ActualizarAsignacionRolUseCase {
  constructor(private repo: ProyectoMiembroRepositoryPort) {}
  async ejecutar(
    proyectoId: string,
    asignacionId: string,
    rolId: string,
    componenteId?: string | null,
    accionId?: string | null
  ): Promise<ProyectoMiembro> {
    return this.repo.actualizarAsignacionRol(proyectoId, asignacionId, rolId, componenteId, accionId);
  }
}
