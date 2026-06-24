import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';

interface Props {
  onFileCaptured: (file: any, fileName: string) => void;
  allowedTypes?: string[];
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const allowsImages = (types: string[]) =>
  types.length === 0 || types.some(t => IMAGE_TYPES.includes(t));

const buildAccept = (types: string[]) =>
  types.length > 0 ? types.join(',') : '*/*';

export const EvidenciaCaptureSheet: React.FC<Props> = ({
  onFileCaptured,
  allowedTypes = [],
}) => {
  const fileInputRef = useRef<any>(null);

  // ── Web: siempre usa el file picker nativo del navegador ──────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.webBtn}
          onPress={() => fileInputRef.current?.click()}
        >
          <Ionicons name="camera-outline" size={32} color={colors.primary} />
          <Text style={styles.webBtnTxt}>Arrastra tu archivo aquí</Text>
          <Text style={styles.webBtnOr}>o</Text>
          <View style={styles.webBtnSolid}>
            <Text style={styles.webBtnSolidTxt}>Tomar foto</Text>
          </View>
          <Text style={styles.webBtnSub}>
            Formatos permitidos: {allowedTypes.length > 0 ? allowedTypes
                .map(t => {
                  if (t === 'application/pdf') return 'PDF';
                  if (t === 'image/jpeg') return 'JPG';
                  if (t === 'image/png') return 'PNG';
                  if (t === 'image/webp') return 'WEBP';
                  if (t.includes('wordprocessingml')) return 'DOC';
                  if (t.includes('spreadsheetml')) return 'XLS';
                  return t;
                })
                .join(', ') : 'JPG, PNG, PDF'}. Máx. 10MB
          </Text>
        </TouchableOpacity>
        <input
          ref={fileInputRef}
          type="file"
          accept={buildAccept(allowedTypes)}
          style={{ display: 'none' } as any}
          onChange={(e: any) => {
            const f = e.target.files?.[0];
            if (f) {
              onFileCaptured(f, f.name);
              e.target.value = '';
            }
          }}
        />
      </View>
    );
  }

  // ── Mobile: opciones según tipos permitidos ───────────────────────────────
  const canImage = allowsImages(allowedTypes);

  const handleCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      const name = a.uri.split('/').pop() || 'photo.jpg';
      onFileCaptured({ uri: a.uri, name, type: 'image/jpeg' }, name);
    }
  };

  const handleGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const a = result.assets[0];
      const name = a.uri.split('/').pop() || 'image.jpg';
      onFileCaptured({ uri: a.uri, name, type: 'image/jpeg' }, name);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {canImage && (
          <TouchableOpacity style={styles.option} onPress={handleCamera}>
            <View style={[styles.icon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="camera" size={28} color={colors.primary} />
            </View>
            <Text style={styles.label}>Cámara</Text>
          </TouchableOpacity>
        )}
        {canImage && (
          <TouchableOpacity style={styles.option} onPress={handleGallery}>
            <View style={[styles.icon, { backgroundColor: '#10b98115' }]}>
              <Ionicons name="image" size={28} color="#10b981" />
            </View>
            <Text style={styles.label}>Galería</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
  },
  // Web
  webBtn: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: `${colors.primary}40`,
    borderRadius: 12,
    borderStyle: 'dashed' as any,
    gap: spacing.xs,
  } as any,
  webBtnTxt: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  webBtnOr: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: colors.textSecondary,
  },
  webBtnSolid: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  webBtnSolidTxt: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: '#fff',
  },
  webBtnSub: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: colors.textSecondary,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  // Mobile
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  } as any,
  option: { alignItems: 'center', flex: 1 },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
});
