import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../../shared/components/Card';
import { colors } from '../../../../shared/constants/colors';
import { spacing } from '../../../../shared/constants/spacing';
import { typography } from '../../../../shared/constants/typography';
import { Proyecto } from '../../domain/Proyecto';

interface ProyectoHeroBannerProps {
  proyecto: Proyecto;
  isMobile: boolean;
  canEdit: boolean;
  imageError: boolean;
  setImageError: (v: boolean) => void;
  imageTimestamp: number;
  tempFile: File | null;
  uploadingPortada: boolean;
  handleConfirmPortada: () => Promise<void>;
  handleCancelPortada: () => void;
  setTempFile: (f: File | null) => void;
  setUploadError: (err: string | null) => void;
}

export const ProyectoHeroBanner: React.FC<ProyectoHeroBannerProps> = ({
  proyecto,
  isMobile,
  canEdit,
  imageError,
  setImageError,
  imageTimestamp,
  tempFile,
  uploadingPortada,
  handleConfirmPortada,
  handleCancelPortada,
  setTempFile,
  setUploadError,
}) => {
  const fileInputRef = useRef<any>(null);

  return (
    <Card style={{ height: isMobile ? 200 : 260, overflow: 'hidden', borderRadius: 24, backgroundColor: colors.primary, marginBottom: spacing.lg, width: '100%' }} padding="none">
      {proyecto.coverImageUrl && !imageError && (
        <>
          <Image
            key={`cover-${proyecto.coverImageUrl}`}
            source={{ uri: proyecto.coverImageUrl }}
            style={styles.heroBgImg}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
          <View style={styles.heroBgOverlay} />
        </>
      )}
      <View style={styles.heroInner}>
        <View style={styles.heroLeft}>
          <Text style={styles.heroLabel}>PROYECTO</Text>
          <Text style={[styles.heroTitle, isMobile && { fontSize: 18 }]} numberOfLines={2}>{proyecto.name}</Text>
          <Text style={styles.heroSub} numberOfLines={1}>
            Estado: {proyecto.status}
          </Text>
          {canEdit && Platform.OS === 'web' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs }}>
              {tempFile ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255, 255, 255, 0.95)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 }}>
                  <TouchableOpacity onPress={handleConfirmPortada} disabled={uploadingPortada} style={{ padding: 4 }}>
                    <Text style={{ fontFamily: typography.fontFamily, fontSize: 11, fontWeight: '700', color: colors.success }}>Guardar</Text>
                  </TouchableOpacity>
                  <View style={{ width: 1, height: 12, backgroundColor: '#cbd5e1' }} />
                  <TouchableOpacity onPress={handleCancelPortada} disabled={uploadingPortada} style={{ padding: 4 }}>
                    <Text style={{ fontFamily: typography.fontFamily, fontSize: 11, fontWeight: '700', color: colors.error }}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}
                  activeOpacity={0.85}
                  onPress={() => fileInputRef.current?.click()}
                >
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' } as any}
        onChange={(e: any) => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 20 * 1024 * 1024) return setUploadError('El archivo supera el límite de 20MB. Elegí una imagen más pequeña.');
          setTempFile(f);
        }} />
    </Card>
  );
};

const styles = StyleSheet.create({
  heroInner: { flexDirection: 'row', alignItems: 'center', flex: 1,
               paddingHorizontal: spacing.xl, paddingVertical: spacing.xl,
               gap: spacing.lg } as any,
  heroLeft:  { flex: 1, gap: spacing.xs, alignItems: 'flex-start' } as any,
  heroLabel: { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs,
               color: colors.surface, opacity: 0.7,
               fontWeight: typography.weights.bold, letterSpacing: 2 } as any,
  heroTitle: { fontFamily: typography.fontFamily, fontSize: 24,
               color: colors.surface, fontWeight: typography.weights.bold } as any,
  heroSub:   { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm,
               color: colors.surface, opacity: 0.85, marginBottom: spacing.xs } as any,
  heroBgImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  heroBgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
});
