import { Navigate } from 'react-router-dom';

import { useAuthStore } from '@/stores/authStore';
import { useUtmStore } from '@/stores/utmStore';

import { ROUTES } from '../constants';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({
  children,
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const utmParams = useUtmStore((state) => state.utmParams);

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

  if (isAuthenticated) {
    const search = utmParams ? `?${utmParams}` : '';
    return <Navigate to={{ pathname: ROUTES.ROOT, search }} replace />;
  }

  return <>{children}</>;
};
