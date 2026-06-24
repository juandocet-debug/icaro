import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View, ViewStyle, Platform, StyleProp } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

interface AppShellProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  scrollable = true,
  style,
}) => {
  const content = scrollable ? (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {children}
    </ScrollView>
  ) : (
    <View style={styles.staticContent}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, style]}>
      {content}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Platform.select({
      web: spacing.xl,
      default: spacing.md,
    }),
    alignItems: 'center',
    justifyContent: 'center',
  },
  staticContent: {
    flex: 1,
    padding: Platform.select({
      web: spacing.xl,
      default: spacing.md,
    }),
    width: '100%',
  },
});
