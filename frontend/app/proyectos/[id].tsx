import { useLocalSearchParams } from 'expo-router';
import { ProyectoDetailScreen } from '../../src/modules/proyectos/presentation/ProyectoDetailScreen';
export default function ProyectoDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProyectoDetailScreen proyectoId={id} />;
}
