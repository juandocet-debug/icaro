import React from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, View,
  ViewStyle, Platform, StyleProp, useWindowDimensions,
} from 'react-native';
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
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const scrollContentStyle = [
    styles.scrollContent,
    isMobile && styles.scrollContentMobile,
  ];

  const staticContentStyle = [
    styles.staticContent,
    isMobile && styles.staticContentMobile,
  ];

  const content = scrollable ? (
    <ScrollView contentContainerStyle={scrollContentStyle}>
      {children}
    </ScrollView>
  ) : (
    <View style={staticContentStyle}>
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
  // Desktop
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staticContent: {
    flex: 1,
    padding: spacing.xl,
    width: '100%',
  },
  // Mobile overrides: less padding, content stretches full-width
  scrollContentMobile: {
    padding: spacing.sm,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  staticContentMobile: {
    padding: spacing.sm,
  },
});
