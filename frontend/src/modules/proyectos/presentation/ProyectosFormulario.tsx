import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { ErrorMessage } from '../../../shared/components/ErrorMessage';
import { colors } from '../../../shared/constants/colors';
import { spacing } from '../../../shared/constants/spacing';
import { typography } from '../../../shared/constants/typography';
import { EstadoProyecto } from '../domain/Proyecto';
import { CreateProyectoDto } from '../domain/CreateProyectoDto';

const DateField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}> = ({ label, value, onChange, placeholder }) => (
  <View style={dfStyles.wrapper}>
    <Text style={dfStyles.label}>{label}</Text>
    {Platform.OS === 'web' ? (
      <input
        type="date"
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.sizes.sm,
          color: value ? colors.textPrimary : colors.textSecondary,
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: '6px 12px',
          width: '100%',
          outline: 'none',
          cursor: 'pointer',
          height: 36,
          boxSizing: 'border-box',
        }}
      />
    ) : (
      <TextInput
        style={dfStyles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
      />
    )}
  </View>
);

const dfStyles = StyleSheet.create({
  wrapper: { flex: 1, minWidth: 160 },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontFamily: typography.fontFamily,
  },
});

interface ProyectosFormularioProps {
  saving: boolean;
  error: string | null;
  onSubmit: (dto: CreateProyectoDto) => Promise<void>;
  onCancel: () => void;
}

export const ProyectosFormulario: React.FC<ProyectosFormularioProps> = ({
  saving,
  error,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [contract, setContract] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<EstadoProyecto>('activo');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleCrear = () => {
    onSubmit({
      name,
      contractNumber: contract || undefined,
      description: description || undefined,
      status,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const statuses: EstadoProyecto[] = ['activo', 'inactivo', 'completado', 'suspendido'];

  return (
    <Card style={styles.formCard} padding="lg">
      <Text style={styles.formTitle}>Nuevo Proyecto</Text>
      {!!error && <ErrorMessage message={error} />}

      <View style={styles.formRow}>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nombre del proyecto"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>N° Contrato</Text>
          <TextInput
            style={styles.input}
            value={contract}
            onChangeText={setContract}
            placeholder="Ej: CT-2024-001"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Estado</Text>
          <View style={styles.statusPicker}>
            {statuses.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.statusOpt, status === s && styles.statusOptActive]}
                onPress={() => setStatus(s)}
              >
                <Text style={[styles.statusOptText, status === s && styles.statusOptTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.formRow}>
        <DateField
          label="Fecha inicio"
          value={startDate}
          onChange={setStartDate}
          placeholder="2024-01-01"
        />
        <DateField
          label="Fecha fin"
          value={endDate}
          onChange={setEndDate}
          placeholder="2024-12-31"
        />
        <View style={[styles.formField, styles.flex2]}>
          <Text style={styles.fieldLabel}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.inputDesc]}
            value={description}
            onChangeText={setDescription}
            placeholder="Descripción del proyecto..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </View>
      </View>

      <View style={styles.formActions}>
        <Button label="Crear Proyecto" onPress={handleCrear} loading={saving} />
        <Button label="Cancelar" variant="ghost" onPress={onCancel} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  formCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  formTitle: { fontFamily: typography.fontFamily, fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: colors.textPrimary, marginBottom: spacing.md },
  formRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm, flexWrap: 'wrap' },
  formField: { flex: 1, minWidth: 180 },
  flex2: { flex: 2 },
  fieldLabel: { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.textSecondary, marginBottom: 4, fontWeight: typography.weights.medium },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, fontFamily: typography.fontFamily, fontSize: typography.sizes.sm, color: colors.textPrimary, backgroundColor: colors.surface },
  inputDesc: { height: 40 },
  statusPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  statusOpt: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginRight: 4, marginBottom: 4 },
  statusOptActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusOptText: { fontFamily: typography.fontFamily, fontSize: typography.sizes.xs, color: colors.textSecondary },
  statusOptTextActive: { color: colors.surface },
  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
