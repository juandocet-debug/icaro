import { useEffect, useState, useCallback } from 'react';
import { AccessProfile } from '../domain/AccessProfile';
import { obtenerMiAccesoUseCase } from '../../../shared/dependencies';

interface ProjectPermissionHook {
  canDo: (permiso: string) => boolean;
  loading: boolean;
}

/**
 * Verifica si el usuario autenticado tiene un permiso específico
 * en el contexto de un proyecto dado.
 *
 * Reglas:
 *   1. Superadministrador → siempre true.
 *   2. Usuario con el permiso en su AccessProfile Y con asignación activa
 *      en ese proyecto → true.
 *   3. En cualquier otro caso → false.
 *
 * El backend sigue siendo la autoridad final: este hook solo oculta
 * comandos en la UI para una mejor experiencia. El backend rechaza
 * con 403 si el usuario intenta la operación sin permiso real.
 */
export function useProjectPermission(proyectoId: string | null | undefined): ProjectPermissionHook {
  const [profile, setProfile] = useState<AccessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    obtenerMiAccesoUseCase.ejecutar()
      .then(p => { if (!cancelled) setProfile(p); })
      .catch(() => { if (!cancelled) setProfile(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const canDo = useCallback((permiso: string): boolean => {
    if (!profile || loading) return false;
    if (profile.esSuperadministrador) return true;
    if (!proyectoId) return false;

    // Permitir si tiene el permiso con alcance global
    if (profile.permisos.some(p => p.codigo === permiso && p.alcance === 'global')) {
      return true;
    }

    // Si no, verificar si alguna asignación en el proyecto tiene el permiso
    return profile.asignaciones.some(
      a => a.proyectoId === proyectoId && a.permisos?.includes(permiso)
    );
  }, [profile, loading, proyectoId]);

  return { canDo, loading };
}
