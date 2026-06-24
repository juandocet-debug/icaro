import { AccessRepositoryPort } from '../domain/AccessRepositoryPort';
import { AccessProfile } from '../domain/AccessProfile';

export class ObtenerMiAccesoUseCase {
  constructor(private repo: AccessRepositoryPort) {}
  async ejecutar(): Promise<AccessProfile> {
    return this.repo.obtenerMiAcceso();
  }
}
