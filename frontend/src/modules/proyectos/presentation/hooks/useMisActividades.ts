import { useState, useEffect, useMemo } from 'react';
import { asignacionResponsableRepo } from '../../../../shared/dependencies';
import { api } from '../../../../services/api';

export const useMisActividades = (selectedAccionId?: string) => {
  // Lista de actividades
  const [todasActs, setTodasActs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<'todas' | 'pendientes' | 'completadas'>('todas');

  // Detalle de actividad seleccionada
  const [selectedAct, setSelectedAct] = useState<any | null>(null);
  const [detailLoad, setDetailLoad] = useState(false);
  const [detailErr, setDetailErr] = useState<string | null>(null);

  // Evidencias Operativas
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [evidenciasLoad, setEvidenciasLoad] = useState(false);
  const [activeEvId, setActiveEvId] = useState<string | null>(null);

  // Búsqueda y filtros de evidencias
  const [evQ, setEvQ] = useState('');
  const [evFechaDesde, setEvFechaDesde] = useState('');
  const [evFechaHasta, setEvFechaHasta] = useState('');

  // Creación rápida de nueva evidencia operativa
  const [showEvModal, setShowEvModal] = useState(false);
  const [evNombre, setEvNombre] = useState('');
  const [evDescripcion, setEvDescripcion] = useState('');
  const [evFecha, setEvFecha] = useState('');
  const [evCantidad, setEvCantidad] = useState('');
  const [evModalErr, setEvModalErr] = useState<string | null>(null);
  const [evModalSaving, setEvModalSaving] = useState(false);

  // Carga de archivo soporte
  const [soporteReqId, setSoporteReqId] = useState('');
  const [soporteFile, setSoporteFile] = useState<any | null>(null);
  const [soporteFileName, setSoporteFileName] = useState('');
  const [soporteFecha, setSoporteFecha] = useState('');
  const [soporteObs, setSoporteObs] = useState('');
  const [soporteErr, setSoporteErr] = useState<string | null>(null);
  const [soporteSaving, setSoporteSaving] = useState(false);

  // Revisión por Coordinador
  const [reviewObs, setReviewObs] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewErr, setReviewErr] = useState<string | null>(null);

  // Vista previa
  const [previewSoporte, setPreviewSoporte] = useState<any | null>(null);

  // ── Cargas ──────────────────────────────────────────────────────────────
  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await asignacionResponsableRepo.listarMisActividades(undefined, q);
      const datos = res.datos || [];
      setTodasActs(datos);
      if (datos.length > 0 && !selectedAct) {
        cargarDetalle(datos[0].accion.id);
      }
    } catch {
      setError('No se pudieron cargar las actividades.');
    } finally {
      setLoading(false);
    }
  };

  const cargarDetalle = async (id: string) => {
    setDetailLoad(true);
    setDetailErr(null);
    setPreviewSoporte(null);
    setSoporteFile(null);
    setSoporteFileName('');
    setSoporteObs('');
    setSoporteReqId('');
    try {
      const res = await api.get(`/api/mis-actividades/${id}/`);
      setSelectedAct(res.data.datos);
      await cargarEvidencias(id);
    } catch {
      setDetailErr('Error al cargar la actividad.');
    } finally {
      setDetailLoad(false);
    }
  };

  const cargarEvidencias = async (accionId: string) => {
    setEvidenciasLoad(true);
    try {
      const res = await api.get(`/api/mis-actividades/${accionId}/evidencias-operativas/`);
      const evs = res.data.datos || [];
      setEvidencias(evs);
    } catch {
      // Omitir
    } finally {
      setEvidenciasLoad(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [q]);

  useEffect(() => {
    if (selectedAccionId) {
      cargarDetalle(selectedAccionId);
    }
  }, [selectedAccionId]);

  // Filtros client-side de actividades
  const isComp = (a: any) => a.verificacion?.estado === 'completo';
  const filteredActs = estado === 'todas' ? todasActs
    : estado === 'completadas' ? todasActs.filter(isComp)
    : todasActs.filter(a => !isComp(a));

  const FILTROS = [
    { id: 'todas', label: 'Todas', cnt: todasActs.length },
    { id: 'pendientes', label: 'Pendientes', cnt: todasActs.filter(a => !isComp(a)).length },
    { id: 'completadas', label: 'Completadas', cnt: todasActs.filter(isComp).length },
  ] as const;

  // Filtrado de evidencias operativas (búsqueda + rango de fechas)
  const filteredEvidencias = useMemo(() => {
    return evidencias.filter(ev => {
      if (evQ && !ev.nombre?.toLowerCase().includes(evQ.toLowerCase()) &&
          !ev.descripcion?.toLowerCase().includes(evQ.toLowerCase())) return false;
      if (evFechaDesde && ev.fecha_ejecucion && ev.fecha_ejecucion < evFechaDesde) return false;
      if (evFechaHasta && ev.fecha_ejecucion && ev.fecha_ejecucion > evFechaHasta) return false;
      return true;
    });
  }, [evidencias, evQ, evFechaDesde, evFechaHasta]);

  // Evidencia Operativa Activa
  const activeEv = useMemo(() => {
    return evidencias.find(e => e.id === activeEvId) || null;
  }, [evidencias, activeEvId]);

  // Requisitos de verificación con sus soportes cargados en la evidencia activa
  const requisitosEvidenciaActiva = useMemo(() => {
    if (!selectedAct) return [];
    const reqs = selectedAct.accion.requisitos_verificacion || [];
    if (!activeEv) {
      return reqs.map((r: any) => ({ ...r, cumplido: false, archivos_cargados: 0, evidencias: [] }));
    }
    return reqs.map((r: any) => {
      const soportesReq = (activeEv.soportes || []).filter((s: any) => s.requisito_id === r.id);
      return {
        ...r,
        archivos_cargados: soportesReq.length,
        cumplido: soportesReq.length >= r.min_archivos,
        evidencias: soportesReq,
      };
    });
  }, [selectedAct, activeEv]);

  const reqsCompletadosActiveEv = useMemo(() => {
    return requisitosEvidenciaActiva.filter((r: any) => r.cumplido).length;
  }, [requisitosEvidenciaActiva]);

  // ── Crear Nueva Evidencia Operativa ────────────────────────────────────
  const openEvModal = () => {
    setEvNombre('');
    setEvDescripcion('');
    setEvFecha(new Date().toISOString().split('T')[0]);
    setEvCantidad('');
    setEvModalErr(null);
    setShowEvModal(true);
  };

  const handleCreateEvidencia = async () => {
    if (!selectedAct || !evNombre.trim()) return;
    setEvModalSaving(true);
    setEvModalErr(null);
    try {
      const res = await api.post(`/api/mis-actividades/${selectedAct.accion.id}/evidencias-operativas/`, {
        nombre: evNombre.trim(),
        descripcion: evDescripcion.trim() || null,
        fecha_ejecucion: evFecha || null,
        cantidad_ejecutada: evCantidad ? parseFloat(evCantidad) : 0,
      });
      setShowEvModal(false);
      await cargarEvidencias(selectedAct.accion.id);
      if (res.data.datos) {
        setActiveEvId(res.data.datos.id);
      }
    } catch (e: any) {
      setEvModalErr(e?.response?.data?.error || 'Error al crear la evidencia.');
    } finally {
      setEvModalSaving(false);
    }
  };

  // ── Guardar soporte (Carga derecha) ─────────────────────────────────────
  const handleGuardarSoporte = async () => {
    if (!selectedAct || !activeEv || !soporteReqId || !soporteFile) return;
    setSoporteSaving(true);
    setSoporteErr(null);
    try {
      const fd = new FormData();
      fd.append('archivo', soporteFile, soporteFileName);
      fd.append('requisito_id', soporteReqId);
      await api.post(`/api/mis-actividades/${selectedAct.accion.id}/evidencias-operativas/${activeEv.id}/soportes/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSoporteFile(null);
      setSoporteFileName('');
      setSoporteObs('');
      
      const evsRes = await api.get(`/api/mis-actividades/${selectedAct.accion.id}/evidencias-operativas/`);
      setEvidencias(evsRes.data.datos || []);
    } catch (e: any) {
      const d = e?.response?.data;
      setSoporteErr(d?.error || d?.errores?.join(' · ') || 'Error al subir soporte.');
    } finally {
      setSoporteSaving(false);
    }
  };

  const handleDeleteSoporte = async (soporteId: string) => {
    if (!selectedAct || !activeEv) return;
    try {
      await api.delete(`/api/mis-actividades/${selectedAct.accion.id}/evidencias-operativas/${activeEv.id}/soportes/${soporteId}/`);
      setPreviewSoporte(null);
      const evsRes = await api.get(`/api/mis-actividades/${selectedAct.accion.id}/evidencias-operativas/`);
      setEvidencias(evsRes.data.datos || []);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'No se pudo eliminar el soporte.');
    }
  };

  const handleEnviarEvidencia = async () => {
    if (!selectedAct || !activeEv) return;
    try {
      await api.post(`/api/mis-actividades/${selectedAct.accion.id}/evidencias-operativas/${activeEv.id}/enviar/`);
      const evsRes = await api.get(`/api/mis-actividades/${selectedAct.accion.id}/evidencias-operativas/`);
      setEvidencias(evsRes.data.datos || []);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Error al enviar evidencia.');
    }
  };

  const handleReviewEvidencia = async (actionType: 'aprobar' | 'observar') => {
    if (!selectedAct || !activeEv) return;
    setReviewSaving(true);
    setReviewErr(null);
    try {
      await api.post(`/api/mis-actividades/${selectedAct.accion.id}/evidencias-operativas/${activeEv.id}/revisar/`, {
        accion: actionType,
        observacion: reviewObs.trim() || undefined,
      });
      setReviewObs('');
      const evsRes = await api.get(`/api/mis-actividades/${selectedAct.accion.id}/evidencias-operativas/`);
      setEvidencias(evsRes.data.datos || []);
    } catch (e: any) {
      setReviewErr(e?.response?.data?.error || 'Error al procesar la revisión.');
    } finally {
      setReviewSaving(false);
    }
  };

  const handleReabrirEvidencia = async () => {
    if (!selectedAct || !activeEv) return;
    const obs = prompt('Escribe una observación para reabrir esta evidencia (opcional):');
    if (obs === null) return;
    try {
      await api.post(`/api/mis-actividades/${selectedAct.accion.id}/evidencias-operativas/${activeEv.id}/reabrir/`, {
        observacion: obs || undefined,
      });
      const evsRes = await api.get(`/api/mis-actividades/${selectedAct.accion.id}/evidencias-operativas/`);
      setEvidencias(evsRes.data.datos || []);
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Error al reabrir la evidencia.');
    }
  };

  return {
    todasActs, loading, error, q, setQ, estado, setEstado, filteredActs, FILTROS,
    selectedAct, detailLoad, detailErr, cargarDetalle,
    evidencias, evidenciasLoad, activeEvId, setActiveEvId,
    evQ, setEvQ, evFechaDesde, setEvFechaDesde, evFechaHasta, setEvFechaHasta,
    filteredEvidencias,
    showEvModal, setShowEvModal, evNombre, setEvNombre, evDescripcion, setEvDescripcion,
    evFecha, setEvFecha, evCantidad, setEvCantidad, evModalErr, evModalSaving, openEvModal, handleCreateEvidencia,
    soporteReqId, setSoporteReqId, soporteFile, setSoporteFile, soporteFileName, setSoporteFileName,
    soporteFecha, setSoporteFecha, soporteObs, setSoporteObs, soporteErr, soporteSaving, handleGuardarSoporte, handleDeleteSoporte, handleEnviarEvidencia,
    reviewObs, setReviewObs, reviewSaving, reviewErr, handleReviewEvidencia, handleReabrirEvidencia,
    previewSoporte, setPreviewSoporte, activeEv, requisitosEvidenciaActiva, reqsCompletadosActiveEv
  };
};
