import { UsuariosRepositoryPort, UsuarioAsignacion } from '../domain/UsuariosRepositoryPort';

export class ListarAsignacionesUsuarioUseCase {
  constructor(private repo: UsuariosRepositoryPort) {}
  async ejecutar(userId: number): Promise<UsuarioAsignacion[]> {
    return this.repo.listarAsignaciones(userId);
  }
}
