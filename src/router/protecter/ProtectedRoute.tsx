import { Navigate } from 'react-router-dom';

import { GlobalModalContainer } from '@/components/GlobalModalContainer';
import { useMobileRouteGuard } from '@/shared/hooks/useMobileRouteGuard';
import { useAuthStore } from '@/stores/authStore';

import { ROUTES } from '../constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 *
 * 책임:
 * - 인증 상태 확인 및 미인증 시 리다이렉트
 * - 모바일 라우트 가드
 * - 전역 모달 컨테이너 렌더링 (Portal 기반, 초기화 로직 포함)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // 모바일/태블릿에서 "/" 외 라우트 접근 시 자동 리다이렉트
  useMobileRouteGuard();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="text-sm text-muted">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH} replace />;
  }

  return (
    <>
      {children}
      <GlobalModalContainer />
    </>
  );
};
