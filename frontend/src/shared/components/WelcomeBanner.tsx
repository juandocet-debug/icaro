import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Card } from './Card';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

interface WelcomeBannerProps {
  name: string;
  photoUrl?: string | null;
  subtitle?: string;
  title?: string;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ name, photoUrl, subtitle, title }) => {
  const greeting = title ?? `¡Buen día, ${name}!`;

  return (
    <Card padding="lg" style={styles.bannerContainer}>
      <View style={styles.contentRow}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>
              {(name ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>{greeting}</Text>
          <Text style={styles.subtitle}>{subtitle ?? '¡Que tengas un excelente día de trabajo!'}</Text>
        </View>
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  avatarInitial: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.surface,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.surface,
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.85)',
  },
});

