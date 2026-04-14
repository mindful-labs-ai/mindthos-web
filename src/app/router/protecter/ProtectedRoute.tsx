import { Navigate } from 'react-router-dom';

import { useSignupCheck } from '@/features/auth/hooks/useSignupCheck';
import { useTermsCheck } from '@/features/terms-agreement/hooks/useTermsCheck';
import { SplashLoading } from '@/shared/ui/composites/SplashLoading';
import { useAuthStore } from '@/stores/authStore';
import { useUtmStore } from '@/stores/utmStore';
import { GlobalModalContainer } from '@/widgets/common/GlobalModalContainer';

import { ROUTES } from '../constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  skipTermsCheck?: boolean;
  skipSignupCheck?: boolean;
}

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 *
 * 책임:
 * - 인증 상태 확인 및 미인증 시 리다이렉트
 * - 약관 동의 여부 확인 및 미동의 시 약관 동의 페이지로 리다이렉트
 * - 휴대폰 인증(회원가입) 필요 여부 확인 및 미완료 시 회원가입 페이지로 리다이렉트
 * - 모바일 라우트 가드
 * - 전역 모달 컨테이너 렌더링 (Portal 기반, 초기화 로직 포함)
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  skipTermsCheck = false,
  skipSignupCheck = false,
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const utmParams = useUtmStore((state) => state.utmParams);
  const { agreedAll, isLoading: isTermsLoading } = useTermsCheck(
    isAuthenticated && !skipTermsCheck
  );

  // 약관 동의가 완료된 이후에만 회원가입 필요 여부를 체크한다.
  const shouldCheckSignup =
    isAuthenticated && !skipSignupCheck && !skipTermsCheck && agreedAll;
  const { required: signupRequired, isLoading: isSignupLoading } =
    useSignupCheck(shouldCheckSignup);

  const isBusy =
    isLoading ||
    (isAuthenticated && !skipTermsCheck && isTermsLoading) ||
    (shouldCheckSignup && isSignupLoading);

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

  if (!isBusy && shouldCheckSignup && signupRequired) {
    const search = utmParams ? `?${utmParams}` : '';
    return <Navigate to={{ pathname: ROUTES.USER_VERIFY, search }} replace />;
  }

  return (
    <>
      {!isBusy && children}
      {!isBusy && <GlobalModalContainer />}
      <SplashLoading visible={isBusy} />
    </>
  );
};
