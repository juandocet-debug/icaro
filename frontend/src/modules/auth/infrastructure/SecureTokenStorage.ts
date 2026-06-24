import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TokenStoragePort } from '../domain/TokenStoragePort';

const ACCESS_KEY  = 'icaro_access_token';
const REFRESH_KEY = 'icaro_refresh_token';

// Cache en memoria — válido durante la sesión activa
// En web: los tokens viven en cookies HTTP-Only; aquí solo guardamos la copia de trabajo
// En native: copia de trabajo + respaldo en SecureStore
let _inMemoryAccessToken:  string | null = null;
let _inMemoryRefreshToken: string | null = null;

export const SecureTokenStorage: TokenStoragePort & {
  getAccessToken(): Promise<string | null>;
} = {
  async saveTokens(access: string, refresh: string): Promise<void> {
    _inMemoryAccessToken  = access;
    _inMemoryRefreshToken = refresh;

    // Web: las cookies HTTP-Only las gestiona el servidor y el navegador automáticamente.
    // NO se persiste nada en sessionStorage ni localStorage (elimina superficie de ataque XSS).
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(ACCESS_KEY, access);
        await SecureStore.setItemAsync(REFRESH_KEY, refresh);
      } catch (e) {
        console.error('Error al guardar tokens en SecureStore', e);
      }
    }
  },

  async clearTokens(): Promise<void> {
    _inMemoryAccessToken  = null;
    _inMemoryRefreshToken = null;

    if (Platform.OS !== 'web') {
      try {
        await SecureStore.deleteItemAsync(ACCESS_KEY);
        await SecureStore.deleteItemAsync(REFRESH_KEY);
      } catch (e) {
        console.error('Error al eliminar tokens de SecureStore', e);
      }
    }
    // En web, las cookies las elimina el endpoint /api/auth/logout/
  },

  async getAccessToken(): Promise<string | null> {
    if (_inMemoryAccessToken) return _inMemoryAccessToken;

    // En web no hay persistencia local — el cookie viaja solo con withCredentials
    if (Platform.OS === 'web') return null;

    try {
      _inMemoryAccessToken = await SecureStore.getItemAsync(ACCESS_KEY);
    } catch (e) {
      console.error('Error al leer token de SecureStore', e);
    }
    return _inMemoryAccessToken;
  },

  async getRefreshToken(): Promise<string | null> {
    if (_inMemoryRefreshToken) return _inMemoryRefreshToken;

    if (Platform.OS === 'web') return null;

    try {
      _inMemoryRefreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    } catch (e) {
      console.error('Error al leer refresh token de SecureStore', e);
    }
    return _inMemoryRefreshToken;
  },
};
