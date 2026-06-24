import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../useAuth';
import { colors } from '../../../../shared/constants/colors';
import { spacing } from '../../../../shared/constants/spacing';
import { typography } from '../../../../shared/constants/typography';
import { ErrorMessage } from '../../../../shared/components/ErrorMessage';
import { TextField } from '../../../../shared/components/TextField';
import { Button } from '../../../../shared/components/Button';

const LOGO2 = require('../../../../acced/logoLogin.png');

export const LoginMobileScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login, error, clearError } = useAuth();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await login(username, password);
    } catch (_) {
      // Error manejado en contexto
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image source={LOGO2} style={styles.logo} resizeMode="contain" />
          <Text style={styles.logoTagline}>
            Plataforma de gobernanza institucional
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.title}>Bienvenido</Text>
          <Text style={styles.subtitle}>
            Accede a la plataforma de seguimiento, auditoría y control de proyectos institucionales.
          </Text>

          {!!error && <ErrorMessage message={error} />}

          <TextField
            label="Usuario / Cédula"
            value={username}
            onChangeText={(t) => { setUsername(t); if (error) clearError(); }}
            placeholder="Ingresa tu cédula o usuario"
            iconName="person-outline"
            autoCapitalize="none"
          />

          <TextField
            label="Contraseña"
            value={password}
            onChangeText={(t) => { setPassword(t); if (error) clearError(); }}
            placeholder="••••••••••"
            iconName="lock-closed-outline"
            secureTextEntry
          />

          <Button
            label="Ingresar"
            loading={loading}
            disabled={loading || !username.trim() || !password.trim()}
            onPress={handleLogin}
            style={styles.loginBtn}
          />

          <View style={styles.forgotBtn}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Plataforma de uso interno • CORPOACIIC</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: spacing.lg,
  },
  logo: {
    width: 160,
    height: 100,
  },
  logoTagline: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: spacing.xs,
    fontWeight: typography.weights.medium,
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
  title: {
    fontFamily: typography.fontFamily,
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  error: {
    marginBottom: spacing.md,
  },
  loginBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    height: 48,
    marginTop: spacing.md,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  forgotBtn: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  forgotText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: '#a78bfa',
    fontWeight: typography.weights.medium,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: 10,
  },
  footerText: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: '#475569',
  },
});
