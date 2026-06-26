import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ActivityIndicator, Platform, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppShell } from '../../../shared/components/AppShell';
import { Card } from '../../../shared/components/Card';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { api } from '../../../services/api';
import { useAccess } from '../../auth/presentation/useAccess';
import { SearchableSelect, SelectOption } from '../../../shared/components/SearchableSelect';
import { styles, htmlInputStyle, htmlDateInputStyle, htmlSelectStyle, htmlPageSelectStyle, htmlTextAreaStyle } from './EvidenciasDashboardScreen.styles';
import { generateEvidenciasPDF } from './utils/pdf/generatePDF';
import { ActionGroupFilters, ActionGroupSelect } from './components/groups/ActionGroupFilters';


interface Soporte {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  requisito_id: string | null;
  requisito_nombre: string | null;
  created_at: string | null;
}

interface EvidenciaGeneral {
  id: string;
  nombre: string;
  descripcion: string;
  fecha_ejecucion: string | null;
  cantidad_ejecutada: number;
  estado: string;
  observacion_coordinador: string | null;
  creada_por: {
    id: string;
    nombre: string;
    email?: string;
    photo_url?: string | null;
  };
  accion: {
    id: string;
    nombre: string;
    meta_nombre: string;
    componente_nombre: string;
    requisitos?: Array<{
      id: string;
      nombre: string;
      obligatorio: boolean;
      min_archivos: number;
    }>;
  };
  grupo?: {
    id: string;
    nombre: string;
    codigo?: string | null;
  } | null;
  soportes: Soporte[];
  created_at: string | null;
}

interface Props {
  proyectoId: string;
}

import { env } from '../../../config/env';

const DASHBOARD_FETCH_LIMIT = 100;

const toUrl = (url: string) => {
  const API_BASE = env.apiUrl;
  return url?.startsWith('http') ? url : `${API_BASE}${url}`;
};

const cloudinaryThumb = (url: string) => {
  const fullUrl = toUrl(url);
  if (!fullUrl.includes('res.cloudinary.com')) return fullUrl;
  return fullUrl.replace('/upload/', '/upload/c_fill,w_240,h_240,q_auto,f_auto/');
};

const fileIcon = (t: string): any =>
  t?.startsWith('image/') ? 'image-outline'
  : t === 'application/pdf' ? 'document-text-outline'
  : t?.includes('spreadsheetml') ? 'grid-outline' : 'document-outline';

const fileColor = (t: string) =>
  t?.startsWith('image/') ? '#10b981' : t === 'application/pdf' ? '#ef4444' : colors.primary;

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

export const EvidenciasDashboardScreen: React.FC<Props> = ({ proyectoId }) => {
  const { accessProfile } = useAccess();
  const [evidencias, setEvidencias] = useState<EvidenciaGeneral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('todos');
  const [selectedColaborador, setSelectedColaborador] = useState('todos');
  const [selectedMeta, setSelectedMeta] = useState('todos');
  const [selectedComponente, setSelectedComponente] = useState('todos');
  const [selectedAccion, setSelectedAccion] = useState('todos');
  const [selectedGrupoId, setSelectedGrupoId] = useState<string | null>(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const selectedAccionId = useMemo(() => {
    if (selectedAccion === 'todos') return null;
    const match = evidencias.find(ev => ev.accion?.nombre === selectedAccion);
    return match?.accion?.id || null;
  }, [selectedAccion, evidencias]);

  useEffect(() => {
    setSelectedGrupoId(null);
  }, [selectedAccion]);

  // Filas expandidas (collapsible)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Paginado
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Vista previa e interacciones
  const [previewSoporte, setPreviewSoporte] = useState<Soporte | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Acciones en progreso
  const [reabriendoId, setReabriendoId] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [revisandoId, setRevisandoId] = useState<string | null>(null);
  const [reqsAprobados, setReqsAprobados] = useState<Record<string, string[]>>({});

  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    type: 'alert' | 'confirm' | 'prompt';
    title: string;
    message: string;
    inputValue?: string;
    onConfirm: (val?: string) => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  const showCustomAlert = (title: string, message: string, onConfirm?: () => void) => {
    setDialogConfig({
      visible: true,
      type: 'alert',
      title,
      message,
      onConfirm: () => {
        setDialogConfig(null);
        onConfirm?.();
      },
      confirmText: 'Aceptar',
    });
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    setDialogConfig({
      visible: true,
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        setDialogConfig(null);
        onConfirm();
      },
      onCancel: () => {
        setDialogConfig(null);
        onCancel?.();
      },
      confirmText: 'Aceptar',
      cancelText: 'Cancelar',
    });
  };

  const showCustomPrompt = (title: string, message: string, onConfirm: (val: string) => void, onCancel?: () => void) => {
    setDialogConfig({
      visible: true,
      type: 'prompt',
      title,
      message,
      inputValue: '',
      onConfirm: (val) => {
        setDialogConfig(null);
        onConfirm(val || '');
      },
      onCancel: () => {
        setDialogConfig(null);
        onCancel?.();
      },
      confirmText: 'Aceptar',
      cancelText: 'Cancelar',
    });
  };




  const isSuperAdmin = accessProfile?.esSuperadministrador === true;

  const cargarEvidencias = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/api/evidencias/proyecto/${proyectoId}/evidencias-operativas-general/?page=1&page_size=${DASHBOARD_FETCH_LIMIT}`
      );
      if (res.data.ok) {
        setEvidencias(res.data.datos || []);
      } else {
        setError(res.data.error || 'No se pudieron cargar las evidencias.');
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Error de red al cargar el dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEvidencias();
  }, [proyectoId]);

  // Reset del paginado al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedEstado, selectedColaborador, selectedMeta, selectedComponente, selectedAccion, fechaDesde, fechaHasta, pageSize]);

  // Lista única de colaboradores (Filtro Inteligente)
  const colaboradores = useMemo(() => {
    const nombres = new Set<string>();
    evidencias.forEach(ev => {
      if (selectedEstado !== 'todos' && ev.estado !== selectedEstado) return;
      if (selectedMeta !== 'todos' && ev.accion?.meta_nombre !== selectedMeta) return;
      if (selectedAccion !== 'todos' && ev.accion?.nombre !== selectedAccion) return;
      if (fechaDesde && ev.fecha_ejecucion && ev.fecha_ejecucion < fechaDesde) return;
      if (fechaHasta && ev.fecha_ejecucion && ev.fecha_ejecucion > fechaHasta) return;
      if (ev.creada_por?.nombre) {
        nombres.add(ev.creada_por.nombre);
      }
    });
    return Array.from(nombres).sort();
  }, [evidencias, selectedEstado, selectedMeta, selectedAccion, fechaDesde, fechaHasta]);

  const colaboradorOptions = useMemo(() => {
    const options: SelectOption[] = [
      { id: 'todos', name: 'Todos los colaboradores' }
    ];
    colaboradores.forEach(name => {
      const match = evidencias.find(ev => ev.creada_por?.nombre === name);
      options.push({
        id: name,
        name: name,
        description: match?.creada_por?.email || undefined,
        photoUrl: match?.creada_por?.photo_url ? toUrl(match.creada_por.photo_url) : null
      });
    });
    return options;
  }, [colaboradores, evidencias]);



  // Lista única de metas/objetivos (Filtro Inteligente)
  const metas = useMemo(() => {
    const names = new Set<string>();
    evidencias.forEach(ev => {
      if (selectedEstado !== 'todos' && ev.estado !== selectedEstado) return;
      if (selectedColaborador !== 'todos' && ev.creada_por?.nombre !== selectedColaborador) return;
      if (selectedComponente !== 'todos' && ev.accion?.componente_nombre !== selectedComponente) return;
      if (selectedAccion !== 'todos' && ev.accion?.nombre !== selectedAccion) return;
      if (fechaDesde && ev.fecha_ejecucion && ev.fecha_ejecucion < fechaDesde) return;
      if (fechaHasta && ev.fecha_ejecucion && ev.fecha_ejecucion > fechaHasta) return;
      if (ev.accion?.meta_nombre) {
        names.add(ev.accion.meta_nombre);
      }
    });
    return Array.from(names).sort();
  }, [evidencias, selectedEstado, selectedColaborador, selectedComponente, selectedAccion, fechaDesde, fechaHasta]);

  // Lista única de componentes (Filtro Inteligente — depende de Meta seleccionada)
  const componentes = useMemo(() => {
    const names = new Set<string>();
    evidencias.forEach(ev => {
      if (selectedEstado !== 'todos' && ev.estado !== selectedEstado) return;
      if (selectedColaborador !== 'todos' && ev.creada_por?.nombre !== selectedColaborador) return;
      if (selectedMeta !== 'todos' && ev.accion?.meta_nombre !== selectedMeta) return;
      if (selectedAccion !== 'todos' && ev.accion?.nombre !== selectedAccion) return;
      if (fechaDesde && ev.fecha_ejecucion && ev.fecha_ejecucion < fechaDesde) return;
      if (fechaHasta && ev.fecha_ejecucion && ev.fecha_ejecucion > fechaHasta) return;
      if (ev.accion?.componente_nombre) {
        names.add(ev.accion.componente_nombre);
      }
    });
    return Array.from(names).sort();
  }, [evidencias, selectedEstado, selectedColaborador, selectedMeta, selectedAccion, fechaDesde, fechaHasta]);

  // Lista única de acciones/actividades (Filtro Inteligente)
  const acciones = useMemo(() => {
    const names = new Set<string>();
    evidencias.forEach(ev => {
      if (selectedEstado !== 'todos' && ev.estado !== selectedEstado) return;
      if (selectedColaborador !== 'todos' && ev.creada_por?.nombre !== selectedColaborador) return;
      if (selectedMeta !== 'todos' && ev.accion?.meta_nombre !== selectedMeta) return;
      if (selectedComponente !== 'todos' && ev.accion?.componente_nombre !== selectedComponente) return;
      if (fechaDesde && ev.fecha_ejecucion && ev.fecha_ejecucion < fechaDesde) return;
      if (fechaHasta && ev.fecha_ejecucion && ev.fecha_ejecucion > fechaHasta) return;
      if (ev.accion?.nombre) {
        names.add(ev.accion.nombre);
      }
    });
    return Array.from(names).sort();
  }, [evidencias, selectedEstado, selectedColaborador, selectedMeta, selectedComponente, fechaDesde, fechaHasta]);

  // Lista única de estados disponibles (Filtro Inteligente)
  const estadosDisponibles = useMemo(() => {
    const states = new Set<string>();
    evidencias.forEach(ev => {
      if (selectedColaborador !== 'todos' && ev.creada_por?.nombre !== selectedColaborador) return;
      if (selectedMeta !== 'todos' && ev.accion?.meta_nombre !== selectedMeta) return;
      if (selectedAccion !== 'todos' && ev.accion?.nombre !== selectedAccion) return;
      if (fechaDesde && ev.fecha_ejecucion && ev.fecha_ejecucion < fechaDesde) return;
      if (fechaHasta && ev.fecha_ejecucion && ev.fecha_ejecucion > fechaHasta) return;
      if (ev.estado) {
        states.add(ev.estado);
      }
    });
    return Array.from(states).sort();
  }, [evidencias, selectedColaborador, selectedMeta, selectedAccion, fechaDesde, fechaHasta]);

  const ESTADOS_MAP: Record<string, string> = {
    borrador: 'Borrador (Sin enviar)',
    enviada: 'Enviada a revisión',
    aprobada: 'Aprobada',
    observada: 'Observada (Devuelta)',
    reabierta: 'Edición Habilitada (Reabierta)',
  };

  // Filtros aplicados
  const filteredEvidencias = useMemo(() => {
    return evidencias.filter(ev => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesColab = ev.creada_por?.nombre?.toLowerCase().includes(query);
        const matchesAccion = ev.accion?.nombre?.toLowerCase().includes(query);
        const matchesEv = ev.nombre?.toLowerCase().includes(query) || ev.descripcion?.toLowerCase().includes(query);
        if (!matchesColab && !matchesAccion && !matchesEv) return false;
      }
      if (selectedEstado === 'todos') {
        if (ev.estado === 'borrador') return false;
      } else {
        if (ev.estado !== selectedEstado) return false;
      }
      if (selectedColaborador !== 'todos' && ev.creada_por?.nombre !== selectedColaborador) return false;
      if (selectedMeta !== 'todos' && ev.accion?.meta_nombre !== selectedMeta) return false;
      if (selectedComponente !== 'todos' && ev.accion?.componente_nombre !== selectedComponente) return false;
      if (selectedAccion !== 'todos' && ev.accion?.nombre !== selectedAccion) return false;
      if (selectedGrupoId && (!ev.grupo || ev.grupo.id !== selectedGrupoId)) return false;
      if (fechaDesde && ev.fecha_ejecucion && ev.fecha_ejecucion < fechaDesde) return false;
      if (fechaHasta && ev.fecha_ejecucion && ev.fecha_ejecucion > fechaHasta) return false;
      return true;
    });
  }, [evidencias, searchQuery, selectedEstado, selectedColaborador, selectedMeta, selectedComponente, selectedAccion, selectedGrupoId, fechaDesde, fechaHasta]);

  // Datos paginados
  const paginatedEvidencias = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEvidencias.slice(start, start + pageSize);
  }, [filteredEvidencias, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredEvidencias.length / pageSize) || 1;
  }, [filteredEvidencias, pageSize]);

  // Reset de Zoom/Pan
  useEffect(() => {
    setZoomScale(1);
    setPan({ x: 0, y: 0 });
  }, [previewSoporte]);

  const handleWheel = (e: any) => {
    if (Platform.OS === 'web') {
      const delta = e.deltaY * -0.003;
      setZoomScale(prev => Math.min(Math.max(1, prev + delta), 4));
    }
  };

  const handleMouseDown = (e: any) => {
    if (Platform.OS === 'web') {
      isDragging.current = true;
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: any) => {
    if (Platform.OS === 'web' && isDragging.current) {
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      setPan({ x: newX, y: newY });
    }
  };

  const handleMouseUpOrLeave = () => {
    if (Platform.OS === 'web') {
      isDragging.current = false;
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleReabrir = async (ev: EvidenciaGeneral) => {
    showCustomPrompt(
      'Reabrir Evidencia',
      'Escribe una observación para reabrir esta evidencia (opcional):',
      async (obs) => {
        setReabriendoId(ev.id);
        try {
          await api.post(`/api/mis-actividades/${ev.accion.id}/evidencias-operativas/${ev.id}/reabrir/`, {
            observacion: obs || undefined,
          });
          await cargarEvidencias();
          showCustomAlert('Habilitada', 'La evidencia ha sido reabierta con éxito.');
        } catch (e: any) {
          showCustomAlert('Error', e?.response?.data?.error || 'No se pudo reabrir la evidencia.');
        } finally {
          setReabriendoId(null);
        }
      }
    );
  };

  const handleRevisar = async (ev: EvidenciaGeneral, actionType: 'aprobar' | 'observar') => {
    const obs = observaciones[ev.id] || '';
    if (actionType === 'observar' && !obs.trim()) {
      showCustomAlert('Observación requerida', 'Por favor ingresa una observación para devolver la evidencia.');
      return;
    }
    setRevisandoId(ev.id);
    try {
      await api.post(`/api/mis-actividades/${ev.accion.id}/evidencias-operativas/${ev.id}/revisar/`, {
        accion: actionType,
        observacion: obs.trim() || undefined,
      });
      setObservaciones(prev => {
        const next = { ...prev };
        delete next[ev.id];
        return next;
      });
      await cargarEvidencias();
      showCustomAlert(
        actionType === 'aprobar' ? 'Aprobada' : 'Devuelta',
        `La evidencia ha sido ${actionType === 'aprobar' ? 'aprobada' : 'observada'} con éxito.`
      );
    } catch (e: any) {
      showCustomAlert('Error', e?.response?.data?.error || 'No se pudo revisar la evidencia.');
    } finally {
      setRevisandoId(null);
    }
  };


  const handleEliminar = async (evId: string) => {
    showCustomConfirm(
      'Eliminar Evidencia',
      '¿Estás seguro de eliminar esta evidencia por completo? Esta acción es destructiva y eliminará todos los archivos.',
      async () => {
        setEliminandoId(evId);
        try {
          const res = await api.delete(`/api/evidencias/proyecto/${proyectoId}/evidencias-operativas-general/${evId}/`);
          if (res.data.ok) {
            await cargarEvidencias();
            showCustomAlert('Eliminada', 'Evidencia eliminada con éxito.');
          } else {
            showCustomAlert('Error', res.data.error || 'No se pudo eliminar la evidencia.');
          }
        } catch (e: any) {
          showCustomAlert('Error', e?.response?.data?.error || 'No se pudo eliminar la evidencia.');
        } finally {
          setEliminandoId(null);
        }
      }
    );
  };


  const cleanFilters = () => {
    setSearchQuery('');
    setSelectedEstado('todos');
    setSelectedColaborador('todos');
    setSelectedMeta('todos');
    setSelectedComponente('todos');
    setSelectedAccion('todos');
    setSelectedGrupoId(null);
    setFechaDesde('');
    setFechaHasta('');
  };

  const getStatusBadgeStyle = (status: string) => { switch (status) {
      case 'aprobada': return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'enviada': return { bg: '#fff8e1', text: '#f57f17' };
      case 'observada': return { bg: '#ffebee', text: '#c62828' };
      case 'reabierta': return { bg: '#e8eaf6', text: '#283593' };
      default: return { bg: '#f5f5f5', text: '#616161' };
    }
  };

  const [pdfLoading, setPdfLoading] = React.useState(false);

  const exportToPDF = async () => {
    if (!filteredEvidencias.length) return;
    setPdfLoading(true);

    // Nombre del proyecto desde las asignaciones del usuario
    const proyectoNombre =
      accessProfile?.asignaciones?.find((a) => a.proyectoId === proyectoId)?.proyectoNombre
      ?? accessProfile?.asignaciones?.[0]?.proyectoNombre
      ?? 'Proyecto';

    // Meta, componente y acción: si el filtro tiene uno específico, úsalo
    const metaNombre       = selectedMeta       !== 'todos' ? selectedMeta       : 'Todas las metas';
    const componenteNombre = selectedComponente !== 'todos' ? selectedComponente : '';
    const accionNombre     = selectedAccion     !== 'todos' ? selectedAccion     : 'Reporte General de Evidencias';

    // Grupo: si hay un grupo seleccionado, tomar su nombre de las evidencias
    const grupoNombre = selectedGrupoId
      ? (filteredEvidencias.find(ev => ev.grupo?.id === selectedGrupoId)?.grupo?.nombre ?? '')
      : '';

    await generateEvidenciasPDF({
      proyectoNombre,
      metaNombre,
      componenteNombre,
      accionNombre,
      grupoNombre,
      evidencias: filteredEvidencias,
    });

    setPdfLoading(false);
  };

  if (loading) {
    return (
      <AppShell style={styles.shell}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell style={styles.shell}>
        <ErrorMessage message={error} />
        <TouchableOpacity onPress={() => router.back()} style={styles.btnVolver}>
          <Text style={styles.btnVolverText}>Volver</Text>
        </TouchableOpacity>
      </AppShell>
    );
  }

  return (
    <AppShell scrollable={true} style={styles.shell}>
      {/* Header Premium */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={16} color={colors.primary} />
          <Text style={styles.backButtonText}>Volver al proyecto</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.title}>Consola de Control de Evidencias</Text>
            <Text style={styles.subtitle}>Supervisión general, aprobación de ediciones y depuración</Text>
          </View>
        </View>
      </View>

      {/* Panel de Filtros Premium */}
      <Card style={styles.filtersCard}>
        <View style={styles.filtersHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 } as any}>
            <Ionicons name="funnel-outline" size={16} color={colors.primary} />
            <Text style={styles.filtersTitle}>Filtros de Búsqueda</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 } as any}>
            <TouchableOpacity onPress={cleanFilters} style={styles.cleanBtn}>
              <Ionicons name="close-circle-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.cleanBtnText}>Limpiar filtros</Text>
            </TouchableOpacity>
            {Platform.OS === 'web' && (
              <TouchableOpacity onPress={exportToPDF} style={[styles.pdfBtn, pdfLoading && { opacity: 0.6 } as any]} disabled={pdfLoading}>
                <Ionicons name={pdfLoading ? 'hourglass-outline' : 'download-outline'} size={14} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.pdfBtnText}>{pdfLoading ? 'Generando...' : 'Exportar PDF'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.filtersGrid}>
          {/* Buscar */}
          <View style={[styles.filterGroup, { flex: 1.5, minWidth: 220 } as any]}>
            <Text style={styles.filterLabel}>Buscar por texto</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="search-outline" size={16} color={colors.textSecondary} style={styles.inputIcon} />
              {Platform.OS === 'web' ? (
                <input
                  type="text"
                  style={htmlInputStyle}
                  placeholder="Colaborador, actividad o carpeta..."
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                />
              ) : null}
            </View>
          </View>

          {/* Colaborador */}
          <View style={[styles.filterGroup, { flex: 1.2, minWidth: 220, zIndex: 10 } as any]}>
            <Text style={styles.filterLabel}>Colaborador</Text>
            <SearchableSelect
              options={colaboradorOptions}
              selectedValue={selectedColaborador}
              onSelect={setSelectedColaborador}
              placeholder="Buscar colaborador..."
            />
          </View>


          {/* Estado */}
          <View style={[styles.filterGroup, { flex: 1, minWidth: 140 } as any]}>
            <Text style={styles.filterLabel}>Estado</Text>
            <View style={styles.selectWrapper}>
              {Platform.OS === 'web' ? (
                <select
                  style={htmlSelectStyle}
                  value={selectedEstado}
                  onChange={(e: any) => setSelectedEstado(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  {estadosDisponibles.map(code => (
                    <option key={code} value={code}>{ESTADOS_MAP[code] || code}</option>
                  ))}
                </select>
              ) : null}
              <Ionicons name="chevron-down-outline" size={14} color={colors.textSecondary} style={styles.selectArrow} />
            </View>
          </View>

          {/* Meta / Objetivo */}
          <View style={[styles.filterGroup, { flex: 1, minWidth: 160 } as any]}>
            <Text style={styles.filterLabel}>Meta / Objetivo</Text>
            <View style={styles.selectWrapper}>
              {Platform.OS === 'web' ? (
                <select
                  style={htmlSelectStyle}
                  value={selectedMeta}
                  onChange={(e: any) => setSelectedMeta(e.target.value)}
                >
                  <option value="todos">Todas las metas</option>
                  {metas.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              ) : null}
              <Ionicons name="chevron-down-outline" size={14} color={colors.textSecondary} style={styles.selectArrow} />
            </View>
          </View>

          {/* Componente */}
          <View style={[styles.filterGroup, { flex: 1.2, minWidth: 170 } as any]}>
            <Text style={styles.filterLabel}>Componente</Text>
            <View style={styles.selectWrapper}>
              {Platform.OS === 'web' ? (
                <select
                  style={htmlSelectStyle}
                  value={selectedComponente}
                  onChange={(e: any) => setSelectedComponente(e.target.value)}
                >
                  <option value="todos">Todos los componentes</option>
                  {componentes.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              ) : null}
              <Ionicons name="chevron-down-outline" size={14} color={colors.textSecondary} style={styles.selectArrow} />
            </View>
          </View>

          {/* Acción / Actividad */}
          <View style={[styles.filterGroup, { flex: 1.2, minWidth: 180 } as any]}>
            <Text style={styles.filterLabel}>Acción / Actividad</Text>
            <View style={styles.selectWrapper}>
              {Platform.OS === 'web' ? (
                <select
                  style={htmlSelectStyle}
                  value={selectedAccion}
                  onChange={(e: any) => setSelectedAccion(e.target.value)}
                >
                  <option value="todos">Todas las acciones</option>
                  {acciones.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              ) : null}
              <Ionicons name="chevron-down-outline" size={14} color={colors.textSecondary} style={styles.selectArrow} />
            </View>
          </View>

          {/* Grupo / Cohorte — solo si la acción seleccionada tiene grupos */}
          {selectedAccionId && (
            <View style={[styles.filterGroup, { flex: 1.2, minWidth: 170 } as any]}>
              <ActionGroupSelect
                accionId={selectedAccionId}
                selectedGrupoId={selectedGrupoId}
                onSelectGrupoId={setSelectedGrupoId}
              />
            </View>
          )}

          {/* Fechas */}
          <View style={[styles.filterGroup, { flex: 1, minWidth: 130 } as any]}>
            <Text style={styles.filterLabel}>Fecha desde</Text>
            <View style={styles.inputWrapper}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  style={htmlDateInputStyle}
                  value={fechaDesde}
                  onChange={(e: any) => setFechaDesde(e.target.value)}
                />
              ) : null}
            </View>
          </View>

          <View style={[styles.filterGroup, { flex: 1, minWidth: 130 } as any]}>
            <Text style={styles.filterLabel}>Fecha hasta</Text>
            <View style={styles.inputWrapper}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  style={htmlDateInputStyle}
                  value={fechaHasta}
                  onChange={(e: any) => setFechaHasta(e.target.value)}
                />
              ) : null}
            </View>
          </View>
        </View>
      </Card>

      {/* Tabla Collapsible al 100% de Ancho */}
      <Card style={styles.tableCard}>
        {filteredEvidencias.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={44} color={colors.textSecondary} style={{ opacity: 0.4 }} />
            <Text style={styles.emptyText}>No se encontraron registros de evidencias.</Text>
          </View>
        ) : (
          <>
            <View style={styles.tableContainer}>
              {/* Header */}
              <View style={styles.tableHeaderRow}>
                <View style={{ width: 40 }} />
                <Text style={[styles.th, { flex: 2.2 }]}>Colaborador</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>Meta / Objetivo</Text>
                <Text style={[styles.th, { flex: 1.8 }]}>Acción / Actividad</Text>
                <Text style={[styles.th, { flex: 2.2 }]}>Evidencia (Carpeta)</Text>
                <Text style={[styles.th, { width: 90, textAlign: 'center' }]}>Cant. Soportes</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>Fecha Ejec.</Text>
                <Text style={[styles.th, { width: 90, textAlign: 'center' }]}>Estado</Text>
                <Text style={[styles.th, { width: 140, textAlign: 'center' }]}>Acciones</Text>
              </View>

              {/* Filas */}
              {paginatedEvidencias.map((ev) => {
                const badge = getStatusBadgeStyle(ev.estado);
                const isExpanded = !!expandedRows[ev.id];
                return (
                  <View key={ev.id} style={styles.rowContainer}>
                    {/* Fila Principal */}
                    <TouchableOpacity 
                      style={[styles.tableRow, isExpanded && styles.tableRowActive]}
                      onPress={() => toggleRow(ev.id)}
                      activeOpacity={0.85}
                    >
                      {/* Arrow */}
                      <View style={styles.arrowCol}>
                        <Ionicons 
                          name={isExpanded ? "chevron-down" : "chevron-forward"} 
                          size={16} 
                          color={colors.textSecondary} 
                        />
                      </View>

                      {/* Colaborador Avatar + Info */}
                      <View style={[styles.tdCol, { flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 10 } as any]}>
                        <View style={styles.avatar}>
                          {ev.creada_por?.photo_url ? (
                            <Image 
                              source={{ uri: toUrl(ev.creada_por.photo_url) }} 
                              style={{ width: 32, height: 32, borderRadius: 16 }} 
                            />
                          ) : (
                            <Text style={styles.avatarText}>{getInitials(ev.creada_por?.nombre)}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.colabName} numberOfLines={1}>{ev.creada_por?.nombre || 'Desconocido'}</Text>
                          <Text style={styles.colabEmail} numberOfLines={1}>{ev.creada_por?.email || 'colaborador@email.com'}</Text>
                        </View>
                      </View>


                      {/* Meta */}
                      <Text style={[styles.td, { flex: 1.2 }]} numberOfLines={2}>
                        {ev.accion?.meta_nombre || '-'}
                      </Text>

                      {/* Acción */}
                      <Text style={[styles.td, { flex: 1.8 }]} numberOfLines={2}>
                        {ev.accion?.nombre || '-'}
                      </Text>

                      {/* Evidencia */}
                      <View style={{ flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 8 } as any}>
                        <Ionicons name="folder-outline" size={18} color="#64748b" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: typography.fontFamily, fontSize: 13, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>
                            {ev.nombre}
                          </Text>
                          {ev.grupo && (
                            <Text style={{ fontFamily: typography.fontFamily, fontSize: 10, color: '#1d4ed8', fontWeight: '600', marginTop: 2 }}>
                              Grupo: {ev.grupo.nombre} {ev.grupo.codigo ? `(${ev.grupo.codigo})` : ''}
                            </Text>
                          )}
                          {!!ev.descripcion && (
                            <Text style={{ fontFamily: typography.fontFamily, fontSize: 10, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                              {ev.descripcion}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Cant Soportes Badge */}
                      <View style={{ width: 90, alignItems: 'center' }}>
                        <View style={styles.countBadge}>
                          <Text style={styles.countBadgeText}>{ev.soportes.length}</Text>
                        </View>
                      </View>

                      {/* Fecha */}
                      <Text style={[styles.td, { flex: 1.2, color: colors.textSecondary }]}>
                        {ev.fecha_ejecucion || '-'}
                      </Text>

                      {/* Estado */}
                      <View style={{ width: 90, alignItems: 'center' }}>
                        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                            {ev.estado.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      {/* Acciones */}
                      <View style={{ width: 140, flexDirection: 'row', gap: 6, justifyContent: 'center' } as any}>
                        {(ev.estado === 'enviada' || ev.estado === 'aprobada' || ev.estado === 'observada') && (
                          <TouchableOpacity
                            style={styles.reabrirBtn}
                            disabled={reabriendoId === ev.id}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleReabrir(ev);
                            }}
                          >
                            {reabriendoId === ev.id ? (
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                              <>
                                <Ionicons name="refresh-outline" size={12} color="#ffffff" />
                                <Text style={styles.actionBtnText}>Reabrir</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}

                        {isSuperAdmin && (
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            disabled={eliminandoId === ev.id}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleEliminar(ev.id);
                            }}
                          >
                            {eliminandoId === ev.id ? (
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                              <Ionicons name="trash-outline" size={14} color="#ffffff" />
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>

                     {/* Fila Desplegable de Soportes (Collapsible Drawer) */}
                    {isExpanded && (() => {
                      const groupedSoportes: Record<string, Soporte[]> = {};
                      // Pre-populate groupedSoportes with all active requirements
                      const reqsList = ev.accion?.requisitos || [];
                      reqsList.forEach((r: any) => {
                        groupedSoportes[r.nombre] = [];
                      });

                      ev.soportes.forEach((s) => {
                        const reqName = s.requisito_nombre || 'Otros archivos';
                        if (!groupedSoportes[reqName]) {
                          groupedSoportes[reqName] = [];
                        }
                        groupedSoportes[reqName].push(s);
                      });

                      return (
                        <View style={styles.expandedDrawer}>
                          <View style={styles.drawerHeader}>
                            <Text style={styles.drawerTitle}>Lista de Requisitos de Verificación</Text>
                            <View style={styles.drawerCountBadge}>
                              <Text style={styles.drawerCountBadgeText}>{ev.soportes.length} archivos</Text>
                            </View>
                          </View>

                          <View style={styles.requisitosContainer}>
                            {Object.keys(groupedSoportes).length === 0 ? (
                              <Text style={styles.emptySoportesText}>No hay requisitos configurados ni archivos cargados.</Text>
                            ) : (
                              Object.entries(groupedSoportes).map(([reqName, soportesGrupo]) => {
                                const reqObj = reqsList.find((r: any) => r.nombre === reqName);
                                const isObligatorio = reqObj ? reqObj.obligatorio : false;
                                const minArchivos = reqObj ? reqObj.min_archivos : 1;
                                const isUploadedOk = soportesGrupo.length >= minArchivos;
                                
                                const approvedList = reqsAprobados[ev.id] || [];
                                const isChecked = approvedList.includes(reqName);
                                
                                const handleToggleCheck = () => {
                                  let nextList = [...approvedList];
                                  if (nextList.includes(reqName)) {
                                    nextList = nextList.filter(x => x !== reqName);
                                  } else {
                                    nextList.push(reqName);
                                  }
                                  
                                  setReqsAprobados(prev => ({ ...prev, [ev.id]: nextList }));
                                  
                                  // Determine what needs to be checked
                                  const reqsToApprove = reqsList.length > 0 ? reqsList.map((r: any) => r.nombre) : Object.keys(groupedSoportes);
                                  const allChecked = reqsToApprove.every((n: string) => nextList.includes(n));
                                  
                                  if (allChecked) {
                                    handleRevisar(ev, 'aprobar');
                                  }
                                };

                                return (
                                  <View key={reqName} style={styles.requisitoGroup}>
                                    <View style={styles.requisitoGroupHeader}>
                                      {ev.estado === 'enviada' ? (
                                        <TouchableOpacity 
                                          onPress={handleToggleCheck} 
                                          style={{ marginRight: 6 }}
                                        >
                                          <Ionicons 
                                            name={isChecked ? "checkbox" : "square-outline"} 
                                            size={20} 
                                            color={isChecked ? "#10b981" : "#64748b"} 
                                          />
                                        </TouchableOpacity>
                                      ) : (
                                        <Ionicons 
                                          name={isUploadedOk ? "checkmark-circle" : (isObligatorio ? "alert-circle" : "ellipse-outline")} 
                                          size={18} 
                                          color={isUploadedOk ? "#10b981" : (isObligatorio ? "#ef4444" : "#94a3b8")} 
                                          style={{ marginRight: 6 }}
                                        />
                                      )}
                                      <Text style={styles.requisitoGroupTitle}>
                                        {reqName} {isObligatorio && <Text style={{ color: '#ef4444' }}>*</Text>}
                                      </Text>
                                      <Text style={styles.requisitoGroupCount}>
                                        ({soportesGrupo.length} de {minArchivos} cargados)
                                      </Text>
                                    </View>
                                    
                                    {soportesGrupo.length > 0 ? (
                                      <View style={styles.soportesGrid}>
                                        {soportesGrupo.map((s) => {
                                          const isImg = s.file_type?.startsWith('image/');
                                          return (
                                            <View key={s.id} style={styles.soporteGridItem}>
                                              <View style={styles.soportePreview}>
                                                {isImg ? (
                                                  <Image 
                                                    source={{ uri: cloudinaryThumb(s.file_url) }} 
                                                    style={styles.soporteThumbImage} 
                                                    resizeMode="cover"
                                                  />
                                                ) : (
                                                  <View style={[styles.soporteIconWrapper, { backgroundColor: fileColor(s.file_type) + '12', flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }]}>
                                                    <Ionicons name={fileIcon(s.file_type)} size={24} color={fileColor(s.file_type)} />
                                                  </View>
                                                )}
                                                
                                                {/* Action overlay */}
                                                <View style={styles.soporteHoverOverlay}>
                                                  {Platform.OS === 'web' && (
                                                    <TouchableOpacity 
                                                      style={styles.soporteHoverBtn}
                                                      onPress={() => window.open(toUrl(s.file_url), '_blank')}
                                                    >
                                                      <Ionicons name="cloud-download-outline" size={14} color="#ffffff" />
                                                    </TouchableOpacity>
                                                  )}
                                                  <TouchableOpacity 
                                                    style={styles.soporteHoverBtn}
                                                    onPress={() => setPreviewSoporte(s)}
                                                  >
                                                    <Ionicons name="eye-outline" size={14} color="#ffffff" />
                                                  </TouchableOpacity>
                                                </View>
                                              </View>
                                            </View>
                                          );
                                        })}
                                      </View>
                                    ) : (
                                      <Text style={{ fontFamily: typography.fontFamily, fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 }}>
                                        No se han cargado archivos para este requisito.
                                      </Text>
                                    )}
                                  </View>
                                );
                              })
                            )}
                          </View>

                          {/* Approval / Review Panel (Observation still manual) */}
                          {ev.estado === 'enviada' && (
                            <View style={styles.reviewPanel}>
                              <Text style={styles.reviewPanelTitle}>Devolver con Observación</Text>
                              <View style={styles.reviewCommentContainer}>
                                <Text style={styles.reviewLabel}>Escribe la observación si deseas devolver/observar la evidencia (requerido para observar):</Text>
                                {Platform.OS === 'web' ? (
                                  <textarea
                                    style={htmlTextAreaStyle}
                                    placeholder="Escribe un comentario u observación..."
                                    value={observaciones[ev.id] || ''}
                                    onChange={(e: any) => setObservaciones(prev => ({ ...prev, [ev.id]: e.target.value }))}
                                  />
                                ) : null}
                              </View>
                              <View style={styles.reviewActionsRow}>
                                <TouchableOpacity
                                  style={[styles.reviewBtn, styles.reviewBtnObservar, { flex: 0.5 }]}
                                  disabled={revisandoId === ev.id}
                                  onPress={() => handleRevisar(ev, 'observar')}
                                >
                                  {revisandoId === ev.id ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                  ) : (
                                    <>
                                      <Ionicons name="alert-circle-outline" size={16} color="#ffffff" />
                                      <Text style={styles.reviewBtnText}>Observar / Devolver</Text>
                                    </>
                                  )}
                                </TouchableOpacity>
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })()}

                  </View>
                );
              })}
            </View>

            {/* Paginación Premium */}
            <View style={styles.paginationRow}>
              <Text style={styles.paginationText}>
                Mostrando <Text style={{ fontWeight: 'bold' }}>{Math.min(filteredEvidencias.length, (currentPage - 1) * pageSize + 1)}</Text> a <Text style={{ fontWeight: 'bold' }}>{Math.min(filteredEvidencias.length, currentPage * pageSize)}</Text> de <Text style={{ fontWeight: 'bold' }}>{filteredEvidencias.length}</Text> registros
              </Text>
              
              <View style={styles.pageSizeRow}>
                <Text style={styles.pageSizeLabel}>Filas por página:</Text>
                {Platform.OS === 'web' && (
                  <select
                    style={htmlPageSelectStyle}
                    value={pageSize}
                    onChange={(e: any) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                )}
              </View>

              <View style={styles.paginationButtons}>
                <TouchableOpacity
                  style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? '#94a3b8' : colors.primary} />
                </TouchableOpacity>

                <View style={styles.pageNumberBadge}>
                  <Text style={styles.pageNumberText}>{currentPage} / {totalPages}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? '#94a3b8' : colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </Card>

      {/* Modal Premium de Vista Previa */}
      {previewSoporte && (
        <Modal visible={!!previewSoporte} transparent animationType="fade" onRequestClose={() => setPreviewSoporte(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 } as any}>
                  <Ionicons name={fileIcon(previewSoporte.file_type)} size={20} color={fileColor(previewSoporte.file_type)} />
                  <Text style={styles.modalTitle} numberOfLines={1}>{previewSoporte.file_name}</Text>
                </View>
                <TouchableOpacity onPress={() => setPreviewSoporte(null)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {previewSoporte.file_type?.startsWith('image/') ? (
                  <View 
                    style={styles.imagePreviewContainer}
                    {...(Platform.OS === 'web' ? {
                      onWheel: handleWheel,
                      onMouseDown: handleMouseDown,
                      onMouseMove: handleMouseMove,
                      onMouseUp: handleMouseUpOrLeave,
                      onMouseLeave: handleMouseUpOrLeave,
                    } : {})}
                  >
                    <Image 
                      source={{ uri: toUrl(previewSoporte.file_url) }} 
                      style={{
                        width: '100%',
                        height: 380,
                        transform: [
                          { scale: zoomScale },
                          { translateX: pan.x / zoomScale },
                          { translateY: pan.y / zoomScale }
                        ],
                        cursor: isDragging.current ? 'grabbing' : 'grab',
                      } as any} 
                      resizeMode="contain" 
                    />
                    
                    {Platform.OS === 'web' && (
                      <View style={styles.zoomControls}>
                        <TouchableOpacity onPress={() => setZoomScale(prev => Math.max(1, prev - 0.2))} style={styles.zoomBtn}>
                          <Ionicons name="remove" size={16} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.zoomText}>{Math.round(zoomScale * 100)}%</Text>
                        <TouchableOpacity onPress={() => setZoomScale(prev => Math.min(4, prev + 0.2))} style={styles.zoomBtn}>
                          <Ionicons name="add" size={16} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setZoomScale(1); setPan({ x: 0, y: 0 }); }} style={styles.zoomBtn}>
                          <Ionicons name="refresh" size={16} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={styles.nonImagePreview}>
                    <Ionicons name={fileIcon(previewSoporte.file_type)} size={72} color={fileColor(previewSoporte.file_type)} />
                    <Text style={styles.nonImageText}>No es posible previsualizar este tipo de archivo directamente.</Text>
                    <Text style={styles.nonImageSubtext}>Formato: {previewSoporte.file_type || 'Desconocido'}</Text>
                  </View>
                )}
              </View>

              <View style={styles.modalFooter}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFooterMeta}>Cargado el: {previewSoporte.created_at || 'Fecha no disponible'}</Text>
                  <Text style={styles.modalFooterSize}>Tamaño: {(previewSoporte.file_size / 1024).toFixed(1)} KB</Text>
                </View>
                {Platform.OS === 'web' && (
                  <TouchableOpacity
                    style={styles.openTabBtn}
                    onPress={() => window.open(toUrl(previewSoporte.file_url), '_blank')}
                  >
                    <Text style={styles.openTabBtnText}>Abrir en pestaña nueva ↗</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Dialog Modal Premium */}
      {dialogConfig?.visible && (
        <Modal visible={dialogConfig.visible} transparent animationType="fade" onRequestClose={() => setDialogConfig(null)}>
          <View style={styles.dialogOverlay}>
            <View style={styles.dialogContent}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>{dialogConfig.title}</Text>
              </View>
              <View style={styles.dialogBody}>
                <Text style={styles.dialogMessage}>{dialogConfig.message}</Text>
                {dialogConfig.type === 'prompt' && (
                  <View style={{ width: '100%', marginTop: 12 }}>
                    {Platform.OS === 'web' ? (
                      <input
                        type="text"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: `1px solid ${colors.border}`,
                          fontSize: '13px',
                          fontFamily: typography.fontFamily,
                          backgroundColor: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        placeholder="Escribe aquí..."
                        value={dialogConfig.inputValue}
                        onChange={(e: any) => setDialogConfig(prev => prev ? { ...prev, inputValue: e.target.value } : null)}
                        autoFocus
                      />
                    ) : null}
                  </View>
                )}
              </View>
              <View style={styles.dialogFooter}>
                {dialogConfig.type !== 'alert' && (
                  <TouchableOpacity 
                    onPress={dialogConfig.onCancel} 
                    style={[styles.dialogBtn, styles.dialogBtnCancel]}
                  >
                    <Text style={styles.dialogBtnCancelText}>{dialogConfig.cancelText || 'Cancelar'}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  onPress={() => dialogConfig.onConfirm(dialogConfig.inputValue)} 
                  style={[styles.dialogBtn, styles.dialogBtnConfirm]}
                >
                  <Text style={styles.dialogBtnConfirmText}>{dialogConfig.confirmText || 'Aceptar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </AppShell>
  );

};
