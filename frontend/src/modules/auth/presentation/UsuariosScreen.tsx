import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, Platform, View, Text } from 'react-native';
import { router } from 'expo-router';
import { AppShell } from '../../../shared/components/AppShell';
import { Button } from '../../../shared/components/Button';
import { useAuth } from './useAuth';
import { UsuariosContent } from './UsuariosContent';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';

export const UsuariosScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (userProfile !== undefined && !userProfile?.isStaff) router.replace('/');
  }, [userProfile]);

  return (
    <AppShell scrollable={false} style={styles.shell}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gestión de Usuarios</Text>
          <Button
            label="+ Nuevo usuario"
            onPress={() => setShowForm(true)}
            style={styles.actionBtn}
          />
        </View>
        <UsuariosContent showForm={showForm} setShowForm={setShowForm} />
      </ScrollView>
    </AppShell>
  );
};

const styles = StyleSheet.create({
  shell: {
    backgroundColor: colors.background,
    alignSelf: 'stretch',
  },
  scrollContainer: {
    padding: Platform.select({ web: spacing.xl, default: spacing.md }),
    alignItems: 'stretch',
    alignSelf: 'stretch',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    minHeight: 48,
    width: '100%',
  },
  sectionTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  actionBtn: {
    backgroundColor: colors.primary,
  },
});
