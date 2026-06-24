import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { SecureTokenStorage } from '../infrastructure/SecureTokenStorage';
import { LogoutUseCase } from '../application/LogoutUseCase';
import { UserProfile } from '../domain/UserProfile';
import { ProfilePhoto } from '../domain/ProfilePhoto';
import {
  loginUseCase,
  restoreSessionUseCase,
  obtenerPerfilUseCase,
  completarPrimerIngresoUseCase,
  perfilRepository,
} from '../../../shared/dependencies';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  userProfile: UserProfile | null;
  completarPrimerIngreso: (nuevaClave: string) => Promise<void>;
  actualizarFotoPerfil: (foto: ProfilePhoto) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const tokenStorage = SecureTokenStorage;
  const logoutUseCase = useMemo(() => new LogoutUseCase(tokenStorage), []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const tokens = await restoreSessionUseCase.ejecutar();
        if (tokens) {
          const perfil = await obtenerPerfilUseCase.ejecutar();
          setIsAuthenticated(true);
          setUserProfile(perfil);
        }
      } catch (e) {
        await tokenStorage.clearTokens();
        setIsAuthenticated(false);
        setUserProfile(null);
        console.error('Error al restaurar sesión activa o perfil', e);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginUseCase.ejecutar(username, password);
      const perfil = await obtenerPerfilUseCase.ejecutar();
      setIsAuthenticated(true);
      setUserProfile(perfil);
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión.');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUseCase.ejecutar();
      setIsAuthenticated(false);
      setUserProfile(null);
    } catch (e) {
      console.error('Error durante cierre de sesión', e);
    } finally {
      setIsLoading(false);
    }
  };

  const completarPrimerIngreso = async (nuevaClave: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const perfil = await completarPrimerIngresoUseCase.ejecutar(nuevaClave);
      setUserProfile(perfil);
    } catch (e: any) {
      await tokenStorage.clearTokens();
      setIsAuthenticated(false);
      setUserProfile(null);
      setError(e.message || 'Error al completar el ingreso inicial.');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const actualizarFotoPerfil = async (foto: ProfilePhoto) => {
    try {
      const photoUrl = await perfilRepository.subirFoto(foto);
      setUserProfile(prev => prev ? { ...prev, photoUrl } : null);
    } catch (e: any) {
      setError(e.message || 'Error al subir la foto de perfil.');
      throw e;
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, isLoading, login, logout, error, clearError,
      userProfile, completarPrimerIngreso, actualizarFotoPerfil
    }}>
      {children}
    </AuthContext.Provider>
  );
};
