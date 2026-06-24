import { UsuariosRepositoryPort } from '../domain/UsuariosRepositoryPort';

export class ActualizarActivoUsuarioUseCase {
  constructor(private repo: UsuariosRepositoryPort) {}
  async ejecutar(userId: number, isActive: boolean): Promise<void> {
    return this.repo.actualizarActivo(userId, isActive);
  }
}
