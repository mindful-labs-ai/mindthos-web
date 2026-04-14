import { Navigate } from 'react-router-dom';

import { SplashLoading } from '@/shared/ui/composites/SplashLoading';
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

  if (!isLoading && isAuthenticated) {
    const search = utmParams ? `?${utmParams}` : '';
    return <Navigate to={{ pathname: ROUTES.ROOT, search }} replace />;
  }

  return (
    <>
      {!isLoading && children}
      <SplashLoading visible={isLoading} />
    </>
  );
};
