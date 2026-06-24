import { RolRepositoryPort } from '../domain/RolRepositoryPort';

export class EliminarRolUseCase {
  constructor(private repo: RolRepositoryPort) {}
  async ejecutar(id: string): Promise<void> {
    return this.repo.eliminar(id);
  }
}
