import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessProfile } from '../domain/AccessProfile';
import { obtenerMiAccesoUseCase } from '../../../shared/dependencies';
import { AuthContext } from './AuthContext';

interface AccessContextType {
  accessProfile: AccessProfile | null;
  isLoading: boolean;
  /** null cuando no hay error; string descriptivo cuando la carga falló */
  accessError: string | null;
  /**
   * Retorna true si el usuario tiene el permiso con alcance 'global'.
   * Para permisos de proyecto, usar canInProject().
   * NOTA: es exclusivamente para decisiones de UI. El backend siempre es la
   * fuente de verdad para autorización.
   */
  can: (permission: string) => boolean;
  /**
   * Retorna true si el usuario tiene el permiso dentro del proyecto dado.
   * Acepta alcance 'global' o 'proyecto' con proyecto_id coincidente.
   */
  canInProject: (permission: string, projectId: string) => boolean;
  /** Retorna true si el usuario tiene alguna asignación activa en el proyecto. */
  hasAssignment: (projectId: string) => boolean;
  /** Reintenta la carga del perfil de acceso desde el servidor. */
  refreshAccess: () => Promise<void>;
}

const AccessContext = createContext<AccessContextType | undefined>(undefined);

export const AccessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useContext(AuthContext);
  const [accessProfile, setAccessProfile] = useState<AccessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  const refreshAccess = async () => {
    if (!auth?.isAuthenticated) {
      setAccessProfile(null);
      setAccessError(null);
      return;
    }
    setIsLoading(true);
    setAccessError(null);
    try {
      const data = await obtenerMiAccesoUseCase.ejecutar();
      // Validación mínima de forma: evitar perfiles incompletos silenciosos
      if (!data || typeof data.esSuperadministrador !== 'boolean') {
        throw new Error('La respuesta de mi-acceso tiene un formato inesperado.');
      }
      setAccessProfile(data);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? 'Error al cargar el perfil de acceso.';
      setAccessError(msg);
      // Conservar el perfil anterior si ya existía (tolerancia a fallos transitorios)
      // Solo limpiar si nunca hubo un perfil cargado
      setAccessProfile(prev => prev);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAccess();
  // SECURITY: también escuchar cambio de usuario (userId) como doble protección
  // por si isAuthenticated no cambia al hacer login sobre sesión activa.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.isAuthenticated, auth?.userProfile?.userId]);

  /**
   * Permiso de alcance global (o superadmin).
   * NO retorna true para permisos con alcance 'proyecto'.
   */
  const can = (permission: string): boolean => {
    if (!accessProfile) return false;
    if (accessProfile.esSuperadministrador) return true;
    return accessProfile.permisos.some(
      (p) => p.codigo === permission && p.alcance === 'global'
    );
  };

  /**
   * Permiso en el contexto de un proyecto concreto.
   */
  const canInProject = (permission: string, projectId: string): boolean => {
    if (!accessProfile) return false;
    if (accessProfile.esSuperadministrador) return true;
    if (accessProfile.permisos.some((p) => p.codigo === permission && p.alcance === 'global')) {
      return true;
    }
    return accessProfile.asignaciones.some(
      (a) => a.proyectoId === projectId &&
        accessProfile.permisos.some((p) => p.codigo === permission && p.alcance === 'proyecto')
    );
  };

  const hasAssignment = (projectId: string): boolean => {
    if (!accessProfile) return false;
    if (accessProfile.esSuperadministrador) return true;
    return accessProfile.asignaciones.some((a) => a.proyectoId === projectId);
  };

  return (
    <AccessContext.Provider value={{
      accessProfile,
      isLoading,
      accessError,
      can,
      canInProject,
      hasAssignment,
      refreshAccess,
    }}>
      {children}
    </AccessContext.Provider>
  );
};

export const useAccess = () => {
  const context = useContext(AccessContext);
  if (!context) {
    throw new Error('useAccess debe usarse dentro de un AccessProvider');
  }
  return context;
};
