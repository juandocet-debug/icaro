import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export const MiniCalendar: React.FC = () => {
  const dias = [
    { num: 12, label: 'Sun' },
    { num: 13, label: 'Mon', active: true },
    { num: 14, label: 'Tue' },
    { num: 15, label: 'Wed' },
    { num: 16, label: 'Thu' },
    { num: 17, label: 'Fri' },
    { num: 18, label: 'Sat' },
  ];

  const eventos = [
    { hora: '2:00 pm', desc: 'Reunión de gobernanza general' },
    { hora: '3:30 pm', desc: 'Revisión de proyectos activos' },
    { hora: '5:00 pm', desc: 'Auditoría de evidencias' },
  ];

  return (
    <Card padding="md" style={styles.calendarContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Calendario</Text>
        <Text style={styles.headerMonth}>Abril</Text>
      </View>

      <View style={styles.diasRow}>
        {dias.map(d => (
          <View key={d.num} style={[styles.diaCol, d.active && styles.diaColActive]}>
            <Text style={[styles.diaLabel, d.active && styles.diaLabelActive]}>{d.label}</Text>
            <Text style={[styles.diaNum, d.active && styles.diaNumActive]}>{d.num}</Text>
          </View>
        ))}
      </View>

      <View style={styles.eventosContainer}>
        {eventos.map((e, idx) => (
          <View key={idx} style={styles.eventoItem}>
            <Text style={styles.eventoHora}>{e.hora}</Text>
            <View style={styles.eventoDot} />
            <Text style={styles.eventoDesc} numberOfLines={1}>{e.desc}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  headerMonth: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: 'bold',
  },
  diasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  diaCol: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  diaColActive: {
    backgroundColor: colors.primary,
  },
  diaLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  diaLabelActive: {
    color: colors.surface,
  },
  diaNum: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  diaNumActive: {
    color: colors.surface,
  },
  eventosContainer: {
    marginTop: spacing.sm,
  },
  eventoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  eventoHora: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    width: 60,
  },
  eventoDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.sm,
  },
  eventoDesc: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    flex: 1,
  },
});
