import { RolRepositoryPort } from '../domain/RolRepositoryPort';
import { Rol } from '../domain/Rol';

export class ListarRolesUseCase {
  constructor(private repo: RolRepositoryPort) {}
  async ejecutar(): Promise<Rol[]> {
    return this.repo.listar();
  }
}
