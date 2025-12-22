import { Outlet, useLocation } from 'react-router-dom';

import { OnboardingModal } from '@/feature/onboarding/components/OnboardingModal';
import { AuthProvider } from '@/providers/AuthProvider';

/**
 * 애플리케이션의 루트 레이아웃
 * 모든 페이지에 공통으로 적용되는 레이아웃
 */
const RootLayout = () => {
  const location = useLocation();

  const shouldShowOnboarding =
    !location.pathname.startsWith('/auth/verify-email') &&
    !location.pathname.startsWith('/auth');

  return (
    <AuthProvider>
      <Outlet />
      {shouldShowOnboarding && <OnboardingModal />}
    </AuthProvider>
  );
};

export default RootLayout;
