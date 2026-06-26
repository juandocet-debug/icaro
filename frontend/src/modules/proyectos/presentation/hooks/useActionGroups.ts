import { useState, useCallback } from 'react';
import { api } from '../../../../services/api';

export interface ActionGroup {
  id: string;
  accion_id: string;
  nombre: string;
  codigo?: string | null;
  descripcion?: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export function useActionGroups(accionId: string) {
  const [groups, setGroups] = useState<ActionGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async (params?: { q?: string; activo?: boolean; page?: number; page_size?: number }) => {
    if (!accionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ ok: boolean; datos: ActionGroup[]; total: number }>(
        `/api/acciones/${accionId}/grupos/`,
        { params }
      );
      if (res.data.ok) {
        setGroups(res.data.datos);
        return res.data;
      } else {
        throw new Error('Error al listar grupos');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al obtener grupos';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [accionId]);

  const createGroup = useCallback(async (datos: { nombre: string; codigo?: string; descripcion?: string }) => {
    if (!accionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ ok: boolean; datos: ActionGroup }>(
        `/api/acciones/${accionId}/grupos/`,
        datos
      );
      if (res.data.ok) {
        setGroups(prev => [res.data.datos, ...prev]);
        return res.data.datos;
      } else {
        throw new Error('Error al crear grupo');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al crear grupo';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [accionId]);

  const updateGroup = useCallback(async (grupoId: string, datos: { nombre?: string; codigo?: string; descripcion?: string; activo?: boolean }) => {
    if (!accionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch<{ ok: boolean; datos: ActionGroup }>(
        `/api/acciones/${accionId}/grupos/${grupoId}/`,
        datos
      );
      if (res.data.ok) {
        setGroups(prev => prev.map(g => (g.id === grupoId ? res.data.datos : g)));
        return res.data.datos;
      } else {
        throw new Error('Error al actualizar grupo');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al actualizar grupo';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [accionId]);

  const deleteGroup = useCallback(async (grupoId: string) => {
    if (!accionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.delete<{ ok: boolean; datos?: ActionGroup; mensaje?: string }>(
        `/api/acciones/${accionId}/grupos/${grupoId}/`
      );
      if (res.data.ok) {
        // If physically deleted, remove from state. If logically deactivated, update state.
        if (res.data.datos) {
          const updated = res.data.datos;
          setGroups(prev => prev.map(g => (g.id === grupoId ? updated : g)));
        } else {
          setGroups(prev => prev.filter(g => g.id !== grupoId));
        }
        return res.data;
      } else {
        throw new Error('Error al eliminar grupo');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Error al eliminar grupo';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [accionId]);

  return {
    groups,
    loading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
