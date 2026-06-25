import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { useAccess } from '../../modules/auth/presentation/useAccess';
import { ProfileEditModal } from '../../modules/home/presentation/components/ProfileEditModal';

export const MobileBottomTabs: React.FC = () => {
  const pathname = usePathname();
  const { accessProfile } = useAccess();
  const isSuperAdmin = accessProfile?.esSuperadministrador === true;
  const [showProfileModal, setShowProfileModal] = useState(false);

  const baseNavs = [
    { label: 'Inicio',       icon: 'home-outline',          iconActive: 'home',          route: '/' },
    { label: 'Proyectos',    icon: 'folder-open-outline',   iconActive: 'folder-open',   route: '/proyectos' },
    { label: 'Actividades',  icon: 'clipboard-outline',     iconActive: 'clipboard',     route: '/mis-actividades' },
    // "Perfil" se maneja abriendo modal directamente (no routing), para evitar que
    // el guard de _layout.tsx redirija a /proyectos antes de que abra el modal.
    { label: 'Perfil',       icon: 'person-outline',        iconActive: 'person',        route: null, isProfile: true },
  ];

  // Superadmin: inserta Seguridad antes de Perfil
  // Usuario regular: inserta el botón Agregar especial en el centro
  const navs = isSuperAdmin
    ? [
        baseNavs[0],
        baseNavs[1],
        { label: 'Seguridad', icon: 'shield-outline', iconActive: 'shield', route: '/seguridad' },
        baseNavs[2],
        baseNavs[3],
      ]
    : [
        baseNavs[0],
        baseNavs[1],
        { label: 'Agregar', icon: 'add-circle', iconActive: 'add-circle', route: '/proyectos', isSpecial: true },
        baseNavs[2],
        baseNavs[3],
      ];

  return (
    <>
      <ProfileEditModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
      <View style={styles.container}>
        {navs.map((n) => {
          const nav = n as any;

          // Tab de Perfil: abre modal directamente sin navegar
          if (nav.isProfile) {
            return (
              <TouchableOpacity
                key={n.label}
                style={styles.tab}
                onPress={() => setShowProfileModal(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={(showProfileModal ? n.iconActive : n.icon) as any}
                  size={20}
                  color={showProfileModal ? '#7c3aed' : '#64748b'}
                />
                <Text style={[styles.label, showProfileModal && styles.labelActive]}>{n.label}</Text>
              </TouchableOpacity>
            );
          }

          const isActive =
            pathname === nav.route ||
            (nav.route !== '/' && nav.route && pathname.startsWith(nav.route));

          if (nav.isSpecial) {
            return (
              <TouchableOpacity
                key={n.label}
                style={styles.specialBtn}
                onPress={() => router.push(nav.route as any)}
                activeOpacity={0.8}
              >
                <View style={styles.specialCircle}>
                  <Ionicons name="add" size={28} color="#fff" />
                </View>
                <Text style={styles.specialLabel}>{n.label}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={n.label}
              style={styles.tab}
              onPress={() => router.push(nav.route as any)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={(isActive ? n.iconActive : n.icon) as any}
                size={20}
                color={isActive ? '#7c3aed' : '#64748b'}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>{n.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 8,
  } as any,
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    fontWeight: typography.weights.medium,
  },
  labelActive: {
    color: '#7c3aed',
    fontWeight: '700',
  },
  specialBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: -24,
  },
  specialCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  specialLabel: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    fontWeight: typography.weights.medium,
  },
});
