import axios from 'axios';
import { Platform } from 'react-native';
import { env } from '../config/env';
import { SecureTokenStorage } from '../modules/auth/infrastructure/SecureTokenStorage';
import { router } from 'expo-router';

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  // withCredentials envía las cookies HTTP-Only en peticiones cross-origin (web).
  // En native no afecta el comportamiento.
  withCredentials: true,
});

// ── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    // Native: añade el token desde SecureStore
    // Web: el navegador envía la cookie automáticamente; no se necesita el header,
    //       pero si hay token en memoria (recién logueado) también lo enviamos
    //       para que la autenticación dual funcione sin depender solo de cookies.
    const token = await SecureTokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ─────────────────────────────────────────────────────
let _isRefreshing = false;
let _refreshQueue: Array<(token: string | null) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Solo intentamos refresh en 401 y una sola vez por request
    if (error.response?.status !== 401 || original._retried) {
      return Promise.reject(error);
    }
    original._retried = true;

    // En web: intentar refresh silencioso usando la cookie HTTP-Only
    // En native: usar el refresh token en memoria / SecureStore
    if (_isRefreshing) {
      return new Promise((resolve, reject) => {
        _refreshQueue.push((newToken) => {
          if (newToken) {
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          } else {
            reject(error);
          }
        });
      });
    }

    _isRefreshing = true;
    try {
      const body: Record<string, string> = {};

      // En native incluimos el refresh token en el body
      if (Platform.OS !== 'web') {
        const refresh = await SecureTokenStorage.getRefreshToken();
        if (!refresh) throw new Error('Sin refresh token');
        body.refresh = refresh;
      }
      // En web: body vacío — el cookie 'icaro_refresh' viaja automáticamente

      const res = await axios.post(
        `${env.apiUrl}/api/auth/token/refresh/`,
        body,
        { withCredentials: true },
      );

      const newAccess: string = res.data.access;
      const newRefresh: string | undefined = res.data.refresh;
      await SecureTokenStorage.saveTokens(newAccess, newRefresh ?? '');

      _refreshQueue.forEach((cb) => cb(newAccess));
      _refreshQueue = [];

      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch {
      _refreshQueue.forEach((cb) => cb(null));
      _refreshQueue = [];
      await SecureTokenStorage.clearTokens();

      // Llamar logout para limpiar cookies en el servidor
      try {
        await axios.post(`${env.apiUrl}/api/auth/logout/`, {}, { withCredentials: true });
      } catch { /* ignorar error de logout */ }

      router.replace('/login');
      return Promise.reject(error);
    } finally {
      _isRefreshing = false;
    }
  },
);
