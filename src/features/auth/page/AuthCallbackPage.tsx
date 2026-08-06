import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/router/constants';
import { trackEvent } from '@/lib/mixpanel';
import { supabase } from '@/lib/supabase';
import { authService } from '@/shared/api/services/auth/authService';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { SplashLoading } from '@/shared/ui/composites/SplashLoading';
import { removeUtmParamsFromCurrentUrl } from '@/shared/utils/utm';
import { useAuthStore } from '@/stores/authStore';
import { getUtmParamsForUrl, useUtmStore } from '@/stores/utmStore';

/**
 * OAuth 콜백 페이지
 * Google/Kakao OAuth 인증 후 리다이렉트 대상.
 * 일부 Supabase 메일 템플릿이 비밀번호 재설정 링크도 이 경로로 보내기 때문에,
 * recovery 컨텍스트면 /auth/reset-password 로 우회시킨다.
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const initialize = useAuthStore((state) => state.initialize);
  const initializeUtm = useUtmStore((state) => state.initializeUtm);

  useEffect(() => {
    const initialHash = window.location.hash;
    const isRecoveryHash =
      initialHash.includes('type=recovery') ||
      new URLSearchParams(window.location.search).get('type') === 'recovery';

    const currentUtmSearch = () => {
      const utmParams = getUtmParamsForUrl();
      return utmParams ? `?${utmParams}` : '';
    };

    let handled = false;
    const redirectToReset = () => {
      if (handled) return;
      handled = true;
      navigate(
        {
          pathname: ROUTES.PASSWORD_RESET,
          search: currentUtmSearch(),
          hash: initialHash,
        },
        { replace: true }
      );
    };

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        redirectToReset();
      }
    });

    const handleCallback = async () => {
      initializeUtm(window.location.search);

      if (isRecoveryHash) {
        redirectToReset();
        return;
      }

      try {
        const session = await authService.getSession();

        if (session) {
          const method = session.user?.app_metadata?.provider ?? 'unknown';
          trackEvent(MixpanelEvent.LoginOAuthCallback, { method });
          await initialize();
          useUtmStore.getState().stopUrlPropagation();
          removeUtmParamsFromCurrentUrl();
          trackEvent(MixpanelEvent.LoginSuccess, { method });
          navigate(
            { pathname: ROUTES.ROOT, search: currentUtmSearch() },
            { replace: true }
          );
        } else {
          trackEvent(MixpanelEvent.LoginFailed, {
            method: 'oauth',
            error: 'no_session',
          });
          navigate(
            { pathname: ROUTES.AUTH, search: currentUtmSearch() },
            { replace: true }
          );
        }
      } catch (error) {
        trackEvent(MixpanelEvent.LoginFailed, {
          method: 'oauth',
          error: error instanceof Error ? error.message : 'callback_error',
        });
        console.error('OAuth callback error:', error);
        navigate(
          { pathname: ROUTES.AUTH, search: currentUtmSearch() },
          { replace: true }
        );
      }
    };

    handleCallback();

    return () => {
      data.subscription.unsubscribe();
    };
  }, [initialize, initializeUtm, navigate]);

  return <SplashLoading visible />;
};

export default AuthCallbackPage;
