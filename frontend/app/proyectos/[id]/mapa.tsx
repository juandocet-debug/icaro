import { useLocalSearchParams } from 'expo-router';
import { ProyectoMapaScreen } from '../../../src/modules/proyectos/presentation/ProyectoMapaScreen';

export default function ProyectoMapaPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProyectoMapaScreen proyectoId={id} />;
}
