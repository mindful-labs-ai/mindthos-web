import { Navigate } from 'react-router-dom';

import { useTermsCheck } from '@/features/terms-agreement/hooks/useTermsCheck';
import { SplashLoading } from '@/shared/ui/composites/SplashLoading';
import { useAuthStore } from '@/stores/authStore';
import { useUtmStore } from '@/stores/utmStore';
import { GlobalModalContainer } from '@/widgets/common/GlobalModalContainer';

import { ROUTES } from '../constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipTermsCheck?: boolean;
}

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 *
 * 책임:
 * - 인증 상태 확인 및 미인증 시 리다이렉트
 * - 약관 동의 여부 확인 및 미동의 시 약관 동의 페이지로 리다이렉트
 * - 모바일 라우트 가드
 * - 전역 모달 컨테이너 렌더링 (Portal 기반, 초기화 로직 포함)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  skipTermsCheck = false,
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const utmParams = useUtmStore((state) => state.utmParams);
  const { agreedAll, isLoading: isTermsLoading } = useTermsCheck(
    isAuthenticated && !skipTermsCheck
  );

  const isBusy =
    isLoading || (isAuthenticated && !skipTermsCheck && isTermsLoading);

  if (!isBusy && !isAuthenticated) {
    const search = utmParams ? `?${utmParams}` : '';
    return <Navigate to={{ pathname: ROUTES.AUTH, search }} replace />;
  }

  if (!isBusy && !skipTermsCheck && !agreedAll) {
    const search = utmParams ? `?${utmParams}` : '';
    return (
      <Navigate to={{ pathname: ROUTES.TERMS_AGREEMENT, search }} replace />
    );
  }

  return (
    <>
      {!isBusy && children}
      {!isBusy && <GlobalModalContainer />}
      <SplashLoading visible={isBusy} />
    </>
  );
};
