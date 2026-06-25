import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, Platform, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../../../shared/components/Button';
import { ErrorMessage } from '../../../../shared/components/ErrorMessage';
import { TextField } from '../../../../shared/components/TextField';
import { colors } from '../../../../shared/constants/colors';
import { spacing } from '../../../../shared/constants/spacing';
import { typography } from '../../../../shared/constants/typography';
import { useAuth } from '../../../auth/presentation/useAuth';
import { ProfilePhoto } from '../../../auth/domain/ProfilePhoto';
import { UserProfile } from '../../../auth/domain/UserProfile';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<Props> = ({ visible, onClose }) => {
  const { userProfile, actualizarFotoPerfil, actualizarPerfil } = useAuth();
  const fileInputRef = useRef<any>(null);

  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargo, setCargo] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingPic, setLoadingPic] = useState(false);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize fields on visible
  useEffect(() => {
    if (visible && userProfile) {
      setPrimerNombre(userProfile.primerNombre ?? '');
      setSegundoNombre(userProfile.segundoNombre ?? '');
      setPrimerApellido(userProfile.primerApellido ?? '');
      setSegundoApellido(userProfile.segundoApellido ?? '');
      setTelefono(userProfile.telefono ?? '');
      setCargo(userProfile.cargo ?? '');
      setError(null);
      setSuccess(false);
      setPreviewUrl(null); // limpia preview al abrir
    }
  }, [visible, userProfile]);

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
        // Mostrar preview inmediatamente
        const localUrl = URL.createObjectURL(f);
        setPreviewUrl(localUrl);
        const foto: ProfilePhoto = {
          uri: localUrl,
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
    if (!primerNombre.trim()) {
      setError('El primer nombre es obligatorio.');
      return;
    }
    if (!primerApellido.trim()) {
      setError('El primer apellido es obligatorio.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await actualizarPerfil({
        primerNombre: primerNombre.trim(),
        segundoNombre: segundoNombre.trim() || null,
        primerApellido: primerApellido.trim(),
        segundoApellido: segundoApellido.trim() || null,
        telefono: telefono.trim() || null,
        cargo: cargo.trim() || null,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Error al actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const avatarInitial = (userProfile?.username ?? 'U').charAt(0).toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.center}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.titulo}>Editar Perfil</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Foto de Perfil */}
            <View style={styles.avatarSection}>
              <TouchableOpacity activeOpacity={0.8} onPress={Platform.OS === 'web' ? triggerFileSelect : () => handleSubirFoto()} style={styles.avatarWrapper}>
                {loadingPic ? (
                  <View style={styles.loadingPicContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : (previewUrl || userProfile?.photoUrl) ? (
                  <Image
                    key={previewUrl || userProfile?.photoUrl}
                    source={{ uri: (previewUrl || userProfile?.photoUrl)! }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitialText}>{avatarInitial}</Text>
                  </View>
                )}
                <View style={styles.cameraIconContainer}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              {Platform.OS === 'web' && (
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleSubirFoto}
                />
              )}
              <Text style={styles.avatarLabel}>Cambiar foto de perfil</Text>
            </View>

            {!!error && <ErrorMessage message={error} />}
            {success && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.successText}>Perfil actualizado correctamente.</Text>
              </View>
            )}

            {/* Campos de texto */}
            <View style={styles.formGrid}>
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <TextField label="Primer Nombre *" value={primerNombre} onChangeText={setPrimerNombre} placeholder="Primer nombre" />
                </View>
                <View style={styles.formCol}>
                  <TextField label="Segundo Nombre" value={segundoNombre} onChangeText={setSegundoNombre} placeholder="Opcional" />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <TextField label="Primer Apellido *" value={primerApellido} onChangeText={setPrimerApellido} placeholder="Primer apellido" />
                </View>
                <View style={styles.formCol}>
                  <TextField label="Segundo Apellido" value={segundoApellido} onChangeText={setSegundoApellido} placeholder="Opcional" />
                </View>
              </View>

              <TextField label="Cargo" value={cargo} onChangeText={setCargo} placeholder="Cargo en la empresa" />
              <TextField label="Teléfono" value={telefono} onChangeText={setTelefono} placeholder="Número de contacto" keyboardType="phone-pad" />

              {/* Campos Bloqueados de Solo Lectura */}
              <View style={styles.readOnlyContainer}>
                <Text style={styles.readOnlyLabel}>Cédula (No modificable)</Text>
                <View style={styles.readOnlyBox}>
                  <Text style={styles.readOnlyText}>{userProfile?.cedula ?? userProfile?.username ?? '—'}</Text>
                </View>
              </View>

              <View style={styles.readOnlyContainer}>
                <Text style={styles.readOnlyLabel}>Correo Electrónico (No modificable)</Text>
                <View style={styles.readOnlyBox}>
                  <Text style={styles.readOnlyText}>{userProfile?.email ?? '—'}</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.actions}>
            <Button label="Cancelar" variant="ghost" onPress={onClose} disabled={saving} />
            <Button label="Guardar Cambios" onPress={handleGuardar} loading={saving} disabled={saving} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titulo: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: 'rgba(108,85,201,0.1)',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialText: {
    fontFamily: typography.fontFamily,
    fontSize: 28,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 2,
    alignItems: 'center',
  },
  loadingPicContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  successText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.success,
    fontWeight: typography.weights.medium,
  },
  formGrid: {
    gap: spacing.sm,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  formCol: {
    flex: 1,
  },
  readOnlyContainer: {
    marginBottom: spacing.xs,
  },
  readOnlyLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  readOnlyBox: {
    backgroundColor: colors.border,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  readOnlyText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  } as any,
});
