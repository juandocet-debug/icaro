import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { TipoDocumento } from '../domain/TipoDocumento';
import { tipoDocumentoRepo } from '../../../shared/dependencies';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';

interface Props { proyectoId: string; isAdmin: boolean; }

export const ProyectoTiposDocumento: React.FC<Props> = ({ proyectoId, isAdmin }) => {
  const isMobile = useIsMobile();
  const [tipos,       setTipos]       = useState<TipoDocumento[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [nombre,      setNombre]      = useState('');
  const [desc,        setDesc]        = useState('');
  const [formErr,     setFormErr]     = useState<string | null>(null);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editNombre,  setEditNombre]  = useState('');
  const [editDesc,    setEditDesc]    = useState('');

  const repo = tipoDocumentoRepo;

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      setTipos(await repo.listar(proyectoId));
    } catch {
      setError('No se pudieron cargar los documentos requeridos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [proyectoId]);

  const handleAgregar = async () => {
    if (!nombre.trim()) { setFormErr('El nombre es obligatorio.'); return; }
    setSaving(true);
    setFormErr(null);
    try {
      await repo.crear(proyectoId, { nombre: nombre.trim(),
        descripcion: desc || undefined, orden: tipos.length });
      setNombre(''); setDesc('');
      await cargar();
    } catch (e: any) {
      setFormErr(e.message || 'Error al agregar.');
    } finally { setSaving(false); }
  };

  const handleEditStart = (t: TipoDocumento) => {
    setEditingId(t.id);
    setEditNombre(t.nombre);
    setEditDesc(t.descripcion ?? '');
  };

  const handleEditSave = async () => {
    if (!editNombre.trim() || !editingId) return;
    try {
      await repo.actualizar(proyectoId, editingId, editNombre.trim(), editDesc || undefined);
      setEditingId(null);
      await cargar();
    } catch { setError('No se pudo actualizar el documento.'); }
  };

  const handleEliminar = async (tipoId: string) => {
    try {
      await repo.eliminar(proyectoId, tipoId);
      await cargar();
    } catch { setError('No se pudo eliminar el documento.'); }
  };

  return (
    <Card style={styles.card} padding="none">
      <Text style={styles.titulo}>Documentos Requeridos</Text>

      {/* Formulario agregar */}
      {isAdmin && (
        <View style={styles.formBox}>
          {!!formErr && <ErrorMessage message={formErr} />}
          <View style={styles.formRow}>
            <TextInput style={[styles.input, { flex: 1 }]}
              value={nombre} onChangeText={setNombre}
              placeholder="Nombre *" placeholderTextColor={colors.textSecondary} />
            <TextInput style={[styles.input, { flex: 1.5 }]}
              value={desc} onChangeText={setDesc}
              placeholder="Descripción" placeholderTextColor={colors.textSecondary} />
            <Button label="Agregar" onPress={handleAgregar}
              loading={saving} size="sm" style={styles.btnAgregar} />
          </View>
        </View>
      )}

      {!!error && <ErrorMessage message={error} />}

      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
      ) : (
        <>
          {/* Tabla */}
          {!isMobile && (
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 1 }]}>Nombre</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Descripción</Text>
              {isAdmin && <Text style={[styles.th, { width: 72 }]}>Acciones</Text>}
            </View>
          )}

          {tipos.length === 0 ? (
            <Text style={styles.vacio}>No hay documentos requeridos definidos.</Text>
          ) : (
            tipos.map((t, idx) => (
              <View key={t.id}
                style={[
                  styles.tableRow,
                  idx % 2 === 0 && styles.tableRowAlt,
                  isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 6 }
                ]}>
                {editingId === t.id ? (
                  <>
                    <TextInput style={[styles.td, styles.editInput, { flex: 1, width: '100%', marginBottom: 4 }]}
                      value={editNombre} onChangeText={setEditNombre} />
                    <TextInput style={[styles.td, styles.editInput, { flex: 1.5, width: '100%', marginBottom: 8 }]}
                      value={editDesc} onChangeText={setEditDesc} />
                    <View style={[styles.actions, isMobile && { width: '100%', justifyContent: 'flex-start', marginTop: 4 }]}>
                      <TouchableOpacity onPress={handleEditSave} style={styles.actionBtn}>
                        <Ionicons name="checkmark" size={16} color={colors.success} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditingId(null)} style={styles.actionBtn}>
                        <Ionicons name="close" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={isMobile && { width: '100%' }}>
                      <Text style={[styles.td, { flex: 1, fontWeight: isMobile ? '700' : '400', fontSize: isMobile ? 14 : 13 }]} numberOfLines={2}>{t.nombre}</Text>
                      <Text style={[styles.td, styles.tdSecondary, { flex: 1.5, marginTop: isMobile ? 2 : 0 }]} numberOfLines={2}>
                        {t.descripcion ?? '—'}
                      </Text>
                    </View>
                    {isAdmin && (
                      <View style={[styles.actions, isMobile && { width: '100%', justifyContent: 'flex-start', marginTop: 6 }]}>
                        <TouchableOpacity onPress={() => handleEditStart(t)} style={styles.actionBtn}>
                          <Ionicons name="pencil-outline" size={15} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleEliminar(t.id)} style={styles.actionBtn}>
                          <Ionicons name="trash-outline" size={15} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </View>
            ))
          )}
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card:         { marginTop: spacing.md },
  titulo:       { fontFamily: typography.fontFamily, fontSize: typography.sizes.md,
                  fontWeight: typography.weights.bold, color: colors.textPrimary,
                  marginBottom: spacing.md, paddingTop: spacing.lg, paddingHorizontal: spacing.lg },
  tableHeader:  { flexDirection: 'row', paddingVertical: spacing.xs,
                  borderBottomWidth: 2, borderBottomColor: colors.border,
                  width: '100%' as any, paddingHorizontal: spacing.lg },
  th:           { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs,
                  fontWeight: typography.weights.bold, color: colors.textSecondary,
                  textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow:     { flexDirection: 'row', alignItems: 'center',
                  paddingVertical: spacing.sm, borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  width: '100%' as any, paddingHorizontal: spacing.lg },
  tableRowAlt:  { backgroundColor: 'rgba(108,85,201,0.03)' },
  td:           { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm,
                  color: colors.textPrimary, paddingRight: spacing.sm },
  tdSecondary:  { color: colors.textSecondary },
  editInput:    { borderWidth: 1, borderColor: colors.primary, borderRadius: 6,
                  paddingHorizontal: spacing.sm, paddingVertical: 4,
                  fontFamily: typography.fontFamily, fontSize: typography.sizes.sm,
                  color: colors.textPrimary, backgroundColor: colors.surface,
                  marginRight: spacing.sm },
  actions:      { width: 72, flexDirection: 'row', justifyContent: 'flex-end' },
  actionBtn:    { padding: spacing.xs, marginLeft: 2 },
  vacio:        { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm,
                  color: colors.textSecondary, fontStyle: 'italic', paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.lg },
  formBox:      { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  formRow:      { flexDirection: 'row', alignItems: 'center', gap: spacing.sm } as any,
  input:        { borderWidth: 1, borderColor: colors.border, borderRadius: 8,
                  paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
                  fontFamily: typography.fontFamily, fontSize: typography.sizes.sm,
                  color: colors.textPrimary, backgroundColor: colors.surface },
  btnAgregar:   { flexShrink: 0 },
});
