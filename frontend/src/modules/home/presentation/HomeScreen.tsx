import React from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
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
import { router } from 'expo-router';

export const HomeScreen: React.FC = () => {
  const { logout, userProfile } = useAuth();
  const { accessProfile, isLoading: accessLoading } = useAccess();
  const { width } = useWindowDimensions();
  const isSplit = width >= 768;

  const handleLogout = async () => {
    await logout();
  };

  // Usuario sin proyectos y no superadmin
  if (!accessLoading && accessProfile && !accessProfile.esSuperadministrador && accessProfile.asignaciones.length === 0) {
    return <NoAssignmentsScreen />;
  }

  // Rol principal a mostrar en el perfil
  const rolPrincipal = accessProfile?.esSuperadministrador
    ? 'Superadministrador'
    : accessProfile?.asignaciones[0]?.rolNombre ?? 'Usuario';


  const dashboardContent = (
    <View style={styles.dashboardGrid}>
      {/* Columna Izquierda (65% en Web) */}
      <View style={isSplit ? styles.leftColumn : styles.fullWidth}>
        <WelcomeBanner username={userProfile?.username ?? 'Usuario'} />

        {/* 3 MetricCards con sparklines */}
        <View style={styles.metricsRow}>
          <Card padding="md" style={styles.metricCard}>
            <View style={styles.metricContent}>
              <View style={styles.metricInfo}>
                <Text style={styles.metricTitle}>Proyectos Activos</Text>
                <Text style={styles.metricValue}>12</Text>
                <Text style={styles.metricSubText}>+4% este mes</Text>
              </View>
              {/* Sparkline */}
              <View style={styles.sparkline}>
                <View style={[styles.sparkBar, { height: 10 }]} />
                <View style={[styles.sparkBar, { height: 25 }]} />
                <View style={[styles.sparkBar, { height: 15 }]} />
                <View style={[styles.sparkBar, { height: 35 }]} />
                <View style={[styles.sparkBar, { height: 20 }]} />
              </View>
            </View>
          </Card>

          <Card padding="md" style={styles.metricCard}>
            <View style={styles.metricContent}>
              <View style={styles.metricInfo}>
                <Text style={styles.metricTitle}>Evidencias</Text>
                <Text style={styles.metricValue}>85</Text>
                <Text style={styles.metricSubText}>+12% esta semana</Text>
              </View>
              {/* Sparkline */}
              <View style={styles.sparkline}>
                <View style={[styles.sparkBar, { height: 15 }]} />
                <View style={[styles.sparkBar, { height: 10 }]} />
                <View style={[styles.sparkBar, { height: 30 }]} />
                <View style={[styles.sparkBar, { height: 20 }]} />
                <View style={[styles.sparkBar, { height: 40 }]} />
              </View>
            </View>
          </Card>

          <Card padding="md" style={styles.metricCard}>
            <View style={styles.metricContent}>
              <View style={styles.metricInfo}>
                <Text style={styles.metricTitle}>Auditorías</Text>
                <Text style={styles.metricValue}>6</Text>
                <Text style={styles.metricSubText}>Al día</Text>
              </View>
              {/* Sparkline */}
              <View style={styles.sparkline}>
                <View style={[styles.sparkBar, { height: 30 }]} />
                <View style={[styles.sparkBar, { height: 20 }]} />
                <View style={[styles.sparkBar, { height: 25 }]} />
                <View style={[styles.sparkBar, { height: 15 }]} />
                <View style={[styles.sparkBar, { height: 35 }]} />
              </View>
            </View>
          </Card>
        </View>

        {/* Fila Inferior: Donut Chart + Barras de Progreso */}
        <View style={styles.bottomRow}>
          {/* Actividad Reciente (Donut Chart) */}
          <Card padding="lg" style={styles.donutCard}>
            <Text style={styles.cardSectionTitle}>Actividad Reciente</Text>
            <View style={styles.donutContainer}>
              {/* Donut Chart hecho con Views */}
              <View style={styles.donutOuter}>
                <View style={styles.donutInner}>
                  <Text style={styles.donutText}>95%</Text>
                </View>
              </View>
              <View style={styles.donutLegend}>
                <Text style={styles.legendTitle}>Proyectos</Text>
                <Text style={styles.legendDesc}>En ejecución óptima</Text>
              </View>
            </View>
          </Card>

          {/* Avance de Planes (Barras de progreso) */}
          <Card padding="lg" style={styles.progressCard}>
            <Text style={styles.cardSectionTitle}>Avance de Planes</Text>
            <View style={styles.progressList}>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Planificación</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '85%', backgroundColor: colors.primary }]} />
                </View>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Ejecución</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '60%', backgroundColor: colors.accent }]} />
                </View>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Cierre</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '35%', backgroundColor: colors.success }]} />
                </View>
              </View>
            </View>
          </Card>
        </View>

        <Button
          label="Ver Proyectos"
          onPress={() => router.push('/proyectos')}
          style={styles.btnProyectos}
        />
      </View>

      {/* Columna Derecha (35% en Web) */}
      <View style={isSplit ? styles.rightColumn : styles.fullWidth}>
        {/* Mi Perfil */}
        <Card padding="lg" style={styles.profileCard}>
          <Text style={styles.profileHeaderTitle}>Mi Perfil</Text>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{userProfile?.username ?? 'Usuario'}</Text>
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
            {!accessProfile?.esSuperadministrador && accessProfile?.asignaciones[0] && (
              <Text style={styles.profileInfoText}>
                Proyecto: {accessProfile.asignaciones[0].proyectoNombre ?? '—'}
              </Text>
            )}
          </View>
          <Button
            label="Cerrar Sesión"
            variant="ghost"
            onPress={handleLogout}
            style={styles.btnLogout}
          />
        </Card>

        {/* Calendario */}
        <MiniCalendar />
      </View>
    </View>
  );

  return (
    <AppShell scrollable={true} style={styles.shell}>
      {dashboardContent}
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
    minWidth: 200,
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
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 4,
  },
  sparkBar: {
    width: 6,
    backgroundColor: colors.primary,
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
  progressCard: {
    flex: 1.2,
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
  progressList: {
    gap: spacing.sm,
  },
  progressItem: {
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  btnProyectos: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
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
  profileCargo: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
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
  btnLogout: {
    alignSelf: 'flex-start',
  },
});
