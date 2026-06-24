import { AuthRepositoryPort } from '../domain/AuthRepositoryPort';
import { TokenStoragePort } from '../domain/TokenStoragePort';
import { AuthTokens } from '../domain/AuthTokens';

export class LoginUseCase {
  constructor(
    private authRepository: AuthRepositoryPort,
    private tokenStorage: TokenStoragePort
  ) {}

  async ejecutar(username: string, password: string): Promise<AuthTokens> {
    if (!username.trim() || !password.trim()) {
      throw new Error('El usuario y la contraseña son requeridos.');
    }
    
    const tokens = await this.authRepository.login(username, password);
    await this.tokenStorage.saveTokens(tokens.access, tokens.refresh);
    return tokens;
  }
}
