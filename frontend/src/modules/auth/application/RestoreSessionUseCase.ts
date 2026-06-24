import { AuthRepositoryPort } from '../domain/AuthRepositoryPort';
import { TokenStoragePort } from '../domain/TokenStoragePort';
import { AuthTokens } from '../domain/AuthTokens';

export class RestoreSessionUseCase {
  constructor(
    private authRepository: AuthRepositoryPort,
    private tokenStorage: TokenStoragePort
  ) {}

  async ejecutar(): Promise<AuthTokens | null> {
    const refresh = await this.tokenStorage.getRefreshToken();
    if (!refresh) {
      return null;
    }

    try {
      // Intentar refrescar la sesión usando el token de refresco guardado
      const newTokens = await this.authRepository.refreshToken(refresh);
      await this.tokenStorage.saveTokens(newTokens.access, newTokens.refresh);
      return newTokens;
    } catch (error) {
      // Si falla (ej: token expirado o inválido), limpiamos las credenciales
      await this.tokenStorage.clearTokens();
      return null;
    }
  }
}
