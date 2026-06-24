import { useLocalSearchParams } from 'expo-router';
import { EvidenciasDashboardScreen } from '../../../src/modules/proyectos/presentation/EvidenciasDashboardScreen';

export default function ProyectoDashboardEvidenciasPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EvidenciasDashboardScreen proyectoId={id} />;
}
