import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform, Image, ImageBackground } from 'react-native';
import { useAuth } from './useAuth';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { TextField } from '../../../shared/components/TextField';
import { Button } from '../../../shared/components/Button';

// Assets de marca
const LOGO2  = require('../../../acced/logoLogin.png');
const FONDO  = require('../../../acced/logo2.png');

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { login, error, clearError } = useAuth();
  const { width } = useWindowDimensions();
  const isSplit = width >= 820;

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await login(username, password);
    } catch (_) { /* error manejado por contexto */ }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.root}>
      {/* Estilo para evitar el autofill amarillo de Chrome en Web */}
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{__html: `
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active  {
            -webkit-box-shadow: 0 0 0 100px ${colors.darkSurface} inset !important;
            -webkit-text-fill-color: ${colors.darkText} !important;
            transition: background-color 5000s ease-in-out 0s;
          }
        `}} />
      )}

      {/* ── Panel izquierdo: imagen de fondo real ── */}
      {isSplit && (
        <ImageBackground
          source={FONDO}
          style={styles.leftPanel}
          imageStyle={styles.leftBgImage}
          resizeMode="cover"
        >
          {/* Logo ÁGORA arriba */}
          <View style={styles.logoRow}>
            <Image
              source={LOGO2}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.logoDivider} />
            <Text style={styles.logoTagline}>
              Plataforma de gobernanza{'\n'}institucional
            </Text>
          </View>

          {/* Feature abajo */}
          <View style={styles.featureRow}>
            <Text style={styles.featureText}>
              Herramientas que fortalecen la gestión, promueven la transparencia y generan valor público.
            </Text>
          </View>
        </ImageBackground>
      )}

      {/* ── Panel derecho: formulario ── */}
      <View style={isSplit ? styles.rightPanel : styles.rightPanelFull}>

        {/* Logo en móvil */}
        {!isSplit && (
          <View style={styles.mobileLogoRow}>
            <Image source={LOGO2} style={styles.logoMobile} resizeMode="contain" />
          </View>
        )}

        <View style={styles.formBox}>
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
            darkMode
          />

          <TextField
            label="Contraseña"
            value={password}
            onChangeText={(t) => { setPassword(t); if (error) clearError(); }}
            placeholder="••••••••••"
            iconName="lock-closed-outline"
            secureTextEntry
            darkMode
          />

          {/* Botón Ingresar */}
          <Button
            label="Ingresar"
            loading={loading}
            disabled={loading}
            onPress={handleLogin}
            style={styles.loginBtn}
          />

          <View style={styles.forgotBtn}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Plataforma de uso interno  •  CORPOACIIC</Text>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.darkBg,
    minHeight: '100%' as any,
  },

  /* ── Panel izquierdo ── */
  leftPanel: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 40,
    backgroundColor: colors.darkBg,
  },
  leftBgImage: {
    position: 'absolute',
    top: 0,
    left: '-20%',
    width: '140%',
    height: '100%',
  },

  /* Logo row */
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    width: 180,
    height: 120,
  },
  logoDivider: {
    width: 1,
    height: 56,
    backgroundColor: colors.darkBorder,
    marginHorizontal: 24,
  },
  logoTagline: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.darkTextSub,
    lineHeight: 20,
    fontWeight: '500',
  },

  /* Feature */
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 400,
    zIndex: 10,
    backgroundColor: colors.darkSurface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.darkBorder,
  },
  featureText: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.darkTextSub,
    lineHeight: 19,
    flex: 1,
  },

  /* ── Panel derecho ── */
  rightPanel: {
    flex: 1,
    backgroundColor: colors.darkBg,
    justifyContent: 'space-between',
    paddingHorizontal: 60,
    paddingVertical: 48,
  },
  rightPanelFull: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.darkBg,
    justifyContent: 'space-between',
    paddingVertical: 48,
  },

  /* Formulario */
  formBox: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 450,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: 40,
    fontWeight: '700',
    color: colors.darkText,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.darkTextSub,
    lineHeight: 24,
    marginBottom: 28,
  },

  /* Botón */
  loginBtn: {
    backgroundColor: colors.darkAccent,
    borderRadius: 30,
    height: 52,
    width: '100%',
    marginTop: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 6px 14px rgba(124,58,237,0.45)' } as any
      : {
          shadowColor: colors.darkAccent,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.45,
          shadowRadius: 14,
          elevation: 6,
        }
    ),
  },

  /* Forgot */
  forgotBtn: {
    alignSelf: 'center',
    marginTop: 20,
  },
  forgotText: {
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.darkLink,
    fontWeight: '500',
  },

  /* Footer */
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  footerText: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.darkTextMuted,
  },

  /* Móvil */
  mobileLogoRow: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
  },
  logoMobile: {
    width: 160,
    height: 107,
  },
});
