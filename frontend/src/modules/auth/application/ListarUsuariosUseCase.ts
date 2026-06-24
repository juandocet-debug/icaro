import { UsuariosRepositoryPort, UsuarioEntity } from '../domain/UsuariosRepositoryPort';

export class ListarUsuariosUseCase {
  constructor(private repo: UsuariosRepositoryPort) {}
  async ejecutar(q?: string): Promise<UsuarioEntity[]> {
    return this.repo.listar(q);
  }
}
