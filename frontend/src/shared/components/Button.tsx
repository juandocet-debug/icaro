import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  fullWidth = false,
  style,
}) => {
  const getButtonStyles = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (fullWidth) {
      base.width = '100%';
    }

    // Colors
    switch (variant) {
      case 'secondary':
        base.backgroundColor = colors.surface;
        base.borderWidth = 1;
        base.borderColor = colors.border;
        break;
      case 'danger':
        base.backgroundColor = colors.error;
        break;
      case 'ghost':
        base.backgroundColor = colors.transparent;
        break;
      case 'primary':
      default:
        base.backgroundColor = colors.primary;
        break;
    }

    // Sizes
    switch (size) {
      case 'sm':
        base.paddingVertical = spacing.xs;
        base.paddingHorizontal = spacing.sm;
        break;
      case 'lg':
        base.paddingVertical = spacing.md;
        base.paddingHorizontal = spacing.xl;
        break;
      case 'md':
      default:
        base.paddingVertical = spacing.sm;
        base.paddingHorizontal = spacing.md;
        break;
    }

    if (disabled || loading) {
      base.opacity = 0.6;
    }

    return base;
  };

  const getTextStyles = (): TextStyle => {
    const base: TextStyle = {
      fontFamily: typography.fontFamily,
      fontWeight: typography.weights.medium,
    };

    // Colors
    switch (variant) {
      case 'secondary':
        base.color = colors.textPrimary;
        break;
      case 'ghost':
        base.color = colors.primary;
        break;
      case 'danger':
      case 'primary':
      default:
        base.color = colors.surface;
        break;
    }

    // Sizes
    switch (size) {
      case 'sm':
        base.fontSize = typography.sizes.xs;
        break;
      case 'lg':
        base.fontSize = typography.sizes.lg;
        break;
      case 'md':
      default:
        base.fontSize = typography.sizes.md;
        break;
    }

    return base;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      onPress={onPress}
      style={[getButtonStyles(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? colors.primary : colors.surface}
        />
      ) : (
        <Text style={getTextStyles()}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};
