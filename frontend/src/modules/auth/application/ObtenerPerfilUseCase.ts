import { UserProfileRepositoryPort } from '../domain/UserProfileRepositoryPort';
import { UserProfile } from '../domain/UserProfile';

export class ObtenerPerfilUseCase {
  constructor(private perfilRepository: UserProfileRepositoryPort) {}

  async ejecutar(): Promise<UserProfile> {
    return this.perfilRepository.obtenerPerfil();
  }
}
