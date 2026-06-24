import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

interface WelcomeBannerProps {
  username: string;
  subtitle?: string;
  title?: string;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ username, subtitle, title }) => {
  return (
    <Card padding="lg" style={styles.bannerContainer}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title ?? `¡Buen día, ${username}!`}</Text>
        <Text style={styles.subtitle}>{subtitle ?? '¡Que tengas un excelente día de trabajo!'}</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    width: '100%',
    marginBottom: spacing.lg,
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    color: 'rgba(255,255,255,0.8)',
  },
});
