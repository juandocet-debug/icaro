import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TokenStoragePort } from '../domain/TokenStoragePort';

const ACCESS_KEY  = 'icaro_access_token';
const REFRESH_KEY = 'icaro_refresh_token';
// Clave en localStorage (web) — persiste entre recargas, cierre de pestaña y reinicios por cámara móvil.
// NOTA: localStorage es accesible por JS. El refresh token sigue siendo cookie HTTP-Only (seguro).
const WEB_ACCESS_KEY = 'icaro_access';

// Cache en memoria — válido durante la sesión activa.
// En web: respaldado por localStorage para sobrevivir recargas Y reinicios de pestaña al usar cámara.
// En native: respaldado por SecureStore.
let _inMemoryAccessToken:  string | null = null;
let _inMemoryRefreshToken: string | null = null;

/** Lectura segura de localStorage (solo web, sin lanzar en SSR) */
const _localGet = (key: string): string | null => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

/** Escritura segura en localStorage */
const _localSet = (key: string, value: string): void => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
  } catch { /* ignorar — storage lleno o bloqueado */ }
};

/** Borrado seguro de localStorage */
const _localRemove = (key: string): void => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch { /* ignorar */ }
};

export const SecureTokenStorage: TokenStoragePort & {
  getAccessToken(): Promise<string | null>;
} = {
  async saveTokens(access: string, refresh: string): Promise<void> {
    _inMemoryAccessToken  = access;
    _inMemoryRefreshToken = refresh;

    if (Platform.OS === 'web') {
      // Web: persiste el access token en localStorage para sobrevivir F5 Y reinicios de pestaña
      // (por ej. cuando Chrome cierra la pestaña al abrir la cámara en móvil).
      // El refresh token NO se guarda aquí — viaja como cookie HTTP-Only.
      _localSet(WEB_ACCESS_KEY, access);
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
      _localRemove(WEB_ACCESS_KEY);
      // También limpiar la clave vieja de sessionStorage por si existe de una sesión anterior
      try { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('icaro_session_access'); } catch {}
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
      // 2. Web: localStorage sobrevive F5 y reinicios de pestaña (cámara móvil)
      const stored = _localGet(WEB_ACCESS_KEY);
      if (stored) {
        _inMemoryAccessToken = stored; // hidratar memoria
        return stored;
      }
      // 3. Fallback: sessionStorage legado (por si la clave vieja existe)
      const legacy = (() => { try { return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('icaro_session_access') : null; } catch { return null; } })();
      if (legacy) {
        _inMemoryAccessToken = legacy;
        _localSet(WEB_ACCESS_KEY, legacy); // migrar al nuevo storage
        return legacy;
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
