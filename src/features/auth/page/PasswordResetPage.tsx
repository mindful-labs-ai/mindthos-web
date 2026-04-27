import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@/app/router/constants';
import { supabase } from '@/lib/supabase';
import { authService } from '@/shared/api/services/auth/authService';
import { Button } from '@/shared/ui/atoms/Button';
import { SplashLoading } from '@/shared/ui/composites/SplashLoading';
import PasswordResetForm from '@/widgets/auth/PasswordResetForm';

type PageStatus = 'checking' | 'ready' | 'invalid' | 'succeeded';

const PasswordResetPage = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<PageStatus>('checking');

  useEffect(() => {
    const hadRecoveryHash = window.location.hash.includes('type=recovery');
    let settled = false;

    const settle = (next: PageStatus) => {
      if (settled) return;
      settled = true;
      setStatus(next);
    };

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        settle('ready');
      }
    });

    const checkSession = async () => {
      const session = await authService.getSession();
      if (session) {
        settle('ready');
      } else if (!hadRecoveryHash) {
        settle('invalid');
      }
    };

    checkSession();

    const fallbackTimer = setTimeout(() => settle('invalid'), 3000);

    return () => {
      data.subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleSuccess = async () => {
    setStatus('succeeded');
    await authService.logout();
  };

  const handleGoToLogin = () => {
    navigate(ROUTES.AUTH, { replace: true });
  };

  return (
    <div className="flex h-full w-full">
      <div className="flex flex-1 flex-col bg-white p-6">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <img
            src="/logo_mindthos_kr.webp"
            alt="마음토스 로고"
            className="main-logo-size"
          />
        </div>

        <div className="flex flex-1 items-center justify-center py-8 md:p-8">
          <div className="w-full max-w-md">
            {status === 'checking' && <SplashLoading visible />}

            {status === 'ready' && (
              <>
                <div className="mb-9 flex flex-col gap-3 text-left">
                  <h1 className="text-2xl font-emphasize leading-snug text-grey-100 md:text-3xl">
                    새 비밀번호를 설정해주세요
                  </h1>
                  <p className="text-m font-sub text-grey-70">
                    6자 이상의 새로운 비밀번호를 입력해 주세요.
                  </p>
                </div>
                <PasswordResetForm onSuccess={handleSuccess} />
              </>
            )}

            {status === 'invalid' && (
              <div className="rounded-xl bg-white p-8 text-center">
                <h2 className="mb-3 text-xl font-emphasize text-grey-100">
                  링크가 만료됐거나 유효하지 않아요
                </h2>
                <p className="mb-6 text-sm text-grey-70">
                  링크가 만료되었거나 이미 사용된 것 같아요.
                  <br />
                  비밀번호 재설정을 다시 요청해주세요.
                </p>
                <Button
                  onClick={handleGoToLogin}
                  tone="primary"
                  variant="solid"
                  className="w-full"
                >
                  로그인 페이지로 돌아가기
                </Button>
              </div>
            )}

            {status === 'succeeded' && (
              <div className="rounded-xl bg-white p-8 text-center">
                <h2 className="mb-3 text-xl font-emphasize text-grey-100">
                  비밀번호를 변경했어요
                </h2>
                <p className="mb-6 text-sm text-grey-70">
                  새 비밀번호로 다시 로그인해 주세요.
                </p>
                <Button
                  onClick={handleGoToLogin}
                  tone="primary"
                  variant="solid"
                  className="w-full"
                >
                  로그인하기
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border">
          <p className="pt-6 text-start text-sm text-grey-60">
            Copyright 2025. Mindful Labs Inc. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
