import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useAuth } from '../../auth/presentation/useAuth';
import { useAccess } from '../../auth/presentation/useAccess';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { AppShell } from '../../../shared/components/AppShell';
import { WelcomeBanner } from '../../../shared/components/WelcomeBanner';
import { MiniCalendar } from '../../../shared/components/MiniCalendar';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { NoAssignmentsScreen } from '../../../shared/components/NoAssignmentsScreen';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { listarProyectosUseCase } from '../../../shared/dependencies';
import { AxiosMetaRepository } from '../../proyectos/infrastructure/AxiosMetaRepository';
import { ProfileEditModal } from './components/ProfileEditModal';

export const HomeScreen: React.FC = () => {
  const { logout, userProfile } = useAuth();
  const { accessProfile, isLoading: accessLoading, can } = useAccess();
  const params = useLocalSearchParams<{ perfil?: string }>();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { width } = useWindowDimensions();
  const isSplit = width >= 768;

  const [proyectos, setProyectos] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Metrics state
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metrics, setMetrics] = useState({
    metasCount: 0,
    compsCount: 0,
    accsCount: 0,
    averageProgress: 0,
  });

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    if (params.perfil === 'true') {
      setShowProfileModal(true);
    }
  }, [params.perfil]);

  // Usuario sin proyectos y no superadmin
  if (!accessLoading && accessProfile && !accessProfile.esSuperadministrador && accessProfile.asignaciones.length === 0) {
    return <NoAssignmentsScreen />;
  }

  // Rol principal a mostrar en el perfil
  const rolPrincipal = accessProfile?.esSuperadministrador
    ? 'Superadministrador'
    : accessProfile?.asignaciones[0]?.rolNombre ?? 'Usuario';

  // Cargar proyectos
  useEffect(() => {
    const fetchProjects = async () => {
      if (!accessProfile) return;
      if (accessProfile.esSuperadministrador) {
        try {
          const res = await listarProyectosUseCase.ejecutar();
          const mapped = res.results.map(p => ({ id: p.id, name: p.name }));
          setProyectos(mapped);
          if (mapped.length > 0) {
            setSelectedProjectId(mapped[0].id);
          }
        } catch (e) {
          console.error('Error fetching projects for superadmin:', e);
        }
      } else {
        const unique = new Map<string, string>();
        accessProfile.asignaciones.forEach(a => {
          if (a.proyectoId && a.proyectoNombre) {
            unique.set(a.proyectoId, a.proyectoNombre);
          }
        });
        const list = Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
        setProyectos(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0].id);
        }
      }
    };
    fetchProjects();
  }, [accessProfile]);

  const metaRepo = useMemo(() => new AxiosMetaRepository(), []);

  // Cargar métricas del proyecto seleccionado
  useEffect(() => {
    if (!selectedProjectId) return;
    const fetchMetrics = async () => {
      setLoadingMetrics(true);
      try {
        const metas = await metaRepo.listar(selectedProjectId);
        let compsCount = 0;
        let accsCount = 0;
        let accumProgress = 0;

        await Promise.all(
          metas.map(async (meta) => {
            const comps = await metaRepo.listarComponentes(selectedProjectId, meta.id);
            compsCount += comps.length;
            await Promise.all(
              comps.map(async (comp) => {
                const accs = await metaRepo.listarAcciones(comp.id);
                accsCount += accs.length;
                accs.forEach(a => {
                  accumProgress += a.avancePorcentaje || 0;
                });
              })
            );
          })
        );

        const averageProgress = accsCount > 0 ? Math.round(accumProgress / accsCount) : 0;
        setMetrics({
          metasCount: metas.length,
          compsCount,
          accsCount,
          averageProgress,
        });
      } catch (err) {
        console.error('Error calculating metrics:', err);
      } finally {
        setLoadingMetrics(false);
      }
    };
    fetchMetrics();
  }, [selectedProjectId, metaRepo]);

  // Chequeos de Rol y Acción Dinámica
  const puedeCrearProyecto = can('proyectos.crear');

  const isGestorOfSelected = useMemo(() => {
    if (accessProfile?.esSuperadministrador) return true;
    return accessProfile?.asignaciones?.some(
      (a) => a.proyectoId === selectedProjectId && 
      ['superadministrador', 'administrador_proyecto', 'coordinador_proyecto', 'coordinador_general'].includes(a.rolCodigo)
    ) ?? false;
  }, [accessProfile, selectedProjectId]);

  const handleShortcutAction = () => {
    if (puedeCrearProyecto) {
      router.push('/proyectos?crear=true');
    } else if (isGestorOfSelected) {
      router.push(`/proyectos/${selectedProjectId}`);
    } else {
      router.push('/mis-actividades');
    }
  };

  const getShortcutLabel = () => {
    if (puedeCrearProyecto) return 'Crear Proyecto';
    if (isGestorOfSelected) return 'Agregar Componente';
    return 'Agregar Evidencia';
  };

  const selectedProjectName = proyectos.find(p => p.id === selectedProjectId)?.name ?? 'Seleccione Proyecto';

  const dashboardContent = (
    <View style={styles.dashboardGrid}>
      {/* Columna Izquierda (65% en Web) */}
      <View style={isSplit ? styles.leftColumn : styles.fullWidth}>
        <WelcomeBanner username={userProfile?.username ?? 'Usuario'} />

        {/* Selector de Proyecto */}
        {proyectos.length > 1 && (
          <View style={styles.selectorContainer}>
            <Text style={styles.selectorLabel}>Proyecto Activo:</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowDropdown(prev => !prev)}
            >
              <Text style={styles.dropdownButtonText} numberOfLines={1}>
                {selectedProjectName}
              </Text>
              <Ionicons
                name={showDropdown ? 'chevron-up-outline' : 'chevron-down-outline'}
                size={16}
                color={colors.primary}
              />
            </TouchableOpacity>
            {showDropdown && (
              <View style={styles.dropdownList}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {proyectos.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.dropdownItem,
                        p.id === selectedProjectId && styles.dropdownItemActive
                      ]}
                      onPress={() => {
                        setSelectedProjectId(p.id);
                        setShowDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          p.id === selectedProjectId && styles.dropdownItemTextActive
                        ]}
                        numberOfLines={1}
                      >
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Trophy Card en caso de progreso alto */}
        {!loadingMetrics && selectedProjectId && metrics.averageProgress >= 80 && (
          <Card padding="lg" style={styles.trophyCard}>
            <View style={styles.trophyContent}>
              <View style={styles.trophyIconContainer}>
                <Ionicons name="trophy" size={36} color="#FFD700" />
              </View>
              <View style={styles.trophyInfo}>
                <Text style={styles.trophyTitle}>¡Excelente Avance!</Text>
                <Text style={styles.trophyDescription}>
                  El proyecto "{selectedProjectName}" tiene un {metrics.averageProgress}% de ejecución de sus metas. ¡Buen trabajo!
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Métricas Reales */}
        {loadingMetrics ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : selectedProjectId ? (
          <>
            <View style={styles.metricsRow}>
              <Card padding="md" style={styles.metricCard}>
                <View style={styles.metricContent}>
                  <View style={styles.metricInfo}>
                    <Text style={styles.metricTitle}>Metas Activas</Text>
                    <Text style={styles.metricValue}>{metrics.metasCount}</Text>
                    <Text style={styles.metricSubText}>En este proyecto</Text>
                  </View>
                  <Ionicons name="flag-outline" size={32} color={colors.primary} style={styles.metricIcon} />
                </View>
              </Card>

              <Card padding="md" style={styles.metricCard}>
                <View style={styles.metricContent}>
                  <View style={styles.metricInfo}>
                    <Text style={styles.metricTitle}>Componentes</Text>
                    <Text style={styles.metricValue}>{metrics.compsCount}</Text>
                    <Text style={styles.metricSubText}>Estructurados</Text>
                  </View>
                  <Ionicons name="layers-outline" size={32} color={colors.primary} style={styles.metricIcon} />
                </View>
              </Card>

              <Card padding="md" style={styles.metricCard}>
                <View style={styles.metricContent}>
                  <View style={styles.metricInfo}>
                    <Text style={styles.metricTitle}>Acciones</Text>
                    <Text style={styles.metricValue}>{metrics.accsCount}</Text>
                    <Text style={styles.metricSubText}>Registradas</Text>
                  </View>
                  <Ionicons name="git-commit-outline" size={32} color={colors.primary} style={styles.metricIcon} />
                </View>
              </Card>
            </View>

            {/* Fila Inferior: Donut Chart de Avance */}
            <View style={styles.bottomRow}>
              <Card padding="lg" style={styles.donutCard}>
                <Text style={styles.cardSectionTitle}>Avance de Proyecto</Text>
                <View style={styles.donutContainer}>
                  <View style={styles.donutOuter}>
                    <View style={styles.donutInner}>
                      <Text style={styles.donutText}>{metrics.averageProgress}%</Text>
                    </View>
                  </View>
                  <View style={styles.donutLegend}>
                    <Text style={styles.legendTitle}>Ejecución General</Text>
                    <Text style={styles.legendDesc}>Porcentaje total de cumplimiento en base a las acciones definidas.</Text>
                  </View>
                </View>
              </Card>
            </View>
          </>
        ) : (
          <Text style={styles.noProjectsText}>No hay proyectos activos asignados.</Text>
        )}

        {/* Botón Dinámico de Acción */}
        <Button
          label={getShortcutLabel()}
          onPress={handleShortcutAction}
          style={styles.btnShortcut}
        />
      </View>

      {/* Columna Derecha (35% en Web) */}
      <View style={isSplit ? styles.rightColumn : styles.fullWidth}>
        {/* Mi Perfil */}
        <Card padding="lg" style={styles.profileCard}>
          <Text style={styles.profileHeaderTitle}>Mi Perfil</Text>
          <View style={styles.avatarRow}>
            <View style={[styles.avatarCircle, { overflow: 'hidden' }]}>
              {userProfile?.photoUrl ? (
                <Image source={{ uri: userProfile.photoUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>
                  {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : 'U'}
                </Text>
              )}
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName} numberOfLines={1}>
                {userProfile?.primerNombre 
                  ? `${userProfile.primerNombre} ${userProfile.primerApellido ?? ''}`.trim()
                  : userProfile?.username ?? 'Usuario'}
              </Text>
              <View style={styles.rolBadge}>
                {accessProfile?.esSuperadministrador && (
                  <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                )}
                <Text style={styles.profileRol}>{rolPrincipal}</Text>
              </View>
            </View>
          </View>
          <View style={styles.profileDivider} />
          <View style={styles.profileInfoList}>
            <Text style={styles.profileInfoText}>Email: {userProfile?.email ?? '—'}</Text>
            {proyectos.length > 0 && (
              <Text style={styles.profileInfoText}>
                Proyecto: {selectedProjectName}
              </Text>
            )}
          </View>
          <View style={styles.profileActionsRow}>
            <Button
              label="Editar Perfil"
              variant="secondary"
              onPress={() => setShowProfileModal(true)}
              style={{ flex: 1 }}
            />
            <Button
              label="Cerrar Sesión"
              variant="ghost"
              onPress={handleLogout}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        {/* Calendario */}
        <MiniCalendar />
      </View>
    </View>
  );

  return (
    <AppShell scrollable={true} style={styles.shell}>
      {dashboardContent}
      <ProfileEditModal visible={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </AppShell>
  );
};

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.background,
  },
  dashboardGrid: {
    flexDirection: Platform.select({
      web: 'row' as any,
      default: 'column' as any,
    }),
    justifyContent: 'space-between',
    width: '100%',
    padding: spacing.md,
    gap: spacing.lg,
  },
  leftColumn: {
    flex: 0.65,
  },
  rightColumn: {
    flex: 0.35,
    gap: spacing.lg,
  },
  fullWidth: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  selectorContainer: {
    marginBottom: spacing.md,
    zIndex: 10,
  },
  selectorLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropdownButtonText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(108,85,201,0.08)',
  },
  dropdownItemText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  trophyCard: {
    backgroundColor: 'rgba(108, 85, 201, 0.05)',
    borderColor: colors.primary,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  trophyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  trophyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyInfo: {
    flex: 1,
  },
  trophyTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: 2,
  },
  trophyDescription: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  metricContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricInfo: {
    flex: 1,
  },
  metricTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  metricSubText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  metricIcon: {
    opacity: 0.85,
  },
  bottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  donutCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  cardSectionTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  donutOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  donutLegend: {
    flex: 1,
  },
  legendTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  legendDesc: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  btnShortcut: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
  },
  noProjectsText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginVertical: spacing.xl,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    width: '100%',
  },
  profileHeaderTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(108,85,201,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  } as any,
  profileRol: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  profileDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  profileInfoList: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  profileInfoText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  profileActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
});
