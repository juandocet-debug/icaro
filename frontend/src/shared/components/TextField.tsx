import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, StyleProp, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  style?: StyleProp<ViewStyle>;
  // Nuevas props opcionales — no rompen nada existente
  iconName?: keyof typeof Ionicons.glyphMap;
  darkMode?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  label, value, onChangeText, placeholder, secureTextEntry = false,
  error, autoCapitalize = 'none', keyboardType = 'default',
  returnKeyType = 'done', style, iconName, darkMode = false,
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const containerBg  = darkMode ? colors.darkSurface  : colors.surface;
  const borderColor  = focused  ? (darkMode ? colors.darkBorderFocus : colors.primary)
                                : (darkMode ? colors.darkBorder       : colors.border);
  const textColor    = darkMode ? colors.darkText      : colors.textPrimary;
  const labelColor   = darkMode ? colors.darkTextSub   : colors.textPrimary;
  const iconColor    = darkMode ? colors.darkIcon       : colors.textSecondary;
  const placeholderColor = darkMode ? colors.darkTextMuted : colors.textSecondary;

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <View style={[
        styles.row,
        { backgroundColor: containerBg, borderColor },
        focused && darkMode && styles.rowFocusDark,
      ]}>
        {!!iconName && (
          <Ionicons name={iconName} size={15} color={iconColor} style={styles.icon} />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          secureTextEntry={secureTextEntry && !showPassword}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            { color: textColor },
            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {},
          ]}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eye}>
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={16}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  rowFocusDark: {
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    height: '100%' as any,
  },
  eye: {
    padding: 4,
  },
  errorText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
