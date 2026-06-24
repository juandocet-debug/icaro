import { useLocalSearchParams } from 'expo-router';
import { EditarAccionScreen } from '../../../../../src/modules/proyectos/presentation/EditarAccionScreen';

export default function EditarAccionPage() {
  const { id, componenteId, accionId } = useLocalSearchParams<{ id: string; componenteId: string; accionId: string }>();
  return <EditarAccionScreen proyectoId={id} componenteId={componenteId} accionId={accionId} />;
}
