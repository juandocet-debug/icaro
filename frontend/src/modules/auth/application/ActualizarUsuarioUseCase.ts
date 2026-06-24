import { UsuariosRepositoryPort, UsuarioEntity, CrearUsuarioDTO } from '../domain/UsuariosRepositoryPort';

export class ActualizarUsuarioUseCase {
  constructor(private repo: UsuariosRepositoryPort) {}
  async ejecutar(
    userId: number,
    datos: Partial<CrearUsuarioDTO & { password?: string; is_active?: boolean; first_name?: string; last_name?: string }>
  ): Promise<UsuarioEntity> {
    return this.repo.actualizar(userId, datos);
  }
}
