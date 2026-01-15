import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/router/constants';
import { authService } from '@/services/auth/authService';
import { useAuthStore } from '@/stores/authStore';

/**
 * OAuth 콜백 페이지
 * Google OAuth 인증 후 리다이렉트되는 페이지
 */
const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL 해시에서 세션 정보 확인
        const session = await authService.getSession();

        if (session) {
          // 세션이 있으면 사용자 정보 초기화
          await initialize();
          // 홈으로 리다이렉트
          navigate(ROUTES.ROOT, { replace: true });
        } else {
          // 세션이 없으면 로그인 페이지로
          navigate(ROUTES.AUTH, { replace: true });
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        // 에러 발생 시 로그인 페이지로
        navigate(ROUTES.AUTH, { replace: true });
      }
    };

    handleCallback();
  }, [initialize, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
