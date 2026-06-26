import { useState, useCallback } from 'react';
import { api } from '../../../../services/api';
import { ActionGroup } from './useActionGroups';

export function useGroupSearch(accionId: string) {
  const [options, setOptions] = useState<ActionGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const searchGroups = useCallback(async (q: string, pageNum: number = 1, append: boolean = false) => {
    if (!accionId) return;
    setLoading(true);
    try {
      const res = await api.get<{ ok: boolean; datos: ActionGroup[]; total_paginas: number; pagina_actual: number }>(
        `/api/acciones/${accionId}/grupos/`,
        {
          params: {
            q,
            page: pageNum,
            page_size: 20,
            activo: true, // Only show active groups for selection
          }
        }
      );
      if (res.data.ok) {
        setOptions(prev => append ? [...prev, ...res.data.datos] : res.data.datos);
        setPage(res.data.pagina_actual);
        setHasMore(res.data.pagina_actual < res.data.total_paginas);
      }
    } catch (err) {
      console.error('Error searching groups:', err);
    } finally {
      setLoading(false);
    }
  }, [accionId]);

  return {
    options,
    loading,
    page,
    hasMore,
    searchGroups,
    setOptions,
  };
}
