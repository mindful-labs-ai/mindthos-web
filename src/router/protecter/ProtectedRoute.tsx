import { Navigate } from 'react-router-dom';

import { AuthenticatedInitialize } from '@/router/protecter/AuthenticatedInitialize';
import { useMobileRouteGuard } from '@/shared/hooks/useMobileRouteGuard';
import { useAuthStore } from '@/stores/authStore';

import { ROUTES } from '../constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

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
      <AuthenticatedInitialize />
      {children}
    </>
  );
};
