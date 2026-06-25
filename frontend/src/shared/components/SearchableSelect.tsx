import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';
import { UserAvatar } from './UserAvatar';

export interface SelectOption {
  id: string;
  name: string;
  description?: string;
  category?: string; // e.g. 'ROLES DEL SISTEMA' | 'ROLES PERSONALIZADOS'
  badgeText?: string; // e.g. 'Sistema' | 'Personalizado'
  photoUrl?: string | null;
}

interface SearchableSelectProps {
  options: SelectOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Buscar o seleccionar...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const selectedOption = options.find((o) => o.id === selectedValue);

  // Filtrado de opciones
  const filteredOptions = options.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.description && o.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Reset indices on change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [search, isOpen]);

  const handleKeyPress = (e: any) => {
    const key = e.nativeEvent.key;
    if (key === 'ArrowDown') {
      e.preventDefault?.();
      setFocusedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (key === 'ArrowUp') {
      e.preventDefault?.();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (key === 'Enter') {
      e.preventDefault?.();
      if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        onSelect(filteredOptions[focusedIndex].id);
        setIsOpen(false);
        setSearch('');
      }
    } else if (key === 'Escape') {
      e.preventDefault?.();
      setIsOpen(false);
    }
  };

  // Agrupamiento por categoría
  const grouped = filteredOptions.reduce((acc, curr) => {
    const cat = curr.category || 'OPCIONES';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(curr);
    return acc;
  }, {} as Record<string, SelectOption[]>);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {selectedOption && selectedOption.photoUrl !== undefined && (
            <UserAvatar
              name={selectedOption.name}
              photoUrl={selectedOption.photoUrl}
              size={20}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={[styles.triggerText, !selectedOption && styles.placeholder]} numberOfLines={1}>
            {selectedOption ? selectedOption.name : placeholder}
          </Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdown}>
          <View style={styles.searchBox}>
            <View style={styles.searchIconWrapper}>
              <Ionicons name="search-outline" size={13} color={colors.primary} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              onKeyPress={handleKeyPress}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView style={styles.optionsScroll} nestedScrollEnabled>
            {Object.entries(grouped).map(([category, items]) => (
              <View key={category} style={styles.categoryGroup}>
                <Text style={styles.categoryTitle}>{category}</Text>
                {items.map((opt) => {
                  const flatIndex = filteredOptions.findIndex((f) => f.id === opt.id);
                  const isFocused = flatIndex === focusedIndex;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.optionRow,
                        selectedValue === opt.id && styles.optionRowActive,
                        isFocused && styles.optionRowFocused,
                      ]}
                      onPress={() => {
                        onSelect(opt.id);
                        setIsOpen(false);
                        setSearch('');
                      }}
                    >
                      <View style={styles.optionInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {opt.photoUrl !== undefined && (
                            <UserAvatar
                              name={opt.name}
                              photoUrl={opt.photoUrl}
                              size={24}
                              style={{ marginRight: 8 }}
                            />
                          )}
                          <Text style={[styles.optionName, selectedValue === opt.id && styles.optionNameActive]}>
                            {opt.name}
                          </Text>
                        </View>
                        {!!opt.description && (
                          <Text style={styles.optionDesc} numberOfLines={2}>
                            {opt.description}
                          </Text>
                        )}
                      </View>
                      {!!opt.badgeText && (
                        <View style={[styles.badge, opt.badgeText === 'Sistema' ? styles.badgeSys : styles.badgeCust]}>
                          <Text style={styles.badgeText}>{opt.badgeText}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            {filteredOptions.length === 0 && (
              <Text style={styles.vacio}>No se encontraron opciones.</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    zIndex: 99,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    height: 38,
    backgroundColor: colors.surface,
  },
  triggerText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  dropdown: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 250,
    zIndex: 999,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' } as any
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 5,
        }),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: 'rgba(108,85,201,0.04)',
    gap: 6,
  } as any,
  searchIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(108,85,201,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    padding: 2,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    outlineStyle: 'none',
  } as any,
  optionsScroll: {
    maxHeight: 200,
  },
  categoryGroup: {
    paddingVertical: 4,
  },
  categoryTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(108,85,201,0.03)',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  optionRowActive: {
    backgroundColor: 'rgba(108,85,201,0.06)',
  },
  optionRowFocused: {
    backgroundColor: 'rgba(108,85,201,0.12)',
  },
  optionInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  optionName: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  optionNameActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  optionDesc: {
    fontFamily: typography.fontFamily,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeSys: {
    backgroundColor: 'rgba(108,85,201,0.1)',
  },
  badgeCust: {
    backgroundColor: 'rgba(40,167,111,0.1)',
  },
  badgeText: {
    fontFamily: typography.fontFamily,
    fontSize: 9,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  vacio: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    padding: spacing.md,
    textAlign: 'center',
  },
});
