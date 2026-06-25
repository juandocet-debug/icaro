import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { actualizarAccionUseCase, asignacionResponsableRepo } from '../../../../shared/dependencies';
import { api } from '../../../../services/api';
import { AsignacionResponsable, MiembroAsignable } from '../../domain/AsignacionResponsableRepositoryPort';
import { SelectOption } from '../../../../shared/components/SearchableSelect';
import { TIPOS_MIME, PLANTILLAS } from './useAccionForm';

export type ReqDraftEditar = {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  obligatorio: boolean;
  tipos_archivo_permitidos: string[];
  min_archivos: number;
  max_archivos?: number | null;
  orden: number;
};

const emptyReq = (orden: number): ReqDraftEditar => ({
  nombre: '', obligatorio: true,
  tipos_archivo_permitidos: ['application/pdf'],
  min_archivos: 1, max_archivos: undefined, orden,
});

export function useEditarAccionForm(componenteId: string, accionId: string) {
  // Campos del formulario
  const [nombre,      setNombre]      = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [unidad,      setUnidad]      = useState('');
  const [proyeccion,  setProyeccion]  = useState('');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [requisitos,  setRequisitos]  = useState<ReqDraftEditar[]>([]);
  const [tiposEvidencia,  setTiposEvidencia]  = useState<string[]>([]);
  const [tipoEvInput,     setTipoEvInput]     = useState('');
  const [tiposEvTouched,  setTiposEvTouched]  = useState(false);

  // Responsables
  const [asignados,      setAsignados]      = useState<AsignacionResponsable[]>([]);
  const [asignables,     setAsignables]     = useState<MiembroAsignable[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [tipoAsig,       setTipoAsig]       = useState<'responsable' | 'apoyo'>('responsable');

  // Estado UI
  const [loadingData, setLoadingData] = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [reqTouched,  setReqTouched]  = useState(false);

  // Cargar datos de la acción existente
  useEffect(() => {
    if (!accionId) return;
    setLoadingData(true);
    setError(null);
    setSelectedUserId('');
    setTipoAsig('responsable');

    Promise.all([
      api.get(`/api/acciones/${componenteId}/acciones/${accionId}/`),
      asignacionResponsableRepo.listarResponsables(componenteId, accionId),
      asignacionResponsableRepo.buscarMiembrosAsignables(componenteId, accionId, ''),
    ])
      .then(([accRes, respData, asignablesData]) => {
        const d = accRes.data.datos;
        setNombre(d.name || '');
        setDescripcion(d.description || '');
        setUnidad(d.unidad_medida || '');
        setProyeccion(d.proyeccion_cuantitativa != null ? String(parseFloat(d.proyeccion_cuantitativa)) : '');
        setStartDate(d.start_date || '');
        setEndDate(d.end_date || '');
        setRequisitos(
          (d.requisitos_verificacion ?? []).map((r: any, i: number) => ({
            id: r.id, nombre: r.nombre, descripcion: r.descripcion ?? null,
            obligatorio: r.obligatorio,
            tipos_archivo_permitidos: r.tipos_archivo_permitidos ?? ['application/pdf'],
            min_archivos: r.min_archivos ?? 1,
            max_archivos: r.max_archivos ?? null,
            orden: r.orden ?? i,
          }))
        );
        setTiposEvidencia(d.tipos_evidencia_permitidos ?? []);
        setTipoEvInput('');
        setTiposEvTouched(false);
        setAsignados(respData);
        setAsignables(asignablesData);
        setReqTouched(false);
      })
      .catch(() => setError('Error al cargar los datos de la acción.'))
      .finally(() => setLoadingData(false));
  }, [accionId, componenteId]);

  const opcionesAsignables: SelectOption[] = asignables
    .filter(m => !asignados.some(a => a.usuarioId === m.id))
    .map(m => ({ id: String(m.id), name: m.nombreCompleto, description: `@${m.username}` }));

  // Responsables
  const handleAgregarResp = async () => {
    if (!selectedUserId || !accionId) return;
    const miembro = asignables.find(m => String(m.id) === selectedUserId);
    if (!miembro) return;
    try {
      const nueva = await asignacionResponsableRepo.asignarResponsable(componenteId, accionId, miembro.id, tipoAsig);
      setAsignados(prev => [...prev, nueva]);
      setSelectedUserId('');
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al asignar responsable.');
    }
  };

  const handleRetirarResp = async (asignacionId: string) => {
    if (!accionId) return;
    try {
      await asignacionResponsableRepo.retirarResponsable(componenteId, accionId, asignacionId);
      setAsignados(prev => prev.filter(a => a.id !== asignacionId));
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al retirar responsable.');
    }
  };

  // Requisitos
  const touch = () => setReqTouched(true);
  const addPlantilla = (p: typeof PLANTILLAS[0]) => {
    touch();
    setRequisitos(prev => {
      if (prev.some(r => r.nombre === p.nombre)) return prev;
      return [...prev, { ...p, descripcion: null, orden: prev.length }];
    });
  };
  const addCustom  = () => { touch(); setRequisitos(prev => [...prev, emptyReq(prev.length)]); };
  const removeReq  = (idx: number) => { touch(); setRequisitos(prev => prev.filter((_, i) => i !== idx)); };
  const updateReq  = (idx: number, patch: Partial<ReqDraftEditar>) => {
    touch();
    setRequisitos(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };
  const toggleMime = (idx: number, mime: string) => {
    const req = requisitos[idx];
    const has = req.tipos_archivo_permitidos.includes(mime);
    const updated = has ? req.tipos_archivo_permitidos.filter(m => m !== mime) : [...req.tipos_archivo_permitidos, mime];
    if (updated.length === 0) return;
    updateReq(idx, { tipos_archivo_permitidos: updated });
  };

  const addTipoEvidencia = () => {
    const v = tipoEvInput.trim();
    if (v && !tiposEvidencia.includes(v)) { setTiposEvidencia(prev => [...prev, v]); setTiposEvTouched(true); }
    setTipoEvInput('');
  };
  const removeTipoEvidencia = (t: string) => { setTiposEvidencia(prev => prev.filter(x => x !== t)); setTiposEvTouched(true); };

  // Guardar
  const handleGuardar = async () => {
    if (!accionId) return;
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true); setError(null);
    try {
      await actualizarAccionUseCase.ejecutar(componenteId, accionId, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        unidadMedida: unidad.trim() || undefined,
        proyeccion: proyeccion ? parseFloat(proyeccion) : undefined,
        tiposEvidencia: tiposEvTouched ? tiposEvidencia : undefined,
        startDate: startDate || null,
        endDate: endDate || null,
      } as any);
      await api.put(
        `/api/acciones/${componenteId}/acciones/${accionId}/requisitos/`,
        requisitos.map((r, i) => ({
          id: r.id, nombre: r.nombre, descripcion: r.descripcion ?? null,
          obligatorio: r.obligatorio, tipos_archivo_permitidos: r.tipos_archivo_permitidos,
          min_archivos: r.min_archivos, max_archivos: r.max_archivos ?? null, orden: i,
        }))
      );
      router.back();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al actualizar la acción.');
    } finally {
      setSaving(false);
    }
  };

  return {
    nombre, setNombre, descripcion, setDescripcion,
    unidad, setUnidad, proyeccion, setProyeccion,
    startDate, setStartDate, endDate, setEndDate,
    requisitos, tiposEvidencia, tipoEvInput, setTipoEvInput,
    saving, error, loadingData,
    asignados, opcionesAsignables, selectedUserId, setSelectedUserId,
    tipoAsig, setTipoAsig,
    handleAgregarResp, handleRetirarResp,
    addPlantilla, addCustom, updateReq, removeReq, toggleMime,
    addTipoEvidencia, removeTipoEvidencia,
    handleGuardar,
  };
}
