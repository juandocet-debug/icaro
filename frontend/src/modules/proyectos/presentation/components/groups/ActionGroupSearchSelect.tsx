import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Pressable, Platform } from 'react-native';
import { useGroupSearch } from '../../hooks/useGroupSearch';
import { ActionGroup } from '../../hooks/useActionGroups';

interface ActionGroupSearchSelectProps {
  accionId: string;
  selectedGrupoId: string | null;
  onSelectGrupo: (grupo: ActionGroup | null) => void;
  error?: string | null;
}

export function ActionGroupSearchSelect({ accionId, selectedGrupoId, onSelectGrupo, error }: ActionGroupSearchSelectProps) {
  const { options, loading, page, hasMore, searchGroups, setOptions } = useGroupSearch(accionId);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<ActionGroup | null>(null);
  const debounceRef = useRef<any>(null);

  // Load selected group details or initial list
  useEffect(() => {
    if (accionId) {
      searchGroups('', 1);
    } else {
      setOptions([]);
    }
  }, [accionId, searchGroups, setOptions]);

  // Sync selectedGrupo when options or selectedGrupoId changes
  useEffect(() => {
    if (selectedGrupoId) {
      const found = options.find(o => o.id === selectedGrupoId);
      if (found) {
        setSelectedGrupo(found);
      }
    } else {
      setSelectedGrupo(null);
    }
  }, [selectedGrupoId, options]);

  const handleSearchChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchGroups(text, 1);
    }, 300);
  };

  const handleSelect = (grupo: ActionGroup) => {
    setSelectedGrupo(grupo);
    onSelectGrupo(grupo);
    setQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedGrupo(null);
    onSelectGrupo(null);
    setQuery('');
    searchGroups('', 1);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      searchGroups(query, page + 1, true);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Grupo / Cohorte <Text style={styles.required}>*</Text>
      </Text>

      {selectedGrupo ? (
        <View style={styles.selectedContainer}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedText}>{selectedGrupo.nombre}</Text>
            {selectedGrupo.codigo && (
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{selectedGrupo.codigo}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.selectWrapper}>
          <Pressable style={[styles.selectInput, error ? styles.inputError : null]} onPress={() => setIsOpen(!isOpen)}>
            <Text style={styles.selectInputPlaceholder}>
              Seleccionar grupo...
            </Text>
            <Text style={styles.arrowIcon}>▼</Text>
          </Pressable>

          {isOpen && (
            <View style={styles.dropdown}>
              <TextInput
                style={styles.searchBar}
                placeholder="Buscar grupo por nombre o código..."
                placeholderTextColor="#9ca3af"
                value={query}
                onChangeText={handleSearchChange}
                autoFocus
              />

              {loading && options.length === 0 ? (
                <View style={styles.loader}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                </View>
              ) : (
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.id}
                  nestedScrollEnabled
                  style={styles.list}
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.3}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No se encontraron grupos activos.</Text>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.optionRow} onPress={() => handleSelect(item)}>
                      <Text style={styles.optionName}>{item.nombre}</Text>
                      {item.codigo && (
                        <View style={styles.codeBadge}>
                          <Text style={styles.codeText}>{item.codigo}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  ListFooterComponent={
                    loading && hasMore ? (
                      <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 8 }} />
                    ) : null
                  }
                />
              )}
            </View>
          )}
        </View>
      )}

      {error && <Text style={styles.errorHelperText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 100,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  selectWrapper: {
    position: 'relative',
    zIndex: 101,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  selectInputPlaceholder: {
    color: '#9ca3af',
    fontSize: 14,
  },
  arrowIcon: {
    fontSize: 12,
    color: '#6b7280',
  },
  selectedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#eff6ff',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '700',
  },
  dropdown: {
    position: Platform.OS === 'web' ? 'absolute' : 'relative',
    top: Platform.OS === 'web' ? 44 : 4,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 105,
  },
  searchBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  list: {
    maxHeight: 150,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionName: {
    fontSize: 14,
    color: '#374151',
  },
  codeBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0369a1',
  },
  loader: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    padding: 16,
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  errorHelperText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
