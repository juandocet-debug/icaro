import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TokenStoragePort } from '../domain/TokenStoragePort';

const ACCESS_KEY  = 'icaro_access_token';
const REFRESH_KEY = 'icaro_refresh_token';
// Clave en sessionStorage (web) — persiste en la pestaña activa, se borra al cerrarla
const SESSION_ACCESS_KEY = 'icaro_session_access';

// Cache en memoria — válido durante la sesión activa.
// En web: respaldado por sessionStorage para sobrevivir recargas (F5).
// En native: respaldado por SecureStore.
let _inMemoryAccessToken:  string | null = null;
let _inMemoryRefreshToken: string | null = null;

/** Lectura segura de sessionStorage (solo web, sin lanzar en SSR) */
const _sessionGet = (key: string): string | null => {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

/** Escritura segura en sessionStorage */
const _sessionSet = (key: string, value: string): void => {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, value);
  } catch { /* ignorar — storage lleno o bloqueado */ }
};

/** Borrado seguro de sessionStorage */
const _sessionRemove = (key: string): void => {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key);
  } catch { /* ignorar */ }
};

export const SecureTokenStorage: TokenStoragePort & {
  getAccessToken(): Promise<string | null>;
} = {
  async saveTokens(access: string, refresh: string): Promise<void> {
    _inMemoryAccessToken  = access;
    _inMemoryRefreshToken = refresh;

    if (Platform.OS === 'web') {
      // Web: persiste el access token en sessionStorage para sobrevivir F5.
      // - sessionStorage se borra automáticamente al cerrar la pestaña.
      // - El refresh token NO se guarda aquí — viaja como cookie HTTP-Only.
      _sessionSet(SESSION_ACCESS_KEY, access);
    } else {
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

    if (Platform.OS === 'web') {
      _sessionRemove(SESSION_ACCESS_KEY);
      // El refresh cookie lo elimina el servidor en /api/auth/logout/
    } else {
      try {
        await SecureStore.deleteItemAsync(ACCESS_KEY);
        await SecureStore.deleteItemAsync(REFRESH_KEY);
      } catch (e) {
        console.error('Error al eliminar tokens de SecureStore', e);
      }
    }
  },

  async getAccessToken(): Promise<string | null> {
    // 1. Memoria (más rápido, ya hidratado)
    if (_inMemoryAccessToken) return _inMemoryAccessToken;

    if (Platform.OS === 'web') {
      // 2. Web: sessionStorage sobrevive F5 dentro de la misma pestaña
      const stored = _sessionGet(SESSION_ACCESS_KEY);
      if (stored) {
        _inMemoryAccessToken = stored; // hidratar memoria
        return stored;
      }
      return null;
    }

    // 3. Native: SecureStore
    try {
      _inMemoryAccessToken = await SecureStore.getItemAsync(ACCESS_KEY);
    } catch (e) {
      console.error('Error al leer token de SecureStore', e);
    }
    return _inMemoryAccessToken;
  },

  async getRefreshToken(): Promise<string | null> {
    if (_inMemoryRefreshToken) return _inMemoryRefreshToken;

    // En web el refresh token viaja como cookie HTTP-Only — no se lee desde JS
    if (Platform.OS === 'web') return null;

    try {
      _inMemoryRefreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
    } catch (e) {
      console.error('Error al leer refresh token de SecureStore', e);
    }
    return _inMemoryRefreshToken;
  },
};
