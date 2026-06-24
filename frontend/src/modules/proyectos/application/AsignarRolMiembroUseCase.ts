import { ProyectoMiembroRepositoryPort } from '../domain/ProyectoMiembroRepositoryPort';
import { ProyectoMiembro } from '../domain/ProyectoMiembro';

export class AsignarRolMiembroUseCase {
  constructor(private repo: ProyectoMiembroRepositoryPort) {}
  async ejecutar(
    proyectoId: string,
    username: string,
    rolId: string,
    componenteId?: string | null,
    accionId?: string | null
  ): Promise<ProyectoMiembro> {
    return this.repo.agregar(proyectoId, username, rolId, componenteId, accionId);
  }
}
