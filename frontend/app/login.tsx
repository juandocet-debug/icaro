import React from 'react';
import { LoginScreen } from '../src/modules/auth/presentation/LoginScreen';
import { LoginMobileScreen } from '../src/modules/auth/presentation/mobile/LoginMobileScreen';
import { useIsMobile } from '../src/shared/hooks/useIsMobile';

export default function LoginPage() {
  const isMobile = useIsMobile();
  return isMobile ? <LoginMobileScreen /> : <LoginScreen />;
}
