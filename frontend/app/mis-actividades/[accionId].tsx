import { useLocalSearchParams } from 'expo-router';
import { MisActividadesScreen } from '../../src/modules/proyectos/presentation/MisActividadesScreen';
import { MisActividadesMobileScreen } from '../../src/modules/proyectos/presentation/mobile/MisActividadesMobileScreen';
import { useIsMobile } from '../../src/shared/hooks/useIsMobile';

export default function MisActividadesDetailPage() {
  const { accionId } = useLocalSearchParams<{ accionId: string }>();
  const isMobile = useIsMobile();
  return isMobile ? (
    <MisActividadesMobileScreen selectedAccionId={accionId} />
  ) : (
    <MisActividadesScreen selectedAccionId={accionId} />
  );
}
