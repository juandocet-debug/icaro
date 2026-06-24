import { UsuariosRepositoryPort } from '../domain/UsuariosRepositoryPort';

export class EliminarUsuarioUseCase {
  constructor(private repo: UsuariosRepositoryPort) {}
  async ejecutar(userId: number): Promise<void> {
    return this.repo.eliminar(userId);
  }
}
