import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { Card } from './Card';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  tone?: 'purple' | 'pink' | 'green' | 'neutral';
  style?: StyleProp<ViewStyle>;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  tone = 'neutral',
  style,
}) => {
  const getToneStyles = () => {
    switch (tone) {
      case 'purple':
        return {
          bg: '#F3EFFF',
          border: '#D3C9FB',
          text: colors.primary,
        };
      case 'pink':
        return {
          bg: '#FFF0F5',
          border: '#FFD1E1',
          text: colors.accent,
        };
      case 'green':
        return {
          bg: '#EDFAF2',
          border: '#C2ECCF',
          text: colors.success,
        };
      case 'neutral':
      default:
        return {
          bg: colors.surface,
          border: colors.border,
          text: colors.textPrimary,
        };
    }
  };

  const currentTone = getToneStyles();

  return (
    <Card style={[{ backgroundColor: currentTone.bg, borderColor: currentTone.border }, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color: currentTone.text }]}>{value}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  value: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
});
