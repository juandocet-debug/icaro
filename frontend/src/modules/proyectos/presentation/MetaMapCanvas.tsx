import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.6;
const STEP = 0.1;

interface Props { children: React.ReactNode; }

export const MetaMapCanvas: React.FC<Props> = ({ children }) => {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const divRef = useRef<HTMLDivElement | null>(null);

  const clampZoom = (z: number) =>
    Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)) * 10) / 10;

  const zoomIn  = () => setZoom(z => clampZoom(z + STEP));
  const zoomOut = () => setZoom(z => clampZoom(z - STEP));
  const reset   = () => { setZoom(1.0); setPan({ x: 0, y: 0 }); };

  // Ctrl+wheel zoom on web (requires non-passive listener)
  const setDivRef = useCallback((el: HTMLDivElement | null) => {
    if (divRef.current) {
      divRef.current.removeEventListener('wheel', handleWheel as any);
    }
    divRef.current = el;
    if (el) el.addEventListener('wheel', handleWheel as any, { passive: false });
  }, []);

  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => clampZoom(z + (e.deltaY < 0 ? STEP : -STEP)));
    }
  };

  // Mobile: nested ScrollViews (no canvas)
  if (Platform.OS !== 'web') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator style={styles.mobilouter}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ padding: spacing.md }}>{children}</View>
        </ScrollView>
      </ScrollView>
    );
  }

  // Web: draggable, zoomable canvas
  return (
    <View style={styles.wrap}>
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.tbBtn} onPress={zoomIn} accessibilityLabel="Acercar">
          <Ionicons name="add" size={15} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.zoomTxt}>{Math.round(zoom * 100)}%</Text>
        <TouchableOpacity style={styles.tbBtn} onPress={zoomOut} accessibilityLabel="Alejar">
          <Ionicons name="remove" size={15} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.tbBtn} onPress={reset} accessibilityLabel="Restablecer vista">
          <Ionicons name="refresh-outline" size={15} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.hint}>Ctrl+rueda para zoom · Arrastre para mover</Text>
      </View>

      <div
        ref={setDivRef}
        style={{
          overflow: 'auto',
          flex: 1,
          height: '100%',
          cursor: dragging.current ? 'grabbing' : 'grab',
          userSelect: 'none',
          backgroundColor: colors.background,
        } as any}
        onMouseDown={(e: any) => {
          if (e.button !== 0) return;
          dragging.current = true;
          last.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseMove={(e: any) => {
          if (!dragging.current) return;
          const dx = e.clientX - last.current.x;
          const dy = e.clientY - last.current.y;
          last.current = { x: e.clientX, y: e.clientY };
          setPan(p => ({ x: p.x + dx, y: p.y + dy }));
        }}
        onMouseUp={() => { dragging.current = false; }}
        onMouseLeave={() => { dragging.current = false; }}
      >
        <div style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          display: 'inline-block',
          padding: 40,
        } as any}>
          {children}
        </div>
      </div>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden' as any },
  mobilouter: { flex: 1 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 6, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border } as any,
  tbBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  zoomTxt: { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.textSecondary, minWidth: 36, textAlign: 'center' as any },
  separator: { width: 1, height: 18, backgroundColor: colors.border, marginHorizontal: spacing.xs },
  hint: { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.textSecondary, marginLeft: spacing.sm },
});
