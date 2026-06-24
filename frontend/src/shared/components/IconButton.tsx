import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { Ionicons } from '@expo/vector-icons';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: number;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'ghost',
  size = 24,
  style,
  iconColor,
}) => {
  const getButtonStyles = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: 20,
      padding: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    };

    switch (variant) {
      case 'primary':
        base.backgroundColor = colors.primary;
        break;
      case 'secondary':
        base.backgroundColor = colors.surface;
        base.borderWidth = 1;
        base.borderColor = colors.border;
        break;
      case 'ghost':
      default:
        base.backgroundColor = colors.transparent;
        break;
    }

    return base;
  };

  const getIconColor = () => {
    if (iconColor) return iconColor;
    switch (variant) {
      case 'primary':
        return colors.surface;
      default:
        return colors.textPrimary;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[getButtonStyles(), style]}
    >
      <Ionicons name={icon} size={size} color={getIconColor()} />
    </TouchableOpacity>
  );
};
