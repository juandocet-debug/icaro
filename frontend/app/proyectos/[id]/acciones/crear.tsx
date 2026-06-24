import { useLocalSearchParams } from 'expo-router';
import { CrearAccionScreen } from '../../../../src/modules/proyectos/presentation/CrearAccionScreen';

export default function CrearAccionPage() {
  const { id, componenteId } = useLocalSearchParams<{ id: string; componenteId: string }>();
  return <CrearAccionScreen proyectoId={id} componenteId={componenteId} />;
}
