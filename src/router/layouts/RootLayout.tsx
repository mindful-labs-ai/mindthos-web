import { Outlet } from 'react-router-dom';

import { GlobalSpotlight } from '@/components/ui/composites/Spotlight';
import { AuthProvider } from '@/providers/AuthProvider';
import { usePageViewTracking } from '@/shared/hooks/usePageViewTracking';

// RouterProvider 내부의 최상위 레이아웃 — useLocation 사용이 가능한 가장 상위 지점
const RootLayout = () => {
  // 모든 페이지(인증/비인증) 라우트 변경 시 mixpanel page_view 트래킹
  usePageViewTracking();

  return (
    <AuthProvider>
      <Outlet />
      <GlobalSpotlight />
    </AuthProvider>
  );
};

export default RootLayout;
