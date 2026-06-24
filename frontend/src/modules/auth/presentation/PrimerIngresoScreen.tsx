import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Card }         from '../../../shared/components/Card';
import { Button }       from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors }       from '../../../shared/constants/colors';
import { spacing }      from '../../../shared/constants/spacing';
import { typography }   from '../../../shared/constants/typography';
import { useAuth }      from './useAuth';
import { ProfilePhoto } from '../domain/ProfilePhoto';

export const PrimerIngresoScreen: React.FC = () => {
  const { userProfile, completarPrimerIngreso, actualizarFotoPerfil } = useAuth();
  const [clave,     setClave]     = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error,     setError]     = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [loadingPic, setLoadingPic] = useState(false);
  const fileRef = useRef<any>(null);

  const handleSubirFoto = async (e?: any) => {
    setError(null);
    setLoadingPic(true);
    try {
      if (Platform.OS === 'web') {
        const f = e?.target?.files?.[0];
        if (!f) return;
        if (f.size > 20 * 1024 * 1024) {
          setError('La foto supera el límite de 20MB.');
          return;
        }
        const foto: ProfilePhoto = {
          uri: URL.createObjectURL(f),
          name: f.name,
          mimeType: f.type as any,
        };
        await actualizarFotoPerfil(foto);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setError('Permiso denegado para acceder a la galería.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]) {
          const asset = result.assets[0];
          const filename = asset.fileName || 'profile.jpg';
          const mime = (asset.mimeType || 'image/jpeg') as any;

          const foto: ProfilePhoto = {
            uri: asset.uri,
            name: filename,
            mimeType: mime,
          };
          await actualizarFotoPerfil(foto);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'No se pudo subir la foto de perfil.');
    } finally {
      setLoadingPic(false);
    }
  };

  const handleGuardar = async () => {
    setError(null);
    if (!clave || clave.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.'); return;
    }
    if (clave !== confirmar) {
      setError('Las contraseñas no coinciden.'); return;
    }
    setSaving(true);
    try {
      await completarPrimerIngreso(clave);
      router.replace('/');
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? 'Error al actualizar la contraseña.');
    } finally {
      setSaving(false);
    }
  };

  const inicial = (userProfile?.username ?? 'U').charAt(0).toUpperCase();

  return (
    <View style={styles.root}>
      <Card padding="lg" style={styles.card}>
        <Text style={styles.titulo}>Bienvenido a Ícaro</Text>
        <Text style={styles.subtitulo}>
          Configure su cuenta para continuar. Debe establecer su contraseña de acceso.
        </Text>

        <View style={styles.fotoBox}>
          <TouchableOpacity style={styles.avatarCircle} disabled={loadingPic}
            onPress={() => {
              if (Platform.OS === 'web') {
                fileRef.current?.click();
              } else {
                handleSubirFoto();
              }
            }}>
            {loadingPic ? (
              <ActivityIndicator color={colors.surface} />
            ) : userProfile?.photoUrl ? (
              <View style={styles.avatarImg}>
                {Platform.OS === 'web' ? (
                  /* eslint-disable-next-line */
                  <img src={userProfile.photoUrl} style={{ width: '100%', height: '100%',
                    borderRadius: '50%', objectFit: 'cover' } as any} />
                ) : (
                  <Image source={{ uri: userProfile.photoUrl }} style={{ width: '100%', height: '100%', borderRadius: 44 }} />
                )}
              </View>
            ) : (
              <Text style={styles.avatarLetra}>{inicial}</Text>
            )}
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={16} color={colors.surface} />
            </View>
          </TouchableOpacity>
          <Text style={styles.fotoHint}>Toca para subir tu foto (opcional)</Text>
          {Platform.OS === 'web' && (
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' } as any} onChange={handleSubirFoto} />
          )}
        </View>

        {!!error && <ErrorMessage message={error} />}

        <TextInput style={styles.input} placeholder="Nueva contraseña *"
          placeholderTextColor={colors.textSecondary}
          value={clave} onChangeText={setClave} secureTextEntry />
        <TextInput style={styles.input} placeholder="Confirmar contraseña *"
          placeholderTextColor={colors.textSecondary}
          value={confirmar} onChangeText={setConfirmar} secureTextEntry />

        <Button label="Guardar y continuar" onPress={handleGuardar}
          loading={saving} style={styles.btn} />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.darkBg,
                  alignItems: 'center', justifyContent: 'center' },
  card:         { width: 440, maxWidth: '90%' as any },
  titulo:       { fontFamily: typography.fontFamily, fontSize: typography.sizes.xl,
                  fontWeight: typography.weights.bold, color: colors.textPrimary,
                  marginBottom: spacing.xs },
  subtitulo:    { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm,
                  color: colors.textSecondary, marginBottom: spacing.lg },
  fotoBox:      { alignItems: 'center', marginBottom: spacing.lg },
  avatarCircle: { width: 88, height: 88, borderRadius: 44,
                  backgroundColor: colors.primary,
                  alignItems: 'center', justifyContent: 'center',
                  position: 'relative' },
  avatarImg:    { width: 88, height: 88, borderRadius: 44, overflow: 'hidden' as any },
  avatarLetra:  { fontFamily: typography.fontFamily, fontSize: 32,
                  fontWeight: typography.weights.bold, color: colors.surface },
  cameraOverlay:{ position: 'absolute', bottom: 0, right: 0,
                  backgroundColor: colors.primaryDark, borderRadius: 12,
                  width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  fotoHint:     { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs,
                  color: colors.textSecondary, marginTop: spacing.xs },
  input:        { borderWidth: 1, borderColor: colors.border, borderRadius: 8,
                  paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
                  fontFamily: typography.fontFamily, fontSize: typography.sizes.sm,
                  color: colors.textPrimary, backgroundColor: colors.surface,
                  marginBottom: spacing.sm },
  btn:          { marginTop: spacing.md },
});
