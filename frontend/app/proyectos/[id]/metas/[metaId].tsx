import { useLocalSearchParams } from 'expo-router';
import { MetaDetailScreen } from '../../../../src/modules/proyectos/presentation/MetaDetailScreen';

export default function MetaDetailPage() {
  const { id, metaId } = useLocalSearchParams<{ id: string; metaId: string }>();
  return <MetaDetailScreen proyectoId={id} metaId={metaId} />;
}
