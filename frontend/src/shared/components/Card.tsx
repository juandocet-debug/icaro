import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  style,
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return spacing.sm;
      case 'lg': return spacing.lg;
      case 'md':
      default:
        return spacing.md;
    }
  };

  return (
    <View style={[styles.card, { padding: getPadding() }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 10px rgba(23,32,51,0.08)' } as any
      : {
          shadowColor: '#172033',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
          elevation: 2,
        }
    ),
  },
});
