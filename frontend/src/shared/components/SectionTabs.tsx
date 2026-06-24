import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export interface TabItem {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SectionTabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

export const SectionTabs: React.FC<SectionTabsProps> = ({ items, activeId, onChange }) => {
  return (
    <View style={styles.tabBarWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBarScroll}
      >
        <View style={styles.tabsRow}>
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => onChange(item.id)}
                activeOpacity={0.8}
              >
                {!!item.icon && (
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={isActive ? colors.securityTabTextActive : colors.securityTabText}
                    style={styles.icon}
                  />
                )}
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    backgroundColor: colors.securityNavBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.securityNavBorder,
    height: 56,
    justifyContent: 'center',
    width: '100%',
  },
  tabBarScroll: {
    flexGrow: 0,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  } as any,
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.transparent,
  },
  tabButtonActive: {
    backgroundColor: colors.securityTabActive,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 6px rgba(0,0,0,0.06)' } as any
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }),
  },
  icon: {
    marginRight: 6,
  },
  tabText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.securityTabText,
    fontWeight: typography.weights.medium,
  },
  tabTextActive: {
    color: colors.securityTabTextActive,
    fontWeight: typography.weights.bold,
  },
});
