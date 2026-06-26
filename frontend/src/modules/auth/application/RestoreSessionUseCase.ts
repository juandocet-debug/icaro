import { isWeb } from '../../../shared/utils/platform';
import { AuthRepositoryPort } from '../domain/AuthRepositoryPort';
import { TokenStoragePort } from '../domain/TokenStoragePort';
import { AuthTokens } from '../domain/AuthTokens';

export class RestoreSessionUseCase {
  constructor(
    private authRepository: AuthRepositoryPort,
    private tokenStorage: TokenStoragePort
  ) {}

  async ejecutar(): Promise<AuthTokens | null> {
    if (isWeb) {
      // Web: el refresh token viaja como cookie HTTP-Only.
      // Intentamos un refresh silencioso — el navegador envía la cookie automáticamente.
      try {
        const newTokens = await this.authRepository.refreshToken('');
        await this.tokenStorage.saveTokens(newTokens.access, (newTokens as any).refresh ?? '');
        return newTokens;
      } catch {
        // Cookie inexistente o expirada → sesión no restaurable
        return null;
      }
    }

    // Native: leer el refresh token desde SecureStore
    const refresh = await this.tokenStorage.getRefreshToken();
    if (!refresh) {
      return null;
    }

    try {
      const newTokens = await this.authRepository.refreshToken(refresh);
      await this.tokenStorage.saveTokens(newTokens.access, newTokens.refresh);
      return newTokens;
    } catch (error) {
      await this.tokenStorage.clearTokens();
      return null;
    }
  }
}
