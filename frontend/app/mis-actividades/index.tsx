import { MisActividadesScreen } from '../../src/modules/proyectos/presentation/MisActividadesScreen';
import { MisActividadesMobileScreen } from '../../src/modules/proyectos/presentation/mobile/MisActividadesMobileScreen';
import { useIsMobile } from '../../src/shared/hooks/useIsMobile';

export default function MisActividadesPage() {
  const isMobile = useIsMobile();
  return isMobile ? <MisActividadesMobileScreen /> : <MisActividadesScreen />;
}
