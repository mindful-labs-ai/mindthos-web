import { useEffect } from 'react';

import { Outlet, useLocation } from 'react-router-dom';

import { GlobalSpotlight } from '@/components/ui/composites/Spotlight';
import { AuthProvider } from '@/providers/AuthProvider';
import { usePageViewTracking } from '@/shared/hooks/usePageViewTracking';
import { useUtmStore } from '@/stores/utmStore';

// RouterProvider 내부의 최상위 레이아웃 — useLocation 사용이 가능한 가장 상위 지점
const RootLayout = () => {
  const location = useLocation();
  const initializeUtm = useUtmStore((state) => state.initializeUtm);

  // 모든 페이지(인증/비인증) 라우트 변경 시 mixpanel page_view 트래킹
  usePageViewTracking();

  // 첫 진입 시 UTM 파라미터 저장 (세션 스토리지에 저장되어 유지됨)
  useEffect(() => {
    initializeUtm(location.search);
  }, [initializeUtm, location.search]);

  return (
    <AuthProvider>
      <Outlet />
      <GlobalSpotlight />
    </AuthProvider>
  );
};

export default RootLayout;
