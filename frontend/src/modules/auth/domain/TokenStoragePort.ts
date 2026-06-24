export interface TokenStoragePort {
  saveTokens(access: string, refresh: string): Promise<void>;
  clearTokens(): Promise<void>;
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
}
