import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Modal, ScrollView, Platform, Switch,
} from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { Ionicons } from '@expo/vector-icons';
import { UsuarioEntity } from '../domain/UsuariosRepositoryPort';

interface EditarUsuarioModalProps {
  visible: boolean;
  onClose: () => void;
  usuario: UsuarioEntity | null;
  onSave: (datos: any) => Promise<void>;
}

export const EditarUsuarioModal: React.FC<EditarUsuarioModalProps> = ({
  visible, onClose, usuario, onSave
}) => {
  const [cedula, setCedula] = useState('');
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (usuario) {
      setCedula(usuario.username || '');
      setPrimerNombre(usuario.primerNombre || '');
      setSegundoNombre(usuario.segundoNombre || '');
      setPrimerApellido(usuario.primerApellido || '');
      setSegundoApellido(usuario.segundoApellido || '');
      setEmail(usuario.email || '');
      setTelefono(usuario.telefono || '');
      setPassword('');
      setIsActive(usuario.isActive);
      setError(null);
    }
  }, [usuario, visible]);

  const handleSave = async () => {
    if (!cedula.trim() || !primerNombre.trim() || !primerApellido.trim() || !email.trim()) {
      setError('Cédula, primer nombre, primer apellido y correo son obligatorios.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const datos: any = {
        username: cedula.trim(),
        primer_nombre: primerNombre.trim(),
        segundo_nombre: segundoNombre.trim() || '',
        primer_apellido: primerApellido.trim(),
        segundo_apellido: segundoApellido.trim() || '',
        email: email.trim(),
        telefono: telefono.trim() || '',
        is_active: isActive,
      };
      if (password.trim()) {
        datos.password = password.trim();
      }
      await onSave(datos);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e?.message ?? 'Error al actualizar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Card padding="lg" style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.formTitulo}>Editar Usuario</Text>
            <TouchableOpacity
              onPress={onClose}
              style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {!!error && <ErrorMessage message={error} />}

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
            {/* IDENTIFICACIÓN */}
            <Text style={styles.sectionLabel}>IDENTIFICACIÓN</Text>
            <View style={styles.formRow}>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Cédula / Usuario <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 12345678"
                  placeholderTextColor={colors.textSecondary}
                  value={cedula}
                  onChangeText={setCedula}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* NOMBRES */}
            <Text style={styles.sectionLabel}>NOMBRES</Text>
            <View style={styles.formRow}>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Primer nombre <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Primer nombre"
                  placeholderTextColor={colors.textSecondary}
                  value={primerNombre}
                  onChangeText={setPrimerNombre}
                />
              </View>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Segundo nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Segundo nombre"
                  placeholderTextColor={colors.textSecondary}
                  value={segundoNombre}
                  onChangeText={setSegundoNombre}
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Primer apellido <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="Primer apellido"
                  placeholderTextColor={colors.textSecondary}
                  value={primerApellido}
                  onChangeText={setPrimerApellido}
                />
              </View>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Segundo apellido</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Segundo apellido"
                  placeholderTextColor={colors.textSecondary}
                  value={segundoApellido}
                  onChangeText={setSegundoApellido}
                />
              </View>
            </View>

            {/* CONTACTO */}
            <Text style={styles.sectionLabel}>CONTACTO</Text>
            <View style={styles.formRow}>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Correo electrónico <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Teléfono</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono"
                  placeholderTextColor={colors.textSecondary}
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* SEGURIDAD Y ESTADO */}
            <Text style={styles.sectionLabel}>SEGURIDAD Y ESTADO</Text>
            <View style={styles.formRow}>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Nueva contraseña (dejar vacío para mantener)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
              </View>
            </View>
            <View style={[styles.formRow, { alignItems: 'center', marginVertical: spacing.sm }] as any}>
              <Text style={[styles.fieldLabel, { flex: 1, marginBottom: 0 }]}>Usuario activo</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isActive ? colors.surface : colors.textSecondary}
              />
            </View>

          </ScrollView>

          <View style={styles.modalActions}>
            <Button label="Cancelar" variant="ghost" onPress={onClose} />
            <Button label="Guardar Cambios" onPress={handleSave} loading={loading} />
          </View>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: 580, maxWidth: '95%' as any },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  formTitulo: { fontFamily: typography.fontFamily, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary },
  sectionLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  } as any,
  formRow: { flexDirection: 'row', gap: spacing.sm } as any,
  fieldWrapper: { marginBottom: spacing.sm },
  fieldLabel: { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: 4, fontWeight: typography.weights.medium },
  required: { color: colors.error },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    height: 38,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md } as any,
});
