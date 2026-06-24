import { RolRepositoryPort } from '../domain/RolRepositoryPort';
import { UpdateRolDto, Rol } from '../domain/Rol';

export class ActualizarRolUseCase {
  constructor(private repo: RolRepositoryPort) {}
  async ejecutar(id: string, dto: UpdateRolDto): Promise<Rol> {
    return this.repo.actualizar(id, dto);
  }
}
