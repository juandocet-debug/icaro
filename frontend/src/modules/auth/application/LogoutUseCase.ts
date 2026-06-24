import { TokenStoragePort } from '../domain/TokenStoragePort';

export class LogoutUseCase {
  constructor(private tokenStorage: TokenStoragePort) {}

  async ejecutar(): Promise<void> {
    await this.tokenStorage.clearTokens();
  }
}
