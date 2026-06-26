import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AppShell } from '../../../shared/components/AppShell';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { api } from '../../../services/api';
import { AxiosMetaRepository } from '../infrastructure/AxiosMetaRepository';
import { Meta } from '../domain/Meta';
import { Componente } from '../domain/Componente';
import { Accion } from '../domain/Accion';
import { useIsMobile } from '../../../shared/hooks/useIsMobile';
import { useAccess } from '../../auth/presentation/useAccess';
import { styles } from './ProyectoMapaScreen.styles';

interface Props {
  proyectoId: string;
}

interface TreeMeta extends Meta {
  componentes: TreeComponente[];
  expanded?: boolean;
}

interface TreeComponente extends Componente {
  acciones: Accion[];
  expanded?: boolean;
}

const getDiasRestantes = (endDateStr?: string | null) => {
  if (!endDateStr) return null;
  const end = new Date(endDateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const ProyectoMapaScreen: React.FC<Props> = ({ proyectoId }) => {
  const { accessProfile, canInProject, isLoading: accessLoading } = useAccess();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = accessProfile?.esSuperadministrador === true;
  const canVerMetas = isSuperAdmin || 
    canInProject('metas.ver', proyectoId) || 
    (accessProfile?.asignaciones?.some(
      (a) => a.proyectoId === proyectoId && a.rolCodigo === 'coordinador_componente'
    ) ?? false);
  
  // Hierarchical data
  const [treeData, setTreeData] = useState<TreeMeta[]>([]);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Evidence counts for dashboard
  const [evidenciaKpis, setEvidenciaKpis] = useState({
    aprobadas: 0,
    revision: 0,
    noAprobadas: 0,
    total: 0,
  });

  const [colaboradoresCount, setColaboradoresCount] = useState(0);

  const metaRepo = useMemo(() => new AxiosMetaRepository(), []);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      // 3 requests en paralelo: mapa completo + evidencias + miembros (~300ms total)
      const [resMapa, resEv, resM] = await Promise.all([
        api.get<{ ok: boolean; datos: any[] }>(`/api/proyectos/${proyectoId}/mapa/`),
        api.get<{ ok: boolean; count?: number; summary?: any; datos: any[] }>(
          `/api/evidencias/proyecto/${proyectoId}/evidencias-operativas-general/?summary=1`
        ).catch(() => ({ data: { ok: false, datos: [] } })),
        api.get<{ ok: boolean; datos: any[] }>(
          `/api/miembros/proyecto/${proyectoId}/miembros/`
        ).catch(() => ({ data: { ok: false, datos: [] } })),
      ]);

      // Mapa: jerarquía completa en 1 response
      if (resMapa.data.ok) {
        const enrichedMetas: TreeMeta[] = (resMapa.data.datos || []).map((meta: any) => ({
          id: meta.id,
          nombre: meta.nombre,
          descripcion: meta.descripcion,
          activo: meta.activo,
          proyecto_id: proyectoId,
          proyectoId: proyectoId,
          created_at: meta.created_at,
          expanded: true,
          componentes: (meta.componentes || []).map((comp: any) => ({
            id: comp.id,
            nombre: comp.name ?? comp.nombre,
            descripcion: comp.descripcion,
            meta_id: comp.meta_id,
            display_order: comp.display_order,
            expanded: true,
            acciones: (comp.acciones || []).map((acc: any) => ({
              id: acc.id,
              nombre: acc.nombre ?? acc.name,
              descripcion: acc.descripcion,
              unidad_medida: acc.unidad_medida,
              proyeccion_cuantitativa: acc.proyeccion,
              ejecucion_acumulada: acc.ejecucion,
              start_date: acc.start_date,
              end_date: acc.end_date,
              display_order: acc.display_order,
            })),
          })),
        }));
        setTreeData(enrichedMetas);
      }

      // Evidencias KPIs
      if (resEv.data.ok) {
        const summary = resEv.data.summary;
        setEvidenciaKpis({
          aprobadas: summary?.aprobadas ?? 0,
          revision: summary?.revision ?? 0,
          noAprobadas: summary?.pendientes ?? 0,
          total: resEv.data.count ?? 0,
        });
      }

      // Colaboradores
      if (resM.data.ok) {
        setColaboradoresCount((resM.data.datos || []).length);
      }

    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el mapa del proyecto.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessLoading) return;
    if (!accessProfile) return;
    if (!canVerMetas) {
      router.replace('/acceso-denegado');
      return;
    }
    cargarDatos();
  }, [proyectoId, accessLoading, accessProfile, canVerMetas]);

  // Toggle expand/collapse
  const toggleMeta = (metaId: string) => {
    setTreeData(prev => prev.map(m => m.id === metaId ? { ...m, expanded: !m.expanded } : m));
  };

  const toggleComponent = (metaId: string, compId: string) => {
    setTreeData(prev => prev.map(m => {
      if (m.id !== metaId) return m;
      return {
        ...m,
        componentes: m.componentes.map(c => c.id === compId ? { ...c, expanded: !c.expanded } : c)
      };
    }));
  };

  const toggleAll = (expand: boolean) => {
    setTreeData(prev => prev.map(m => ({
      ...m,
      expanded: expand,
      componentes: m.componentes.map(c => ({ ...c, expanded: expand }))
    })));
  };

  // Filtered Tree
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return treeData;
    const query = searchQuery.toLowerCase();
    return treeData.map(meta => {
      const filteredComps = meta.componentes.map(comp => {
        const filteredAccs = comp.acciones.filter(acc => 
          acc.nombre.toLowerCase().includes(query) || 
          (acc.descripcion && acc.descripcion.toLowerCase().includes(query))
        );
        const compMatches = comp.nombre.toLowerCase().includes(query) || (comp.descripcion && comp.descripcion.toLowerCase().includes(query));
        
        if (compMatches || filteredAccs.length > 0) {
          return { ...comp, acciones: compMatches ? comp.acciones : filteredAccs, expanded: true };
        }
        return null;
      }).filter(Boolean) as TreeComponente[];

      const metaMatches = meta.nombre.toLowerCase().includes(query) || (meta.descripcion && meta.descripcion.toLowerCase().includes(query));

      if (metaMatches || filteredComps.length > 0) {
        return { ...meta, componentes: metaMatches ? meta.componentes : filteredComps, expanded: true };
      }
      return null;
    }).filter(Boolean) as TreeMeta[];
  }, [treeData, searchQuery]);

  // Calculate totals
  const totalStats = useMemo(() => {
    let metasCount = treeData.length;
    let compsCount = 0;
    let accsCount = 0;
    let accumProgress = 0;

    treeData.forEach(m => {
      compsCount += m.componentes.length;
      m.componentes.forEach(c => {
        accsCount += c.acciones.length;
        c.acciones.forEach(a => {
          accumProgress += a.avancePorcentaje || 0;
        });
      });
    });

    const averageProgress = accsCount > 0 ? Math.round(accumProgress / accsCount) : 0;

    return {
      metasCount,
      compsCount,
      accsCount,
      averageProgress
    };
  }, [treeData]);

  // Avance por Dimensión (Components list progress)
  const dimensionStats = useMemo(() => {
    const list: { name: string; progress: number }[] = [];
    treeData.forEach(meta => {
      meta.componentes.forEach(comp => {
        const accs = comp.acciones;
        const avg = accs.length > 0
          ? Math.round(accs.reduce((acc, a) => acc + (a.avancePorcentaje || 0), 0) / accs.length)
          : 0;
        list.push({
          name: comp.nombre,
          progress: avg
        });
      });
    });

    // Fallback static data if no components
    if (list.length === 0) {
      return [
        { name: 'Gestión', progress: 75 },
        { name: 'Financiera', progress: 68 },
        { name: 'Talento Humano', progress: 62 },
        { name: 'Tecnología', progress: 55 },
        { name: 'Comunicaciones', progress: 40 },
        { name: 'Legal', progress: 30 },
      ];
    }

    return list.slice(0, 6);
  }, [treeData]);

  if (loading || accessLoading || !accessProfile) {
    return (
      <AppShell style={styles.shell}>
        <ActivityIndicator size="large" color="#a78bfa" style={styles.loader} />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell style={styles.shell}>
        <ErrorMessage message={error} />
        <Button label="Reintentar" onPress={cargarDatos} style={styles.btnRetry} />
      </AppShell>
    );
  }

  // Calculate SVG stroke dashes for donuts
  const getStrokeDash = (pct: number, radius = 24) => {
    const circ = 2 * Math.PI * radius;
    const strokeDashoffset = circ - (pct / 100) * circ;
    return { circ, strokeDashoffset };
  };

  const progressDonut = getStrokeDash(totalStats.averageProgress);
  const totalEv = evidenciaKpis.total || 1;
  const apPct = Math.round((evidenciaKpis.aprobadas / totalEv) * 100);
  const revPct = Math.round((evidenciaKpis.revision / totalEv) * 100);
  const penPct = Math.round((evidenciaKpis.noAprobadas / totalEv) * 100);

  return (
    <AppShell scrollable={true} style={styles.shell}>
      {/* ── HEADER ── */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={14} color="#a78bfa" />
            <Text style={styles.backBtnText}>Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Resumen Ejecutivo del Proyecto</Text>
          <Text style={styles.subtitle}>Visión general del estado y avance del proyecto</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.dateSelector}>
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text style={styles.dateText}>01 Ene 2026 - 31 Dic 2026</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn}>
            <Ionicons name="download-outline" size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.exportBtnText}>Exportar reporte</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── KPI ROW (4 CARDS) ── */}
      <View style={[styles.kpiContainer, isMobile && { flexDirection: 'column' }]}>
        {/* PROGRESO GENERAL */}
        <View style={styles.kpiCard}>
          <View style={styles.donutContainer}>
            <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="30" cy="30" r="24" fill="transparent" stroke="#1f2937" strokeWidth="4" />
              <circle
                cx="30"
                cy="30"
                r="24"
                fill="transparent"
                stroke="#8b5cf6"
                strokeWidth="4"
                strokeDasharray={progressDonut.circ}
                strokeDashoffset={progressDonut.strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <View style={styles.donutTextContainer}>
              <Text style={styles.donutTextInner}>{totalStats.averageProgress}%</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiLabel}>PROGRESO GENERAL</Text>
            <Text style={styles.kpiVal}>{totalStats.averageProgress}%</Text>
            <Text style={styles.kpiSub}>Avance total del proyecto</Text>
          </View>
        </View>

        {/* ESTRUCTURA DEL PROYECTO */}
        <View style={styles.kpiCard}>
          <View style={styles.iconBoxPurple}>
            <Ionicons name="folder-outline" size={22} color="#a78bfa" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiLabel}>ESTRUCTURA DEL PROYECTO</Text>
            <View style={styles.structureRow}>
              <View style={styles.structureVal}>
                <Text style={styles.structNumber}>{totalStats.metasCount}</Text>
                <Text style={styles.structLabel}>Metas</Text>
              </View>
              <View style={styles.structDivider} />
              <View style={styles.structureVal}>
                <Text style={styles.structNumber}>{totalStats.compsCount}</Text>
                <Text style={styles.structLabel}>Componentes</Text>
              </View>
              <View style={styles.structDivider} />
              <View style={styles.structureVal}>
                <Text style={styles.structNumber}>{totalStats.accsCount}</Text>
                <Text style={styles.structLabel}>Acciones</Text>
              </View>
            </View>
          </View>
        </View>

        {/* SEMÁFORO DE EVIDENCIAS */}
        <View style={styles.kpiCard}>
          <View style={styles.donutContainer}>
            <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="30" cy="30" r="24" fill="transparent" stroke="#1f2937" strokeWidth="4" />
              {/* Approbadas Segment */}
              <circle
                cx="30"
                cy="30"
                r="24"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="4"
                strokeDasharray={getStrokeDash(apPct).circ}
                strokeDashoffset={getStrokeDash(apPct).strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <View style={styles.donutTextContainer}>
              <Text style={styles.donutTextInner}>{evidenciaKpis.total}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiLabel}>SEMÁFORO DE EVIDENCIAS</Text>
            <View style={styles.semaforoList}>
              <View style={styles.semaforoItem}>
                <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.semaforoText}>{evidenciaKpis.aprobadas} <Text style={{ color: '#6b7280' }}>Aprobadas</Text></Text>
              </View>
              <View style={styles.semaforoItem}>
                <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.semaforoText}>{evidenciaKpis.revision} <Text style={{ color: '#6b7280' }}>En revisión</Text></Text>
              </View>
              <View style={styles.semaforoItem}>
                <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.semaforoText}>{evidenciaKpis.noAprobadas} <Text style={{ color: '#6b7280' }}>Pendientes</Text></Text>
              </View>
            </View>
          </View>
        </View>

        {/* RESPONSABLES */}
        <View style={styles.kpiCard}>
          <View style={styles.iconBoxPurple}>
            <Ionicons name="people-outline" size={22} color="#a78bfa" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kpiLabel}>RESPONSABLES</Text>
            <Text style={styles.kpiVal}>{colaboradoresCount}</Text>
            <Text style={styles.kpiSub}>Personas asignadas</Text>
          </View>
        </View>
      </View>

      {/* ── TWO COLUMN CONTENT AREA ── */}
      <View style={[styles.mainLayout, isMobile && { flexDirection: 'column' }]}>
        
        {/* COL 1: MAPA DEL PROYECTO (65%) */}
        <View style={styles.leftColumn}>
          <Card padding="md" style={styles.mapCard}>
            <View style={styles.mapHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>MAPA DEL PROYECTO</Text>
                <Text style={styles.sectionSubtitle}>Estructura y avance por cada nivel del proyecto</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                <View style={styles.mapSearchBox}>
                  <Ionicons name="search" size={14} color="#9ca3af" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filtrar por nivel..."
                    style={styles.mapInputSearch as any}
                  />
                </View>
                <TouchableOpacity onPress={() => toggleAll(true)} style={styles.actionOutlineBtn}>
                  <Text style={styles.actionOutlineBtnText}>Expandir todo</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hierarchy Tree */}
            <View style={styles.treeRoot}>
              {filteredTree.length === 0 ? (
                <View style={styles.emptyMap}>
                  <Ionicons name="map-outline" size={36} color="#4b5563" />
                  <Text style={styles.emptyMapText}>No se encontraron elementos.</Text>
                </View>
              ) : (
                filteredTree.map((meta, index) => {
                  let metaAccs = 0;
                  let metaProgress = 0;
                  meta.componentes.forEach(c => {
                    metaAccs += c.acciones.length;
                    c.acciones.forEach(a => {
                      metaProgress += a.avancePorcentaje || 0;
                    });
                  });
                  const metaAverage = metaAccs > 0 ? Math.round(metaProgress / metaAccs) : 0;
                  const idxStr = String(index + 1).padStart(2, '0');

                  return (
                    <View key={meta.id} style={styles.metaNode}>
                      {/* Meta Card Row */}
                      <TouchableOpacity activeOpacity={0.9} onPress={() => toggleMeta(meta.id)} style={styles.metaCardHeader}>
                        <View style={styles.metaHeaderLeft}>
                          <View style={styles.metaNumberBox}>
                            <Text style={styles.metaNumberText}>{idxStr}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.metaLevelTag}>META</Text>
                              <Text style={styles.metaTitleText}>{meta.nombre}</Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.metaHeaderRight}>
                          <Text style={styles.metaPct}>{metaAverage}%</Text>
                          <View style={styles.metaProgressBg}>
                            <View style={[styles.metaProgressFill, { width: `${metaAverage}%` }]} />
                          </View>
                          <Text style={styles.metaStatsDesc}>
                            {meta.componentes.length} Componentes | {metaAccs} Acciones
                          </Text>
                          <Ionicons name={meta.expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#6b7280" />
                        </View>
                      </TouchableOpacity>

                      {/* Components Subtree */}
                      {meta.expanded && (
                        <View style={styles.metaChildren}>
                          {meta.componentes.map((comp, compIdx) => {
                            let compAccs = comp.acciones.length;
                            let compProgress = comp.acciones.reduce((acc, a) => acc + (a.avancePorcentaje || 0), 0);
                            const compAverage = compAccs > 0 ? Math.round(compProgress / compAccs) : 0;
                            const compIdxStr = `${index + 1}.${compIdx + 1}`;

                            return (
                              <View key={comp.id} style={styles.compNode}>
                                {/* Component Header */}
                                <TouchableOpacity activeOpacity={0.9} onPress={() => toggleComponent(meta.id, comp.id)} style={styles.compCardHeader}>
                                  <View style={styles.compHeaderLeft}>
                                    <View style={styles.compNumberBox}>
                                      <Text style={styles.compNumberText}>{compIdxStr}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={styles.compLevelTag}>COMPONENTE</Text>
                                        <Text style={styles.compTitleText}>{comp.nombre}</Text>
                                      </View>
                                    </View>
                                  </View>

                                  <View style={styles.compHeaderRight}>
                                    <Text style={styles.compPct}>{compAverage}%</Text>
                                    <View style={styles.compProgressBg}>
                                      <View style={[styles.compProgressFill, { width: `${compAverage}%` }]} />
                                    </View>
                                    <Text style={styles.compStatsDesc}>{compAccs} Acciones</Text>
                                    <Ionicons name={comp.expanded ? 'chevron-up' : 'chevron-down'} size={14} color="#6b7280" />
                                  </View>
                                </TouchableOpacity>

                                {/* Actions Subtree */}
                                {comp.expanded && (
                                  <View style={styles.compChildren}>
                                    {comp.acciones.map((acc, accIdx) => {
                                      const accIdxStr = `${compIdxStr}.${accIdx + 1}`;
                                      const progressPct = acc.proyeccion && acc.proyeccion > 0
                                        ? (acc.ejecucion / acc.proyeccion) * 100
                                        : 0;

                                      const isGoalMet = acc.proyeccion != null && acc.proyeccion > 0
                                        ? (acc.ejecucion >= acc.proyeccion)
                                        : false;

                                      const statusText = isGoalMet ? 'Cumplida'
                                        : acc.resumenVerificacion?.estado === 'incompleto' ? 'En revisión'
                                        : acc.ejecucion > 0 ? 'En progreso'
                                        : 'Pendiente';

                                      const statusColor = isGoalMet ? '#10b981'
                                        : acc.resumenVerificacion?.estado === 'incompleto' ? '#f59e0b'
                                        : acc.ejecucion > 0 ? '#3b82f6'
                                        : '#ef4444';

                                      const primaryRespName = acc.responsables && acc.responsables.length > 0
                                        ? acc.responsables[0].nombreCompleto || acc.responsables[0].username
                                        : 'Sin asignar';

                                      return (
                                        <View key={acc.id} style={styles.actionNode}>
                                          <View style={styles.actionLeft}>
                                            <View style={styles.dotIndicator} />
                                            <Text style={styles.actionIndex}>{accIdxStr}</Text>
                                            <View style={{ flex: 1 }}>
                                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Text style={styles.actionLevelTag}>Acción {accIdxStr}</Text>
                                              </View>
                                              <Text style={styles.actionNameText}>{acc.nombre}</Text>
                                              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4, flexWrap: 'wrap' }}>
                                                {(!!acc.startDate || !!acc.endDate) && (
                                                  <>
                                                    <Ionicons name="calendar-outline" size={10} color="#9ca3af" />
                                                    <Text style={{ fontFamily: typography.fontFamily, fontSize: 9, color: '#9ca3af' }}>
                                                      {acc.startDate || 'N/A'} a {acc.endDate || 'N/A'}
                                                    </Text>
                                                  </>
                                                )}
                                                <Text style={{ fontFamily: typography.fontFamily, fontSize: 9, color: '#a78bfa', fontWeight: '700', marginLeft: 4 }}>
                                                  · {acc.ejecucion || 0} / {acc.proyeccion || 0} {acc.unidadMedida || 'unidades'}
                                                </Text>
                                                {(() => {
                                                  const days = getDiasRestantes(acc.endDate);
                                                  if (days === null) return null;
                                                  if (days > 0) {
                                                    return (
                                                      <Text style={{ fontFamily: typography.fontFamily, fontSize: 9, color: '#10b981', marginLeft: 4 }}>
                                                        · Quedan {days} días
                                                      </Text>
                                                    );
                                                  } else if (days === 0) {
                                                    return (
                                                      <Text style={{ fontFamily: typography.fontFamily, fontSize: 9, color: '#f59e0b', marginLeft: 4 }}>
                                                        · Vence hoy
                                                      </Text>
                                                    );
                                                  } else {
                                                    return (
                                                      <Text style={{ fontFamily: typography.fontFamily, fontSize: 9, color: '#ef4444', marginLeft: 4 }}>
                                                        · Vencido hace {Math.abs(days)} días
                                                      </Text>
                                                    );
                                                  }
                                                })()}
                                              </View>
                                            </View>
                                          </View>

                                          <View style={styles.actionRight}>
                                            <Text style={styles.actionPctText}>{Math.round(progressPct)}%</Text>
                                            <View style={styles.actionProgressBg}>
                                              <View style={[styles.actionProgressFill, { width: `${Math.min(progressPct, 100)}%` }]} />
                                            </View>
                                            <Text style={styles.actionRespName}>{primaryRespName}</Text>
                                            <View style={[styles.actionStatusBadge, { backgroundColor: `${statusColor}15` }]}>
                                              <Text style={[styles.actionStatusBadgeText, { color: statusColor }]}>{statusText}</Text>
                                            </View>
                                          </View>
                                        </View>
                                      );
                                    })}
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </Card>
        </View>

        {/* COL 2: CHARTS & RISKS (35%) */}
        <View style={styles.rightColumn}>
          {/* AVANCE POR DIMENSIÓN */}
          <Card padding="md" style={styles.sideCard}>
            <Text style={styles.sideCardTitle}>AVANCE POR DIMENSIÓN</Text>
            <Text style={styles.sideCardSub}>Distribución del progreso por dimensión del proyecto</Text>
            
            <View style={styles.barChartContainer}>
              {dimensionStats.map((item, idx) => {
                const barColors = ['#8b5cf6', '#10b981', '#3b82f6', '#ec4899', '#f59e0b', '#ef4444'];
                const color = barColors[idx % barColors.length];

                return (
                  <View key={item.name} style={styles.barChartCol}>
                    <View style={styles.barWrapper}>
                      <View style={[styles.barFill, { height: `${item.progress}%`, backgroundColor: color }]} />
                      <Text style={styles.barValText}>{item.progress}%</Text>
                    </View>
                    <Text style={styles.barLabel} numberOfLines={1}>{item.name}</Text>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* RIESGOS PRINCIPALES */}
          <Card padding="md" style={[styles.sideCard, { marginTop: spacing.md }]}>
            <Text style={styles.sideCardTitle}>RIESGOS PRINCIPALES</Text>
            <Text style={styles.sideCardSub}>Monitoreo de riesgos del proyecto</Text>

            <View style={styles.riskList}>
              <View style={styles.riskHeader}>
                <Text style={[styles.riskHeaderCell, { flex: 2 }]}>Riesgo</Text>
                <Text style={styles.riskHeaderCell}>Impacto</Text>
                <Text style={styles.riskHeaderCell}>Estado</Text>
              </View>

              <View style={styles.riskRow}>
                <View style={[styles.riskNameCell, { flex: 2 }]}>
                  <Ionicons name="warning-outline" size={14} color="#ef4444" style={{ marginRight: 6 }} />
                  <Text style={styles.riskNameText}>Retraso en entregas de proveedores</Text>
                </View>
                <Text style={[styles.riskImpactText, { color: '#ef4444' }]}>• Alto</Text>
                <View style={styles.riskStateBadge}>
                  <Text style={styles.riskStateText}>En seguimiento</Text>
                </View>
              </View>

              <View style={styles.riskRow}>
                <View style={[styles.riskNameCell, { flex: 2 }]}>
                  <Ionicons name="warning-outline" size={14} color="#ef4444" style={{ marginRight: 6 }} />
                  <Text style={styles.riskNameText}>Falta de recursos especializados</Text>
                </View>
                <Text style={[styles.riskImpactText, { color: '#ef4444' }]}>• Alto</Text>
                <View style={styles.riskStateBadge}>
                  <Text style={styles.riskStateText}>En seguimiento</Text>
                </View>
              </View>

              <View style={styles.riskRow}>
                <View style={[styles.riskNameCell, { flex: 2 }]}>
                  <Ionicons name="warning-outline" size={14} color="#f59e0b" style={{ marginRight: 6 }} />
                  <Text style={styles.riskNameText}>Cambios en alcance del proyecto</Text>
                </View>
                <Text style={[styles.riskImpactText, { color: '#f59e0b' }]}>• Medio</Text>
                <View style={[styles.riskStateBadge, { backgroundColor: '#f59e0b20' }]}>
                  <Text style={[styles.riskStateText, { color: '#f59e0b' }]}>En revisión</Text>
                </View>
              </View>

              <View style={styles.riskRow}>
                <View style={[styles.riskNameCell, { flex: 2 }]}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#10b981" style={{ marginRight: 6 }} />
                  <Text style={styles.riskNameText}>Dependencia de sistemas externos</Text>
                </View>
                <Text style={[styles.riskImpactText, { color: '#10b981' }]}>• Bajo</Text>
                <View style={[styles.riskStateBadge, { backgroundColor: '#10b98120' }]}>
                  <Text style={[styles.riskStateText, { color: '#10b981' }]}>Controlado</Text>
                </View>
              </View>
            </View>
          </Card>
        </View>

      </View>
    </AppShell>
  );
};
