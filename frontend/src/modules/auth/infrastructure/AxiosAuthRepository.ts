import { AuthRepositoryPort } from '../domain/AuthRepositoryPort';
import { AuthTokens } from '../domain/AuthTokens';
import { api } from '../../../services/api';

export class AxiosAuthRepository implements AuthRepositoryPort {
  async login(username: string, password: string): Promise<AuthTokens> {
    try {
      const response = await api.post<AuthTokens>('/api/auth/token/', {
        username,
        password,
      });
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        throw new Error('Credenciales inválidas. Inténtelo de nuevo.');
      }
      throw new Error(error.message || 'Error de conexión con el servidor.');
    }
  }

  async refreshToken(refresh: string): Promise<AuthTokens> {
    try {
      // Si refresh está vacío (caso web con cookie HTTP-Only), no lo incluimos en el body
      const body = refresh ? { refresh } : {};
      const response = await api.post<AuthTokens>('/api/auth/token/refresh/', body, {
        withCredentials: true,
      });
      return response.data;
    } catch (error: any) {
      throw new Error('Sesión expirada.');
    }
  }
}
