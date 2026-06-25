import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { AppShell } from '../../../shared/components/AppShell';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { Proyecto } from '../domain/Proyecto';
import { TipoDocumento } from '../domain/TipoDocumento';
import { useAuth } from '../../auth/presentation/useAuth';
import { useAccess } from '../../auth/presentation/useAccess';
import { ProyectoEquipo } from './ProyectoEquipo';
import { ProyectoMetasComponentes } from './ProyectoMetasComponentes';
import { ProyectoTiposDocumento } from './ProyectoTiposDocumento';
import { ConfirmarEliminarModal } from './ConfirmarEliminarModal';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import {
  proyectoRepo,
  tipoDocumentoRepo,
  obtenerProyectoUseCase,
  eliminarProyectoUseCase,
  asignacionResponsableRepo,
  listarMiembrosUseCase,
  listarMetasProyectoUseCase,
} from '../../../shared/dependencies';
import { router } from 'expo-router';

// Componentes modulares
import { ProyectoHeroBanner } from './components/ProyectoHeroBanner';
import { ProyectoDetallesPanel } from './components/ProyectoDetallesPanel';
import { CollaboratorActivities } from './components/CollaboratorActivities';
import { ProyectoActividadesTabla } from './components/ProyectoActividadesTabla';
import { ProyectoDetailHeaderActions } from './components/ProyectoDetailHeaderActions';

interface Props { proyectoId: string; }

export const ProyectoDetailScreen: React.FC<Props> = ({ proyectoId }) => {
  const isMobile = useIsMobile();
  const { userProfile } = useAuth();
  const { accessProfile, canInProject } = useAccess();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [tipos, setTipos] = useState<TipoDocumento[]>([]);
  // Pre-cargados junto al proyecto para eliminar spinners en los paneles
  const [initialMiembros, setInitialMiembros] = useState<any[] | null>(null);
  const [initialMetas, setInitialMetas] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState(0);
  const [eliminando, setEliminando] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // States for inline editing
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingContractInfo, setIsEditingContractInfo] = useState(false);
  const [isEditingContractObj, setIsEditingContractObj] = useState(false);

  const [tempDesc, setTempDesc] = useState('');
  const [tempContractNumber, setTempContractNumber] = useState('');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [tempContractObject, setTempContractObject] = useState('');

  const [updatingDesc, setUpdatingDesc] = useState(false);
  const [updatingContractInfo, setUpdatingContractInfo] = useState(false);
  const [updatingContractObj, setUpdatingContractObj] = useState(false);

  // States for cover image upload confirmation
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [uploadingPortada, setUploadingPortada] = useState(false);

  const [showDescSuccess, setShowDescSuccess] = useState(false);
  const [showContractInfoSuccess, setShowContractInfoSuccess] = useState(false);
  const [showContractObjSuccess, setShowContractObjSuccess] = useState(false);

  // Actividades asignadas al usuario en este proyecto
  const [misActividades, setMisActividades] = useState<any[]>([]);
  const [loadingActs, setLoadingActs] = useState(false);
  const [actsSearch, setActsSearch] = useState('');

  const repo = proyectoRepo;
  const tiposRepo = tipoDocumentoRepo;
  const useCase = obtenerProyectoUseCase;

  const isSuperAdmin = accessProfile?.esSuperadministrador === true;
  const canVerMetas = isSuperAdmin || 
    canInProject('metas.ver', proyectoId) || 
    (accessProfile?.asignaciones?.some(
      (a) => a.proyectoId === proyectoId && a.rolCodigo === 'coordinador_componente'
    ) ?? false);
  const isGestor = isSuperAdmin || (accessProfile?.asignaciones?.some(
    (a) => a.proyectoId === proyectoId && 
    ['superadministrador', 'administrador_proyecto', 'coordinador_proyecto', 'coordinador_general'].includes(a.rolCodigo)
  ) ?? false);

  const isAdmin = userProfile?.isStaff ?? false;
  const canEdit = isGestor || isAdmin;
  const canVerEquipo = isSuperAdmin || canInProject('miembros.ver', proyectoId);
  const canManageEquipo = isSuperAdmin || canInProject('miembros.asignar', proyectoId);
  const isCoordinadorOAdmin = isSuperAdmin || (accessProfile?.asignaciones?.some(
    (a) => a.proyectoId === proyectoId && 
    ['superadministrador', 'administrador_proyecto', 'coordinador_proyecto', 'coordinador_general', 'coordinador_componente'].includes(a.rolCodigo)
  ) ?? false);

  const showMisActividades = !isCoordinadorOAdmin && (accessProfile?.asignaciones?.some(
    (a) => a.proyectoId === proyectoId && a.rolCodigo === 'profesional_carga'
  ) ?? false);

  useEffect(() => {
    const cargar = async () => {
      try {
        // Cargar todo en paralelo: proyecto + tipos + miembros + metas
        // Los paneles reciben data directa → no muestran spinner propio en primera carga
        const [p, ts, miembros, metas] = await Promise.all([
          useCase.ejecutar(proyectoId),
          tiposRepo.listar(proyectoId),
          listarMiembrosUseCase.ejecutar(proyectoId).catch(() => null),
          listarMetasProyectoUseCase.ejecutar(proyectoId).catch(() => null),
        ]);
        setProyecto(p);
        setTipos(ts);
        setInitialMiembros(miembros);
        setInitialMetas(metas);
      } catch {
        setError('No se pudo cargar el proyecto.');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [proyectoId]);

  useEffect(() => {
    if (!accessProfile) return;
    setLoadingActs(true);
    asignacionResponsableRepo.listarMisActividades(undefined, '', 1, proyectoId)
      .then(r => setMisActividades(r.datos || []))
      .catch(() => {})
      .finally(() => setLoadingActs(false));
  }, [proyectoId, accessProfile]);

  const handleConfirmPortada = async () => {
    if (!tempFile) return;
    setUploadingPortada(true);
    setUploadError(null);
    try {
      const actualizado = await repo.subirPortada(proyectoId, tempFile);
      setImageError(false);
      setImageTimestamp(Date.now());
      setProyecto(actualizado);
      setTempFile(null);
    } catch (e: any) {
      setUploadError(e?.response?.data?.error || 'No se pudo subir la imagen. Verificá el formato y tamaño (máx 20MB).');
    } finally {
      setUploadingPortada(false);
    }
  };

  const handleCancelPortada = () => {
    setTempFile(null);
  };

  const handleSaveDesc = async () => {
    if (!proyecto) return;
    setUpdatingDesc(true);
    try {
      const actualizado = await repo.actualizar(proyectoId, { description: tempDesc });
      setProyecto(actualizado);
      setIsEditingDesc(false);
      setShowDescSuccess(true);
      setTimeout(() => setShowDescSuccess(false), 3000);
    } catch {
      setUploadError('No se pudo guardar la descripción del proyecto.');
    } finally {
      setUpdatingDesc(false);
    }
  };

  const handleSaveContractInfo = async () => {
    if (!proyecto) return;
    setUpdatingContractInfo(true);
    try {
      const actualizado = await repo.actualizar(proyectoId, {
        contractNumber: tempContractNumber || null,
        startDate: tempStartDate || null,
        endDate: tempEndDate || null,
      });
      setProyecto(actualizado);
      setIsEditingContractInfo(false);
      setShowContractInfoSuccess(true);
      setTimeout(() => setShowContractInfoSuccess(false), 3000);
    } catch {
      setUploadError('No se pudo guardar la información del contrato.');
    } finally {
      setUpdatingContractInfo(false);
    }
  };

  const handleSaveContractObj = async () => {
    if (!proyecto) return;
    setUpdatingContractObj(true);
    try {
      const actualizado = await repo.actualizar(proyectoId, { contractObject: tempContractObject });
      setProyecto(actualizado);
      setIsEditingContractObj(false);
      setShowContractObjSuccess(true);
      setTimeout(() => setShowContractObjSuccess(false), 3000);
    } catch {
      setUploadError('No se pudo guardar el objeto del contrato.');
    } finally {
      setUpdatingContractObj(false);
    }
  };

  const ejecutarEliminacion = async () => {
    setEliminando(true);
    try {
      await eliminarProyectoUseCase.ejecutar(proyectoId);
      router.replace('/proyectos');
    } catch {
      setUploadError('No se pudo eliminar el proyecto. Intenta nuevamente.');
    } finally {
      setEliminando(false);
    }
  };

  const filteredActs = useMemo(() => {
    return misActividades.filter((item: any) => {
      const act = item.accion;
      const searchLower = actsSearch.toLowerCase();
      return (
        act.nombre.toLowerCase().includes(searchLower) ||
        (act.componente_nombre || '').toLowerCase().includes(searchLower) ||
        (act.meta_nombre || '').toLowerCase().includes(searchLower)
      );
    });
  }, [misActividades, actsSearch]);

  const groupedActs = useMemo(() => {
    const groups: { [componentName: string]: { metaNombre: string, items: any[] } } = {};
    filteredActs.forEach((item: any) => {
      const act = item.accion;
      const compName = act.componente_nombre || 'Sin Componente';
      if (!groups[compName]) {
        groups[compName] = { metaNombre: act.meta_nombre || '', items: [] };
      }
      groups[compName].items.push(item);
    });
    return Object.entries(groups).map(([compName, data]) => ({
      componenteNombre: compName,
      metaNombre: data.metaNombre,
      items: data.items
    }));
  }, [filteredActs]);

  if (loading) {
    return (
      <AppShell style={styles.shell}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </AppShell>
    );
  }

  if (error || !proyecto) {
    return (
      <AppShell style={styles.shell}>
        <ErrorMessage message={error ?? 'Proyecto no encontrado.'} />
      </AppShell>
    );
  }

  return (
    <AppShell scrollable={true} style={styles.shell}>
      {/* Cabecera superior de acciones */}
      <ProyectoDetailHeaderActions
        proyectoId={proyectoId}
        isGestor={isGestor}
        isSuperAdmin={isSuperAdmin}
        eliminando={eliminando}
        solicitarEliminacion={() => setShowConfirmModal(true)}
      />

      {!!uploadError && (
        <View style={styles.uploadErrBox}>
          <ErrorMessage message={uploadError} />
        </View>
      )}

      {/* Banner de Portada de Proyecto */}
      <ProyectoHeroBanner
        proyecto={proyecto}
        isMobile={isMobile}
        canEdit={canEdit}
        imageError={imageError}
        setImageError={setImageError}
        imageTimestamp={imageTimestamp}
        tempFile={tempFile}
        uploadingPortada={uploadingPortada}
        handleConfirmPortada={handleConfirmPortada}
        handleCancelPortada={handleCancelPortada}
        setTempFile={setTempFile}
        setUploadError={setUploadError}
      />

      {/* Panel de detalles del Proyecto */}
      <ProyectoDetallesPanel
        proyecto={proyecto}
        canEdit={canEdit}
        isMobile={isMobile}
        isEditingDesc={isEditingDesc}
        setIsEditingDesc={setIsEditingDesc}
        tempDesc={tempDesc}
        setTempDesc={setTempDesc}
        updatingDesc={updatingDesc}
        handleSaveDesc={handleSaveDesc}
        showDescSuccess={showDescSuccess}
        isEditingContractInfo={isEditingContractInfo}
        setIsEditingContractInfo={setIsEditingContractInfo}
        tempContractNumber={tempContractNumber}
        setTempContractNumber={setTempContractNumber}
        tempStartDate={tempStartDate}
        setTempStartDate={setTempStartDate}
        tempEndDate={tempEndDate}
        setTempEndDate={setTempEndDate}
        updatingContractInfo={updatingContractInfo}
        handleSaveContractInfo={handleSaveContractInfo}
        showContractInfoSuccess={showContractInfoSuccess}
        isEditingContractObj={isEditingContractObj}
        setIsEditingContractObj={setIsEditingContractObj}
        tempContractObject={tempContractObject}
        setTempContractObject={setTempContractObject}
        updatingContractObj={updatingContractObj}
        handleSaveContractObj={handleSaveContractObj}
        showContractObjSuccess={showContractObjSuccess}
      />

      {/* Contenedor de Estructura / Metas / Actividades */}
      {isMobile ? (
        <View style={{ gap: spacing.lg }}>
          {showMisActividades && (
            <CollaboratorActivities
              misActividades={misActividades}
              loadingActs={loadingActs}
              groupedActs={groupedActs}
              isMobileView={true}
            />
          )}
          <ProyectoMetasComponentes proyectoId={proyectoId} isAdmin={isAdmin} initialMetas={initialMetas} />
          {canVerEquipo && <ProyectoEquipo proyectoId={proyectoId} isAdmin={canManageEquipo} initialMiembros={initialMiembros} />}
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start', width: '100%' }}>
          <View style={{ flex: 1.6, gap: spacing.lg }}>
            {showMisActividades ? (
              <ProyectoActividadesTabla
                misActividades={misActividades}
                actsSearch={actsSearch}
                setActsSearch={setActsSearch}
                filteredActs={filteredActs}
                isMobile={false}
              />
            ) : (
              canVerEquipo && <ProyectoEquipo proyectoId={proyectoId} isAdmin={canManageEquipo} initialMiembros={initialMiembros} />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 240, gap: spacing.lg }}>
            <ProyectoMetasComponentes proyectoId={proyectoId} isAdmin={isAdmin} initialMetas={initialMetas} />
            {showMisActividades && canVerEquipo && <ProyectoEquipo proyectoId={proyectoId} isAdmin={canManageEquipo} initialMiembros={initialMiembros} />}
          </View>
        </View>
      )}

      {showConfirmModal && (
        <ConfirmarEliminarModal
          title="Eliminar proyecto"
          message="Esta acción eliminará el proyecto y toda su estructura asociada. No se puede deshacer."
          visible={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={ejecutarEliminacion}
        />
      )}
    </AppShell>
  );
};

const styles = StyleSheet.create({
  shell: { backgroundColor: colors.background, alignSelf: 'stretch' as any },
  loader: { marginTop: spacing.xxl },
  uploadErrBox: { alignSelf: 'stretch' as any, marginBottom: spacing.sm },
});
