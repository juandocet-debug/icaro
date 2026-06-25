import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

interface NoAssignmentsScreenProps {
  onLogout?: () => void;
  onEditProfile?: () => void;
  userProfile?: { username: string; photoUrl?: string | null } | null;
}

export const NoAssignmentsScreen: React.FC<NoAssignmentsScreenProps> = ({
  onLogout,
  onEditProfile,
  userProfile,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {userProfile && (
          <>
            <View style={styles.profileSection}>
              <TouchableOpacity
                onPress={onEditProfile}
                style={styles.avatarContainer}
                activeOpacity={0.8}
                accessibilityLabel="Editar foto de perfil"
              >
                {userProfile.photoUrl ? (
                  <Image source={{ uri: userProfile.photoUrl }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitial}>
                    {userProfile.username.charAt(0).toUpperCase()}
                  </Text>
                )}
                <View style={styles.editIconOverlay}>
                  <Ionicons name="camera" size={10} color={colors.surface} />
                </View>
              </TouchableOpacity>

              <View style={styles.profileInfo}>
                <Text style={styles.usernameText} numberOfLines={1}>
                  {userProfile.username}
                </Text>
                <Text style={styles.userRoleText}>Usuario</Text>
              </View>

              <View style={styles.profileActions}>
                <TouchableOpacity
                  onPress={onEditProfile}
                  style={styles.actionBtn}
                  accessibilityLabel="Editar perfil"
                >
                  <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onLogout}
                  style={[styles.actionBtn, styles.logoutBtn]}
                  accessibilityLabel="Cerrar sesión"
                >
                  <Ionicons name="log-out-outline" size={14} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}

        <View style={styles.iconWrapper}>
          <Ionicons name="folder-open-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.title}>Sin proyectos asignados</Text>
        <Text style={styles.subtitle}>
          Tu cuenta está activa, pero aún no tienes ningún proyecto asignado.{'\n'}
          Un administrador deberá asignarte a un proyecto para que puedas comenzar.
        </Text>
        <View style={styles.hint}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.hintText}>
            Contacta al administrador de tu organización para solicitar acceso a un proyecto.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xxl,
    alignItems: 'center',
    maxWidth: 500,
    width: '100%' as any,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
    gap: spacing.md,
  } as any,
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(108,85,201,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  avatarInitial: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  editIconOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  usernameText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  userRoleText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  profileActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(108,85,201,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
    marginBottom: spacing.lg,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(108,85,201,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(108,85,201,0.06)',
    borderRadius: 10,
    padding: spacing.md,
    maxWidth: 380,
  } as any,
  hintText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.primary,
    flex: 1,
    lineHeight: 18,
  },
});
