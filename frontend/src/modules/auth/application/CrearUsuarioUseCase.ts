import { UsuariosRepositoryPort, CrearUsuarioDTO, UsuarioEntity } from '../domain/UsuariosRepositoryPort';

export class CrearUsuarioUseCase {
  constructor(private repo: UsuariosRepositoryPort) {}
  async ejecutar(dto: CrearUsuarioDTO): Promise<UsuarioEntity> {
    return this.repo.crear(dto);
  }
}
