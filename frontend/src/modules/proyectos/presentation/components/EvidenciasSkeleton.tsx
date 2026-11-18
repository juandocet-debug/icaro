import React, { useEffect, useRef } from 'react';
import {
  AccessibilityInfo, ActivityIndicator, Animated, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { colors } from '../../../../shared/constants/colors';
import { typography } from '../../../../shared/constants/typography';

export const EvidenciasSkeleton = ({ progress }: { progress: number }) => {
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    let disposed = false;
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.6, duration: 750, useNativeDriver: true }),
    ]));
    const updateMotion = (reduced: boolean) => {
      pulse.stop();
      pulse.reset();
      opacity.setValue(reduced ? 1 : 0.6);
      if (!reduced && !disposed) pulse.start();
    };
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', updateMotion);
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (!disposed) updateMotion(reduced);
    }).catch(() => { if (!disposed) pulse.start(); });
    return () => {
      disposed = true;
      listener.remove();
      pulse.stop();
    };
  }, [opacity]);

  const percentage = Math.max(0, Math.min(99, Math.round(progress)));

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View accessibilityRole="progressbar"
        accessibilityLabel="Cargando evidencias. Progreso estimado"
        accessibilityValue={{ min: 0, max: 100, now: percentage }}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}
        style={s.status}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={s.label}>Cargando evidencias</Text>
        <Text style={s.percentage}>{percentage}% estimado</Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${percentage}%` }]} />
      </View>
      <Animated.View style={{ opacity }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[s.line, s.heading]} />
        <View style={[s.line, s.subtitle]} />
        <View style={s.filters} />
        <View style={s.grid}>
          {Array.from({ length: 8 }, (_, index) => (
            <View key={index} style={s.card}>
              <View style={s.top}>
                <View style={[s.line, s.title]} />
                <View style={s.icon} />
              </View>
              <View style={[s.line, s.count]} />
              <View style={s.metadata}>
                <View style={[s.line, s.date]} />
                <View style={[s.line, s.date]} />
                <View style={[s.line, s.badge]} />
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  status: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  label: { fontFamily: typography.fontFamily, fontSize: 13, color: colors.textSecondary },
  percentage: { fontFamily: typography.fontFamily, fontSize: 12, fontWeight: '600', color: colors.primary, marginLeft: 'auto' },
  track: { height: 3, backgroundColor: colors.border, marginTop: 10, marginBottom: 24, overflow: 'hidden', borderRadius: 2 },
  fill: { height: '100%', backgroundColor: colors.primary },
  line: { height: 12, borderRadius: 4, backgroundColor: '#c7d1de' },
  heading: { height: 20, width: '55%', maxWidth: 350 },
  subtitle: { width: '70%', maxWidth: 430, marginTop: 10 },
  filters: { height: 36, borderRadius: 8, backgroundColor: '#e9eef4', marginVertical: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { width: 220, maxWidth: '100%', height: 184, padding: 16, borderRadius: 8, backgroundColor: '#e9eef4', justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { width: '45%' },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#c7d1de' },
  count: { width: '60%', height: 26 },
  metadata: { alignItems: 'flex-end', gap: 7 },
  date: { width: '65%', height: 9 },
  badge: { width: '35%', height: 9 },
});
