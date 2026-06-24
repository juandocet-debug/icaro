import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

/**
 * UserAvatar — componente reutilizable para mostrar fotos o iniciales de usuario.
 *
 * Reglas:
 *  - Si `photoUrl` es una URL válida, muestra <Image> de React Native (compatible Expo Web/móvil).
 *  - Si la imagen falla al cargar, usa fallback de iniciales.
 *  - Si `photoUrl` es null, usa directamente las iniciales con `fallbackColor`.
 *  - NO usa <img> HTML: garantiza compatibilidad Expo Web + móvil.
 *  - Tamaño y forma estables para no alterar layouts de tablas.
 *
 * No duplicar lógica de avatar en otros componentes; reutilizar este.
 */

interface UserAvatarProps {
  /** Nombre completo o username para generar iniciales */
  name: string;
  /** URL absoluta pública de la foto, o null */
  photoUrl: string | null;
  /** Tamaño en píxeles (ancho = alto) */
  size?: number;
  /** Color de fondo para el avatar de iniciales */
  fallbackColor?: string;
  style?: any;
}

/**
 * Genera hasta 2 iniciales a partir del nombre completo.
 * Ejemplo: "Juan Pérez" → "JP"
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0 || !words[0]) return '?';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  photoUrl,
  size = 36,
  fallbackColor = colors.primary,
  style,
}) => {
  const [imgError, setImgError] = useState(false);

  const initials = getInitials(name);
  const showImage = !!photoUrl && !imgError;

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (showImage) {
    return (
      <Image
        source={{ uri: photoUrl! }}
        style={[styles.image, circleStyle, style]}
        resizeMode="cover"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        circleStyle,
        { backgroundColor: fallbackColor + '22' },
        style,
      ]}
    >
      <Text style={[styles.initials, { color: fallbackColor, fontSize: size * 0.38 }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.weights.bold,
    includeFontPadding: false,
  },
});
