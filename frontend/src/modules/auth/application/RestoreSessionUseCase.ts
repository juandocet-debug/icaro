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
      // Web: intentar recuperar el access token de sessionStorage primero.
      // sessionStorage persiste durante F5 dentro de la misma pestaña.
      const existingToken = await this.tokenStorage.getAccessToken();
      if (existingToken) {
        // Token encontrado en sessionStorage — sesión activa, no hace falta refresh
        return { access: existingToken, refresh: '' } as any;
      }

      // Sin token en sessionStorage: intentar refresh silencioso via cookie HTTP-Only.
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
