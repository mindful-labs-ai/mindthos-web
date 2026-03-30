import { useEffect } from 'react';

import { ROUTES } from '@/app/router/constants';
import { trackEvent } from '@/lib/mixpanel';
import { authService } from '@/shared/api/services/auth/authService';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { SplashLoading } from '@/shared/ui/composites/SplashLoading';
import { useAuthStore } from '@/stores/authStore';

/**
 * OAuth 콜백 페이지
 * Google OAuth 인증 후 리다이렉트되는 페이지
 */
const AuthCallbackPage = () => {
  const { navigateWithUtm } = useNavigateWithUtm();
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL 해시에서 세션 정보 확인
        const session = await authService.getSession();

        if (session) {
          const method =
            session.user?.app_metadata?.provider ?? 'unknown';
          trackEvent(MixpanelEvent.LoginOAuthCallback, { method });
          // 세션이 있으면 사용자 정보 초기화
          await initialize();
          trackEvent(MixpanelEvent.LoginSuccess, { method });
          // 홈으로 리다이렉트 (UTM 파라미터 자동 유지)
          navigateWithUtm(ROUTES.ROOT, { replace: true });
        } else {
          trackEvent(MixpanelEvent.LoginFailed, {
            method: 'oauth',
            error: 'no_session',
          });
          // 세션이 없으면 로그인 페이지로 (UTM 파라미터 유지)
          navigateWithUtm(ROUTES.AUTH, { replace: true });
        }
      } catch (error) {
        trackEvent(MixpanelEvent.LoginFailed, {
          method: 'oauth',
          error:
            error instanceof Error ? error.message : 'callback_error',
        });
        console.error('OAuth callback error:', error);
        // 에러 발생 시 로그인 페이지로 (UTM 파라미터 유지)
        navigateWithUtm(ROUTES.AUTH, { replace: true });
      }
    };

    handleCallback();
  }, [initialize, navigateWithUtm]);

  return <SplashLoading visible />;
};

export default AuthCallbackPage;
