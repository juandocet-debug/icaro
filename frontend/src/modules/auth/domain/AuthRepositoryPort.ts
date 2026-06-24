import { AuthTokens } from './AuthTokens';

export interface AuthRepositoryPort {
  login(username: string, password: string): Promise<AuthTokens>;
  refreshToken(refresh: string): Promise<AuthTokens>;
}
