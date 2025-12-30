import { Outlet } from 'react-router-dom';

import { GlobalSpotlight } from '@/components/ui/composites/Spotlight';
import { AuthProvider } from '@/providers/AuthProvider';

/**
 * 애플리케이션의 루트 레이아웃
 * 모든 페이지에 공통으로 적용되는 레이아웃
 */
const RootLayout = () => {
  return (
    <AuthProvider>
      <Outlet />
      <GlobalSpotlight />
    </AuthProvider>
  );
};

export default RootLayout;
