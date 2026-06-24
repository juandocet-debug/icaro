import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppShell } from '../../../shared/components/AppShell';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { listarProyectosUseCase, crearProyectoUseCase } from '../../../shared/dependencies';
import { useAccess } from '../../auth/presentation/useAccess';
import { Proyecto, EstadoProyecto } from '../domain/Proyecto';
import { CreateProyectoDto } from '../domain/CreateProyectoDto';
import { ESTADOS, screenStyles } from './proyectosConfig';
import { ProyectosTabla } from './ProyectosTabla';
import { ProyectosFormulario } from './ProyectosFormulario';
import { SectionTabs } from '../../../shared/components/SectionTabs';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { useLocalSearchParams } from 'expo-router';
import { ProyectosMobileCards } from './mobile/ProyectosMobileCards';

// ── Estado vacío seguro ─────────────────────────────────────────────────────

/**
 * EmptyProjectsState — componente reutilizable para lista vacía de proyectos.
 *
 * Debe usarse en cualquier contexto que pueda mostrar un listado vacío,
 * nunca duplicar el texto ni el diseño en otro componente.
 */
const EmptyProjectsState: React.FC = () => (
  <View style={emptyStyles.container}>
    <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} style={emptyStyles.icon} />
    <Text style={emptyStyles.title}>Aún no tienes proyectos asignados</Text>
    <Text style={emptyStyles.desc}>
      Cuando un administrador de proyecto te asigne a un proyecto, aparecerá aquí.
    </Text>
  </View>
);

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  } as any,
  icon: {
    marginBottom: spacing.sm,
    opacity: 0.45,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  desc: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 360,
  },
});

// ── Pantalla principal ──────────────────────────────────────────────────────

export const ProyectosScreen: React.FC = () => {
  const isMobile = useIsMobile();
  const { can } = useAccess();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [filtro, setFiltro] = useState<EstadoProyecto | 'todos'>('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Determina si el usuario puede crear proyectos.
  // Depende exclusivamente de un permiso GLOBAL real; nunca de rol por nombre.
  const puedeCrear = can('proyectos.crear');

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarProyectosUseCase.ejecutar();
      setProyectos(data.results);
    } catch (e: any) {
      // Error controlado: no revelar detalles internos del servidor
      const status = e?.response?.status;
      if (status === 403) {
        setError('No tienes permisos para ver proyectos.');
      } else {
        setError('No se pudieron cargar los proyectos.');
      }
    } finally {
      setLoading(false);
    }
  };

  const params = useLocalSearchParams<{ crear?: string }>();

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    if (params.crear === 'true' && puedeCrear) {
      setShowForm(true);
    }
  }, [params.crear, puedeCrear]);

  const handleFiltro = (e: EstadoProyecto | 'todos') => {
    setFiltro(e);
    setShowForm(false);
  };

  const handleCrear = async (dto: CreateProyectoDto) => {
    setSaving(true);
    setFormError(null);
    try {
      await crearProyectoUseCase.ejecutar(dto);
      setShowForm(false);
      await cargar();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) {
        // Backend bloqueó: no revelar detalles internos
        setFormError('No tienes permiso para crear proyectos.');
      } else {
        setFormError(e.message || 'Error al crear el proyecto.');
      }
    } finally {
      setSaving(false);
    }
  };

  const filtrados = filtro === 'todos'
    ? proyectos
    : proyectos.filter(p => p.status === filtro);

  return (
    <AppShell scrollable={false} style={screenStyles.shell}>

      {/* Cabecera */}
      <View style={screenStyles.header}>
        <View>
          <Text style={screenStyles.titulo}>Proyectos</Text>
          {!loading && !error && (
            <Text style={screenStyles.subtitulo}>
              {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>

      {/* Formulario de creación */}
      {showForm && puedeCrear && (
        <ProyectosFormulario
          saving={saving}
          error={formError}
          onSubmit={handleCrear}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Error de carga */}
      {!!error && <ErrorMessage message={error} />}

      {/* Contenido */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={screenStyles.loader} />
      ) : error ? null : proyectos.length === 0 ? (
        // Lista vacía: estado neutro y seguro, sin tabla vacía ni filtros inútiles
        <EmptyProjectsState />
      ) : (
        <>
          {/* Filtros — homologados con la estética de la sección de seguridad */}
          <SectionTabs
            items={[
              { id: 'todos', label: 'Todos', icon: 'grid-outline' },
              { id: 'activo', label: 'Activo', icon: 'play-circle-outline' },
              { id: 'completado', label: 'Completado', icon: 'checkmark-circle-outline' },
              { id: 'inactivo', label: 'Inactivo', icon: 'pause-circle-outline' },
              { id: 'suspendido', label: 'Suspendido', icon: 'alert-circle-outline' },
            ]}
            activeId={filtro}
            onChange={(id) => handleFiltro(id as any)}
          />

          {/* Barra de cabecera de sección con botón de acción abajo de pestañas */}
          <View style={screenStyles.sectionHeaderBar}>
            <Text style={screenStyles.sectionTitle}>Gestión de Proyectos</Text>
            {puedeCrear && (
              <Button
                label={showForm ? 'Cancelar' : '+ Nuevo Proyecto'}
                variant={showForm ? 'secondary' : 'primary'}
                onPress={() => { setShowForm(v => !v); setFormError(null); }}
              />
            )}
          </View>

          {isMobile ? (
            <ProyectosMobileCards
              proyectos={filtrados}
              expandedId={expandedId}
              onExpandRow={setExpandedId}
            />
          ) : (
            <ProyectosTabla
              proyectos={filtrados}
              expandedId={expandedId}
              onExpandRow={setExpandedId}
            />
          )}
        </>
      )}
    </AppShell>
  );
};
