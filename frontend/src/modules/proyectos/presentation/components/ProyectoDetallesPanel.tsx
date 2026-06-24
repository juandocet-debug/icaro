import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../../shared/components/Card';
import { Button } from '../../../../shared/components/Button';
import { colors } from '../../../../shared/constants/colors';
import { spacing } from '../../../../shared/constants/spacing';
import { typography } from '../../../../shared/constants/typography';
import { Proyecto } from '../../domain/Proyecto';

interface ProyectoDetallesPanelProps {
  proyecto: Proyecto;
  canEdit: boolean;
  isMobile: boolean;

  isEditingDesc: boolean;
  setIsEditingDesc: (v: boolean) => void;
  tempDesc: string;
  setTempDesc: (v: string) => void;
  updatingDesc: boolean;
  handleSaveDesc: () => Promise<void>;
  showDescSuccess: boolean;

  isEditingContractInfo: boolean;
  setIsEditingContractInfo: (v: boolean) => void;
  tempContractNumber: string;
  setTempContractNumber: (v: string) => void;
  tempStartDate: string;
  setTempStartDate: (v: string) => void;
  tempEndDate: string;
  setTempEndDate: (v: string) => void;
  updatingContractInfo: boolean;
  handleSaveContractInfo: () => Promise<void>;
  showContractInfoSuccess: boolean;

  isEditingContractObj: boolean;
  setIsEditingContractObj: (v: boolean) => void;
  tempContractObject: string;
  setTempContractObject: (v: string) => void;
  updatingContractObj: boolean;
  handleSaveContractObj: () => Promise<void>;
  showContractObjSuccess: boolean;
}

export const ProyectoDetallesPanel: React.FC<ProyectoDetallesPanelProps> = ({
  proyecto,
  canEdit,
  isMobile,

  isEditingDesc,
  setIsEditingDesc,
  tempDesc,
  setTempDesc,
  updatingDesc,
  handleSaveDesc,
  showDescSuccess,

  isEditingContractInfo,
  setIsEditingContractInfo,
  tempContractNumber,
  setTempContractNumber,
  tempStartDate,
  setTempStartDate,
  tempEndDate,
  setTempEndDate,
  updatingContractInfo,
  handleSaveContractInfo,
  showContractInfoSuccess,

  isEditingContractObj,
  setIsEditingContractObj,
  tempContractObject,
  setTempContractObject,
  updatingContractObj,
  handleSaveContractObj,
  showContractObjSuccess,
}) => {
  const renderDesc = () => (
    <Card padding="md" style={!isMobile && { flex: 2, minWidth: 280 }}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithSuccess}>
          <Text style={styles.cardTitle}>Descripción del Proyecto</Text>
          {showDescSuccess && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
        </View>
        {canEdit && !isEditingDesc && (
          <TouchableOpacity onPress={() => { setTempDesc(proyecto.description || ''); setIsEditingDesc(true); }} style={styles.editBtn}>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {isEditingDesc ? (
        <View style={styles.flexColumn}>
          <TextInput
            style={[styles.cardTextArea, !isMobile && { flex: 1, minHeight: 100 }]}
            multiline
            value={tempDesc}
            onChangeText={setTempDesc}
            placeholder="Escribe la descripción del proyecto..."
          />
          <View style={styles.actionsRow}>
            <Button label="Cancelar" variant="secondary" size="sm" onPress={() => setIsEditingDesc(false)} disabled={updatingDesc} />
            <Button label="Guardar" size="sm" loading={updatingDesc} onPress={handleSaveDesc} disabled={updatingDesc} />
          </View>
        </View>
      ) : (
        <Text style={styles.cardText}>{proyecto.description || 'Sin descripción.'}</Text>
      )}
    </Card>
  );

  const renderContractInfo = () => (
    <Card padding="md" style={!isMobile && { flex: 1.2, minWidth: 220 }}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithSuccess}>
          <Text style={styles.cardTitle}>Referencia Contrato</Text>
          {showContractInfoSuccess && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
        </View>
        {canEdit && !isEditingContractInfo && (
          <TouchableOpacity onPress={() => {
            setTempContractNumber(proyecto.contractNumber || '');
            setTempStartDate(proyecto.startDate || '');
            setTempEndDate(proyecto.endDate || '');
            setIsEditingContractInfo(true);
          }} style={styles.editBtn}>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {isEditingContractInfo ? (
        <View style={styles.gapContainer}>
          <Text style={styles.fieldLabel}>Referencia (Alfanumérico):</Text>
          <TextInput style={styles.inlineInput} value={tempContractNumber} onChangeText={setTempContractNumber} placeholder="Ref..." />
          <Text style={styles.fieldLabel}>Fecha Inicio:</Text>
          <TextInput style={styles.inlineInput} value={tempStartDate} onChangeText={setTempStartDate} placeholder="YYYY-MM-DD" />
          <Text style={styles.fieldLabel}>Fecha Fin:</Text>
          <TextInput style={styles.inlineInput} value={tempEndDate} onChangeText={setTempEndDate} placeholder="YYYY-MM-DD" />
          <View style={[styles.actionsRow, { marginTop: 8 }]}>
            <Button label="Cancelar" variant="secondary" size="sm" onPress={() => setIsEditingContractInfo(false)} disabled={updatingContractInfo} />
            <Button label="Guardar" size="sm" loading={updatingContractInfo} onPress={handleSaveContractInfo} disabled={updatingContractInfo} />
          </View>
        </View>
      ) : (
        <View style={styles.gapContainer}>
          <Text style={styles.cardText}>Ref: <Text style={styles.highlightText}>{proyecto.contractNumber || 'N/A'}</Text></Text>
          <Text style={styles.cardText}>Fecha Inicio: <Text style={styles.highlightText}>{proyecto.startDate || 'N/A'}</Text></Text>
          <Text style={styles.cardText}>Fecha Fin: <Text style={styles.highlightText}>{proyecto.endDate || 'N/A'}</Text></Text>
        </View>
      )}
    </Card>
  );

  const renderContractObj = () => (
    <Card padding="md" style={!isMobile && { flex: 2, minWidth: 280 }}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithSuccess}>
          <Text style={styles.cardTitle}>Objeto del Contrato</Text>
          {showContractObjSuccess && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
        </View>
        {canEdit && !isEditingContractObj && (
          <TouchableOpacity onPress={() => { setTempContractObject(proyecto.contractObject || ''); setIsEditingContractObj(true); }} style={styles.editBtn}>
            <Ionicons name="create-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {isEditingContractObj ? (
        <View style={styles.flexColumn}>
          <TextInput
            style={[styles.cardTextArea, !isMobile && { flex: 1, minHeight: 100 }]}
            multiline
            value={tempContractObject}
            onChangeText={setTempContractObject}
            placeholder="Escribe el objeto del contrato..."
          />
          <View style={styles.actionsRow}>
            <Button label="Cancelar" variant="secondary" size="sm" onPress={() => setIsEditingContractObj(false)} disabled={updatingContractObj} />
            <Button label="Guardar" size="sm" loading={updatingContractObj} onPress={handleSaveContractObj} disabled={updatingContractObj} />
          </View>
        </View>
      ) : (
        <Text style={styles.cardText}>{proyecto.contractObject || 'Sin objeto del contrato.'}</Text>
      )}
    </Card>
  );

  if (isMobile) {
    return (
      <View style={styles.mobileContainer}>
        {(canEdit || proyecto.description) && renderDesc()}
        {renderContractInfo()}
        {(canEdit || proyecto.contractObject) && renderContractObj()}
      </View>
    );
  }

  return (
    <View style={styles.desktopContainer}>
      {(canEdit || proyecto.description) && renderDesc()}
      {renderContractInfo()}
      {(canEdit || proyecto.contractObject) && renderContractObj()}
    </View>
  );
};

const styles = StyleSheet.create({
  mobileContainer: { gap: spacing.md, marginBottom: spacing.lg, width: '100%' },
  desktopContainer: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.lg, width: '100%', alignItems: 'stretch' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  titleWithSuccess: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontFamily: typography.fontFamily, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  editBtn: { padding: 4 },
  flexColumn: { gap: spacing.sm, flex: 1 },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cardTextArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontFamily: typography.fontFamily,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: '#ffffff',
    minHeight: 80,
    textAlignVertical: 'top',
  } as any,
  cardText: { fontFamily: typography.fontFamily, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  gapContainer: { gap: spacing.xs },
  fieldLabel: { fontFamily: typography.fontFamily, fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 4 },
  inlineInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontFamily: typography.fontFamily,
    fontSize: 12,
    color: colors.textPrimary,
    backgroundColor: '#ffffff',
  } as any,
  highlightText: { fontWeight: '600', color: colors.textPrimary },
});
