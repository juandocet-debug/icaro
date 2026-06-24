import { ProyectoMiembroRepositoryPort } from '../domain/ProyectoMiembroRepositoryPort';
import { ProyectoMiembro } from '../domain/ProyectoMiembro';

export class ActualizarAlcanceMiembroUseCase {
  constructor(private repo: ProyectoMiembroRepositoryPort) {}
  async ejecutar(
    proyectoId: string,
    miembroId: string,
    rolId: string,
    componenteId?: string | null,
    accionId?: string | null
  ): Promise<ProyectoMiembro> {
    return this.repo.actualizarRol(proyectoId, miembroId, rolId, componenteId, accionId);
  }
}
