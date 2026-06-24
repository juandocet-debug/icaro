import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, Image, ActivityIndicator, KeyboardAvoidingView, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button }         from '../../../../shared/components/Button';
import { ErrorMessage } from '../../../../shared/components/ErrorMessage';
import { colors }       from '../../../../shared/constants/colors';
import { spacing }      from '../../../../shared/constants/spacing';
import { typography }   from '../../../../shared/constants/typography';
import { useAuth }      from '../useAuth';
import { ProfilePhoto } from '../../domain/ProfilePhoto';

export const PrimerIngresoMobileScreen: React.FC = () => {
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
        if (f.size > 5 * 1024 * 1024) {
          setError('La foto supera el límite de 5MB.');
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
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
                <Ionicons name="camera" size={14} color={colors.surface} />
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
            placeholderTextColor="#64748b"
            value={clave} onChangeText={setClave} secureTextEntry />
          <TextInput style={styles.input} placeholder="Confirmar contraseña *"
            placeholderTextColor="#64748b"
            value={confirmar} onChangeText={setConfirmar} secureTextEntry />

          <Button label="Guardar y continuar" onPress={handleGuardar}
            loading={saving} style={styles.btn} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  formCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.xl,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  titulo: {
    fontFamily: typography.fontFamily,
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  fotoBox: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden' as any,
  },
  avatarLetra: {
    fontFamily: typography.fontFamily,
    fontSize: 32,
    fontWeight: typography.weights.bold,
    color: colors.surface,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fotoHint: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: '#94a3b8',
    marginTop: spacing.xs,
  },
  error: {
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: '#ffffff',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    marginBottom: spacing.sm,
    height: 48,
  },
  btn: {
    marginTop: spacing.md,
    backgroundColor: '#7c3aed',
    height: 48,
    borderRadius: 12,
  },
});
