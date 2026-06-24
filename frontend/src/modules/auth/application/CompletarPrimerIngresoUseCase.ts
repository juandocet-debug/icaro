import { UserProfileRepositoryPort } from '../domain/UserProfileRepositoryPort';
import { UserProfile } from '../domain/UserProfile';

export class CompletarPrimerIngresoUseCase {
  constructor(private repository: UserProfileRepositoryPort) {}

  async ejecutar(nuevaClave: string): Promise<UserProfile> {
    await this.repository.cambiarClave(nuevaClave);
    return await this.repository.obtenerPerfil();
  }
}
