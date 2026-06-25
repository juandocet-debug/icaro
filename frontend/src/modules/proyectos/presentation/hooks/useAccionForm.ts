import { useState, useEffect, useMemo } from 'react';
import { router } from 'expo-router';
import { crearAccionMetaUseCase, listarMiembrosUseCase, asignacionResponsableRepo } from '../../../../shared/dependencies';
import { RequisitoVerificacion } from '../../domain/Accion';
import { ProyectoMiembro } from '../../domain/ProyectoMiembro';
import { SelectOption } from '../../../../shared/components/SearchableSelect';

export type ReqDraft = Omit<RequisitoVerificacion, 'id'>;

export interface ResponsableSeleccionado {
  usuarioId: number;
  nombre: string;
  tipo: 'responsable' | 'apoyo';
  photoUrl?: string | null;
}

export const UNIDADES_SUGERIDAS = ['Personas', 'Clases', 'Talleres', 'Documentos', 'Visitas'];

export const TIPOS_MIME = [
  { label: 'PDF',   value: 'application/pdf' },
  { label: 'JPEG',  value: 'image/jpeg' },
  { label: 'PNG',   value: 'image/png' },
  { label: 'WEBP',  value: 'image/webp' },
  { label: 'Word',  value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { label: 'Excel', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
];

export const PLANTILLAS: ReqDraft[] = [
  { nombre: 'Lista de asistencia', obligatorio: true, tipos_archivo_permitidos: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], min_archivos: 1, max_archivos: 2, orden: 0 },
  { nombre: 'Registro fotográfico', obligatorio: true, tipos_archivo_permitidos: ['image/jpeg', 'image/png', 'image/webp'], min_archivos: 3, max_archivos: 20, orden: 1 },
  { nombre: 'Documento soporte',   obligatorio: false, tipos_archivo_permitidos: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], min_archivos: 0, max_archivos: 1, orden: 2 },
];

export const emptyReq = (orden: number): ReqDraft => ({
  nombre: '', obligatorio: true,
  tipos_archivo_permitidos: ['application/pdf'],
  min_archivos: 1, max_archivos: undefined, orden,
});

export function useAccionForm(componenteId: string, proyectoId: string) {
  // Campos del formulario
  const [nombre,      setNombre]      = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [unidad,      setUnidad]      = useState('');
  const [proyeccion,  setProyeccion]  = useState('');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [requisitos,  setRequisitos]  = useState<ReqDraft[]>([]);
  const [tiposEvidencia, setTiposEvidencia] = useState<string[]>([]);
  const [tipoEvInput,    setTipoEvInput]    = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Responsables
  const [miembros,        setMiembros]        = useState<ProyectoMiembro[]>([]);
  const [loadingMiembros, setLoadingMiembros] = useState(false);
  const [selectedUserId,  setSelectedUserId]  = useState('');
  const [tipoAsig,        setTipoAsig]        = useState<'responsable' | 'apoyo'>('responsable');
  const [seleccionados,   setSeleccionados]   = useState<ResponsableSeleccionado[]>([]);

  const reset = () => {
    setNombre(''); setDescripcion(''); setUnidad(''); setProyeccion('');
    setRequisitos([]); setTiposEvidencia([]); setTipoEvInput(''); setError(null);
    setSelectedUserId(''); setTipoAsig('responsable'); setSeleccionados([]);
    setStartDate(''); setEndDate('');
  };

  // Cargar miembros del proyecto
  useEffect(() => {
    if (!proyectoId) return;
    setLoadingMiembros(true);
    listarMiembrosUseCase.ejecutar(proyectoId)
      .then(ms => {
        const seen = new Set<number>();
        setMiembros(ms.filter(m => {
          if (seen.has(m.usuarioId)) return false;
          seen.add(m.usuarioId);
          return true;
        }));
      })
      .catch(() => {})
      .finally(() => setLoadingMiembros(false));
  }, [proyectoId]);

  const opcionesMiembros = useMemo<SelectOption[]>(() => {
    const yaSeleccionados = new Set(seleccionados.map(s => s.usuarioId));
    return miembros
      .filter(m => !yaSeleccionados.has(m.usuarioId))
      .map(m => ({ id: String(m.usuarioId), name: m.nombreCompleto || m.username, description: `@${m.username}` }));
  }, [miembros, seleccionados]);

  // Responsables
  const handleAgregarResponsable = () => {
    if (!selectedUserId) return;
    const uid = parseInt(selectedUserId, 10);
    const miembro = miembros.find(m => m.usuarioId === uid);
    if (!miembro) return;
    setSeleccionados(prev => [
      ...prev,
      { usuarioId: uid, nombre: miembro.nombreCompleto || miembro.username, tipo: tipoAsig, photoUrl: miembro.photoUrl },
    ]);
    setSelectedUserId('');
  };

  const handleQuitarResponsable = (usuarioId: number) => {
    setSeleccionados(prev => prev.filter(s => s.usuarioId !== usuarioId));
  };

  // Requisitos
  const addPlantilla = (p: ReqDraft) => {
    setRequisitos(prev => {
      if (prev.some(r => r.nombre === p.nombre)) return prev;
      return [...prev, { ...p, orden: prev.length }];
    });
  };
  const addCustom = () => setRequisitos(prev => [...prev, emptyReq(prev.length)]);
  const updateReq = (idx: number, patch: Partial<ReqDraft>) => {
    setRequisitos(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  };
  const removeReq = (idx: number) => setRequisitos(prev => prev.filter((_, i) => i !== idx));
  const toggleMime = (idx: number, mime: string) => {
    const req = requisitos[idx];
    const has = req.tipos_archivo_permitidos.includes(mime);
    const updated = has
      ? req.tipos_archivo_permitidos.filter(m => m !== mime)
      : [...req.tipos_archivo_permitidos, mime];
    if (updated.length === 0) return;
    updateReq(idx, { tipos_archivo_permitidos: updated });
  };

  const addTipoEvidencia = () => {
    const v = tipoEvInput.trim();
    if (v && !tiposEvidencia.includes(v)) setTiposEvidencia(prev => [...prev, v]);
    setTipoEvInput('');
  };

  const removeTipoEvidencia = (t: string) => {
    setTiposEvidencia(prev => prev.filter(x => x !== t));
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!unidad.trim()) { setError('La unidad de medida es obligatoria.'); return; }
    const proy = parseFloat(proyeccion);
    if (isNaN(proy) || proy <= 0) { setError('La proyección debe ser un número mayor a 0.'); return; }

    setSaving(true); setError(null);
    try {
      const accion = await crearAccionMetaUseCase.ejecutar(componenteId, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        unidadMedida: unidad.trim(),
        proyeccion: proy,
        requisitosVerificacion: requisitos.length > 0 ? requisitos : undefined,
        tiposEvidencia: tiposEvidencia.length > 0 ? tiposEvidencia : undefined,
        startDate: startDate || null,
        endDate: endDate || null,
      });

      const erroresAsignacion: string[] = [];
      for (const resp of seleccionados) {
        try {
          await asignacionResponsableRepo.asignarResponsable(componenteId, accion.id, resp.usuarioId, resp.tipo);
        } catch (e: any) {
          erroresAsignacion.push(e?.response?.data?.error || `No se pudo asignar a ${resp.nombre}`);
        }
      }

      if (erroresAsignacion.length > 0) {
        setError(`Acción creada. Advertencia: ${erroresAsignacion.join(' · ')}`);
        setSaving(false);
        return;
      }
      reset();
      router.back();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error al crear la acción.');
    } finally {
      setSaving(false);
    }
  };

  return {
    // Estado del form
    nombre, setNombre, descripcion, setDescripcion,
    unidad, setUnidad, proyeccion, setProyeccion,
    startDate, setStartDate, endDate, setEndDate,
    requisitos, tiposEvidencia, tipoEvInput, setTipoEvInput,
    saving, error,
    // Responsables
    miembros, loadingMiembros, selectedUserId, setSelectedUserId,
    tipoAsig, setTipoAsig, seleccionados, opcionesMiembros,
    // Handlers
    handleAgregarResponsable, handleQuitarResponsable,
    addPlantilla, addCustom, updateReq, removeReq, toggleMime,
    addTipoEvidencia, removeTipoEvidencia,
    handleGuardar,
  };
}
