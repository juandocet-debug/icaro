import React, { useEffect, useState, useMemo } from 'react';
import { Alert, Platform, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { Meta } from '../domain/Meta';
import { eliminarMetaUseCase, listarMetasProyectoUseCase } from '../../../shared/dependencies';
import { CrearMetaModal } from './CrearMetaModal';
import { EditarMetaModal } from './EditarMetaModal';
import { ConfirmarEliminarModal } from './ConfirmarEliminarModal';
import { useAccess } from '../../auth/presentation/useAccess';

interface Props {
  proyectoId: string;
  isAdmin: boolean;
}

export const ProyectoMetasComponentes: React.FC<Props> = ({ proyectoId, isAdmin }) => {
  const { accessProfile, canInProject } = useAccess();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMeta, setModalMeta] = useState(false);
  const [metaAEditar, setMetaAEditar] = useState<Meta | null>(null);
  const [eliminandoMetaId, setEliminandoMetaId] = useState<string | null>(null);
  const [metaAEliminar, setMetaAEliminar] = useState<Meta | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const isSuperAdmin = accessProfile?.esSuperadministrador === true;

  /** Puede crear metas: Superadmin o permiso metas.crear en este proyecto */
  const puedeCrearMeta = isSuperAdmin || canInProject('metas.crear', proyectoId);

  /** Puede editar metas: Superadmin o permiso metas.editar en este proyecto */
  const puedeEditarMeta = isSuperAdmin || canInProject('metas.editar', proyectoId);

  /** Puede eliminar metas: solo Superadmin */
  const puedeEliminarMeta = isSuperAdmin;

  // Paginación
  const [pagina, setPagina] = useState(1);
  const metasPorPagina = 5;
  const totalPaginas = Math.ceil(metas.length / metasPorPagina);
  const metasPaginadas = useMemo(() => {
    return metas.slice((pagina - 1) * metasPorPagina, pagina * metasPorPagina);
  }, [metas, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [metas]);

  const cargar = async () => {
    try {
      setLoading(true); setError(null);
      const data = await listarMetasProyectoUseCase.ejecutar(proyectoId);
      setMetas(data.filter(m => m.activo));
    } catch {
      setError('Error al cargar las metas del proyecto.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [proyectoId]);

  const eliminarMeta = async (metaId: string) => {
    setEliminandoMetaId(metaId);
    try {
      await eliminarMetaUseCase.ejecutar(proyectoId, metaId);
      await cargar();
    } catch {
      setError('No se pudo eliminar la meta. Intenta nuevamente.');
    } finally {
      setEliminandoMetaId(null);
    }
  };

  const solicitarEliminarMeta = (meta: Meta) => {
    setMetaAEliminar(meta);
    setShowConfirmModal(true);
  };

  const handleConfirmEliminar = async () => {
    if (metaAEliminar) {
      await eliminarMeta(metaAEliminar.id);
    }
  };

  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Metas del Proyecto</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <TouchableOpacity onPress={() => router.push(`/proyectos/${proyectoId}/mapa` as any)}>
            <Text style={{ fontFamily: typography.fontFamily, fontSize: 12, color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' }}>
              mapa proyecto
            </Text>
          </TouchableOpacity>
          {(puedeCrearMeta || isAdmin) && (
            <Button label="+ Nueva Meta" size="sm" onPress={() => setModalMeta(true)} />
          )}
        </View>
      </View>

      {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />}
      {!!error && <ErrorMessage message={error} />}

      {!loading && metas.length > 0 && (
        <View style={styles.tabla}>
          <View style={[styles.fila, styles.encabezado]}>
            <Text style={[styles.celda, styles.celdaNombre, styles.thTxt]}>Meta</Text>
            <Text style={[styles.celda, styles.celdaNum, styles.thTxt]}>Comp.</Text>
            <Text style={[styles.celda, styles.celdaNum, styles.thTxt]}>Acc.</Text>
            <View style={[styles.celda, styles.celdaAccion]} />
          </View>
          {metasPaginadas.map(meta => (
            <View key={meta.id} style={styles.fila}>
              <TouchableOpacity
                style={[styles.celda, styles.celdaNombre]}
                activeOpacity={0.75}
                onPress={() => router.push(`/proyectos/${proyectoId}/metas/${meta.id}` as any)}
              >
                <Text style={styles.metaNombre} numberOfLines={1}>{meta.nombre}</Text>
                {!!meta.descripcion && (
                  <Text style={styles.metaDesc} numberOfLines={1}>{meta.descripcion}</Text>
                )}
              </TouchableOpacity>
              <Text style={[styles.celda, styles.celdaNum, styles.numTxt]}>
                {meta.cantidadComponentes ?? '—'}
              </Text>
              <Text style={[styles.celda, styles.celdaNum, styles.numTxt]}>
                {meta.cantidadAcciones ?? '—'}
              </Text>
              <View style={[styles.celda, styles.celdaAccion]}>
                {(puedeEditarMeta || isAdmin) && (
                  <TouchableOpacity
                    accessibilityLabel={`Editar meta ${meta.nombre}`}
                    onPress={() => setMetaAEditar(meta)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
                {puedeEliminarMeta && (
                  <TouchableOpacity
                    accessibilityLabel={`Eliminar meta ${meta.nombre}`}
                    disabled={eliminandoMetaId === meta.id}
                    onPress={() => solicitarEliminarMeta(meta)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => router.push(`/proyectos/${proyectoId}/metas/${meta.id}` as any)}>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {totalPaginas > 1 && (
            <View style={styles.paginacion}>
              <TouchableOpacity
                disabled={pagina === 1}
                onPress={() => setPagina(p => Math.max(p - 1, 1))}
                style={[styles.pagBtn, pagina === 1 && styles.pagBtnDisabled]}
                accessibilityLabel="Página anterior"
              >
                <Ionicons name="chevron-back" size={16} color={pagina === 1 ? colors.textSecondary : colors.primary} />
              </TouchableOpacity>
              <Text style={styles.pagTexto}>Página {pagina} de {totalPaginas}</Text>
              <TouchableOpacity
                disabled={pagina === totalPaginas}
                onPress={() => setPagina(p => Math.min(p + 1, totalPaginas))}
                style={[styles.pagBtn, pagina === totalPaginas && styles.pagBtnDisabled]}
                accessibilityLabel="Página siguiente"
              >
                <Ionicons name="chevron-forward" size={16} color={pagina === totalPaginas ? colors.textSecondary : colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {modalMeta && (
        <CrearMetaModal
          proyectoId={proyectoId}
          visible={modalMeta}
          onClose={() => setModalMeta(false)}
          onCreado={() => { setModalMeta(false); cargar(); }}
        />
      )}

      {metaAEditar && (
        <EditarMetaModal
          proyectoId={proyectoId}
          meta={metaAEditar}
          visible={!!metaAEditar}
          onClose={() => setMetaAEditar(null)}
          onActualizado={() => { setMetaAEditar(null); cargar(); }}
        />
      )}

      {metaAEliminar && (
        <ConfirmarEliminarModal
          title="Eliminar meta"
          message={`Eliminarás la meta "${metaAEliminar.nombre}" y todos sus componentes, acciones y evidencias. No se puede deshacer.`}
          visible={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setMetaAEliminar(null);
          }}
          onConfirm={handleConfirmEliminar}
        />
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  titulo: { fontFamily: typography.fontFamily, fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.textPrimary },
  vacio: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textSecondary, fontStyle: 'italic' },
  tabla: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, overflow: 'hidden' as any },
  fila: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.sm, paddingHorizontal: spacing.sm } as any,
  encabezado: { backgroundColor: colors.background },
  celda: { paddingHorizontal: spacing.xs },
  celdaNombre: { flex: 1 },
  celdaNum: { width: 52, alignItems: 'center' } as any,
  celdaAccion: { width: 86, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.xs } as any,
  deleteButton: { padding: 4 },
  thTxt: { fontFamily: typography.fontFamily, fontSize: 11, fontWeight: typography.weights.bold, color: colors.textSecondary, textTransform: 'uppercase' as any },
  metaNombre: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: colors.textPrimary },
  metaDesc: { fontFamily: typography.fontFamily, fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  numTxt: { fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textPrimary, textAlign: 'center' as any },
  paginacion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  } as any,
  pagBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagBtnDisabled: {
    opacity: 0.5,
    backgroundColor: colors.background,
  },
  pagTexto: {
    fontFamily: typography.fontFamily,
    fontSize: 12,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
});
