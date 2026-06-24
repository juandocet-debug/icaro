import { PrimerIngresoScreen } from '../../src/modules/auth/presentation/PrimerIngresoScreen';
import { PrimerIngresoMobileScreen } from '../../src/modules/auth/presentation/mobile/PrimerIngresoMobileScreen';
import { useIsMobile } from '../../src/shared/hooks/useIsMobile';

export default function PrimerIngresoPage() {
  const isMobile = useIsMobile();
  return isMobile ? <PrimerIngresoMobileScreen /> : <PrimerIngresoScreen />;
}
