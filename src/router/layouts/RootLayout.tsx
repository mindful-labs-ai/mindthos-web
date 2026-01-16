import { Outlet } from 'react-router-dom';

import { GlobalSpotlight } from '@/components/ui/composites/Spotlight';
import { AuthProvider } from '@/providers/AuthProvider';

/**
 * 애플리케이션의 루트 레이아웃
 * 모든 페이지에 공통으로 적용되는 레이아웃
 *
 * DOM 계층 구조:
 * - AuthProvider: 인증 상태 관리
 * - Outlet: 라우터 기반 페이지 콘텐츠
 * - GlobalSpotlight: 튜토리얼 스포트라이트 (Portal)
 *
 * 전역 모달은 ProtectedRoute에서 Portal로 렌더링됨
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
