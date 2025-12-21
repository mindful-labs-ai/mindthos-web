import React from 'react';

import { Button, Text, Title } from '@/components/ui';
import { trackEvent } from '@/lib/mixpanel';
import { authService } from '@/services/auth/authService';
import { ArrowRightIcon } from '@/shared/icons';

import SignInForm from '../components/SignInForm';
import SignUpForm from '../components/SignUpForm';

type FormStateType = 'signIn' | 'signUp';

const AuthPage = () => {
  const [formState, setFormState] = React.useState<FormStateType>('signIn');
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleStateChange = () => {
    if (formState === 'signIn') setFormState('signUp');
    if (formState === 'signUp') setFormState('signIn');
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      trackEvent('login_attempt', { method: 'google' });
      await authService.loginWithGoogle();
      // OAuth는 리다이렉트로 처리됨 (성공 트래킹은 OAuth 콜백에서 처리)
    } catch (err) {
      trackEvent('login_failed', {
        method: 'google',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(
        err instanceof Error
          ? err.message
          : 'Google 로그인에 실패했습니다. 다시 시도해주세요.'
      );
      setIsGoogleLoading(false);
    }
  };
  return (
    <div className="flex h-full w-full">
      <div className="flex flex-1 flex-col bg-bg p-4 pb-2">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <img
            src="/logo_mindthos_kr.webp"
            alt="마음토스 로고"
            className="h-8 w-auto"
          />
          <Button
            iconRight={<ArrowRightIcon size={18} />}
            size="md"
            tone="secondary"
            variant="outline"
          >
            문의하기
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Title Section */}
            <div className="mb-8 text-left">
              <Title
                as="h1"
                className="mb-4 text-3xl font-medium leading-normal"
              >
                상담에 딱 맞는 AI 노트,
                <br />
                <span className="font-semibold text-primary-500">마음토스</span>
              </Title>
              <Text className="text-sm text-muted">
                대화를 기록하고 과학적인 분석으로 상담의 퀄리티를 높이세요.
              </Text>
            </div>

            {/* Form Section */}
            <div className="w-full">
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              {formState === 'signIn' ? (
                <SignInForm />
              ) : formState === 'signUp' ? (
                <SignUpForm />
              ) : (
                <div>unexpected state</div>
              )}

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-bg px-2 text-muted">또는</span>
                </div>
              </div>

              {/* Google Login Button */}
              <div className="mb-6">
                <Button
                  size="lg"
                  variant="outline"
                  tone="secondary"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    className="mr-2"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {isGoogleLoading
                    ? 'Google 로그인 중...'
                    : formState === 'signIn'
                      ? 'Google로 계속하기'
                      : 'Google로 회원가입'}
                </Button>
                {formState === 'signUp' && (
                  <Text className="mt-2 text-center text-xs text-muted">
                    Google로 회원가입 시에도 위의 약관에 동의하셔야 합니다.
                  </Text>
                )}
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleStateChange}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  {formState === 'signIn'
                    ? '계정이 없으신가요? 회원가입하기'
                    : '이미 계정이 있으신가요? 로그인하기'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border">
          <Text muted className="py-4 text-center text-[12px]">
            © 2025 Mindfullabs. All rights reserved.
          </Text>
        </div>
      </div>
      <div className="hidden flex-1 items-center bg-bg-subtle lg:flex">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-y-8 p-8">
          <img
            src="/auth-page-image.webp"
            alt="Mindthos 플랫폼 미리보기"
            className="object-contain"
          />
          <div className="flex flex-col gap-y-3">
            <Title as="h2" className="text-xl">
              상담에 집중하세요, 분석과 정리는 AI가 합니다.
            </Title>
            <Text as="p" className="text-base text-muted">
              대화 기록과 상담 노트를 자동 작성하고
              <br />
              감정 흐름과 말의 구조를 정량적으로 분석해 드립니다.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
