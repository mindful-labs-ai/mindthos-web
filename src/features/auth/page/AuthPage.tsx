import React from 'react';

import { trackEvent } from '@/lib/mixpanel';
import { authService } from '@/shared/api/services/auth/authService';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { GoogleIcon, KakaoIcon } from '@/shared/icons';
import EmailVerificationStep from '@/widgets/auth/EmailVerificationStep';
import PasswordResetRequestStep from '@/widgets/auth/PasswordResetRequestStep';
import SignInForm from '@/widgets/auth/SignInForm';
import SignUpForm from '@/widgets/auth/SignUpForm';

type FormStateType =
  | 'signIn'
  | 'signUp'
  | 'emailVerification'
  | 'passwordResetRequest';

const AuthPage = () => {
  const [formState, setFormState] = React.useState<FormStateType>('signIn');
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isKakaoLoading, setIsKakaoLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleStateChange = () => {
    const target = formState === 'signIn' ? 'signUp' : 'signIn';
    trackEvent(MixpanelEvent.AuthFormSwitch, {
      from: formState,
      to: target,
    });
    setFormState(target);
  };

  const handleSignupSuccess = (email: string) => {
    setPendingEmail(email);
    setFormState('emailVerification');
  };

  const handleBackToLogin = () => {
    setPendingEmail(null);
    setFormState('signIn');
  };

  const handleForgotPassword = () => {
    trackEvent(MixpanelEvent.AuthFormSwitch, {
      from: formState,
      to: 'passwordResetRequest',
    });
    setFormState('passwordResetRequest');
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      trackEvent(MixpanelEvent.LoginAttempt, { method: 'google' });
      await authService.loginWithGoogle();
    } catch (err) {
      trackEvent(MixpanelEvent.LoginFailed, {
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

  const handleKakaoLogin = async () => {
    setError('');
    setIsKakaoLoading(true);

    try {
      trackEvent(MixpanelEvent.LoginAttempt, { method: 'kakao' });
      await authService.loginWithKakao();
    } catch (err) {
      trackEvent(MixpanelEvent.LoginFailed, {
        method: 'kakao',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(
        err instanceof Error
          ? err.message
          : '카카오 로그인에 실패했습니다. 다시 시도해주세요.'
      );
      setIsKakaoLoading(false);
    }
  };
  return (
    <div className="flex h-full w-full">
      <div className="flex flex-1 flex-col bg-white p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <img
            src="/logo_mindthos_kr.webp"
            alt="마음토스 로고"
            className="main-logo-size"
          />
          <a
            href="https://open.kakao.com/me/Mindthos"
            target="_blank"
            rel="noopener noreferrer"
            className="] rounded-md border border-grey-40 px-6 py-1.5 text-m font-medium text-grey-70 transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-100"
          >
            문의하기
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center py-8 md:p-8">
          <div className="w-full max-w-md">
            {/* Title Section */}
            <div className="mb-9 flex flex-col gap-3 text-left">
              <h1 className="text-2xl font-emphasize leading-snug text-grey-100 md:text-4xl">
                늘 곁에있는 AI 슈퍼바이저,
                <br />
                <span className="font-headline text-green-80">마음토스</span>
              </h1>
              <p className="text-m font-sub text-grey-70">
                상담사의 시간을 되찾고 성장을 돕습니다.
              </p>
            </div>

            {/* Form Section */}
            <div className="w-full">
              {error && <div className="auth-error-area">{error}</div>}

              {formState === 'emailVerification' && pendingEmail ? (
                <EmailVerificationStep
                  email={pendingEmail}
                  onBackToLogin={handleBackToLogin}
                />
              ) : formState === 'passwordResetRequest' ? (
                <PasswordResetRequestStep
                  onBackToLogin={handleBackToLogin}
                />
              ) : (
                <>
                  {formState === 'signIn' ? (
                    <SignInForm onForgotPassword={handleForgotPassword} />
                  ) : (
                    <SignUpForm onSignupSuccess={handleSignupSuccess} />
                  )}

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-grey-40" />
                    </div>
                    <div className="relative flex justify-center text-m font-sub uppercase">
                      <span className="bg-white px-2 text-grey-60">또는</span>
                    </div>
                  </div>

                  {/* OAuth Login Buttons */}
                  <div className="mb-6 flex flex-col gap-3">
                    <button
                      className="flex h-12 w-full items-center justify-center rounded-md border border-grey-100 bg-white text-m font-headline transition-opacity lg:hover:opacity-60"
                      onClick={handleGoogleLogin}
                      disabled={isGoogleLoading}
                    >
                      <GoogleIcon size={20} className="mr-2" />
                      {isGoogleLoading
                        ? 'Google에 연결 중...'
                        : 'Google로 계속하기'}
                    </button>
                    <button
                      className="flex h-12 w-full items-center justify-center rounded-md bg-[#FEE500] text-m font-headline transition-opacity lg:hover:opacity-60"
                      onClick={handleKakaoLogin}
                      disabled={isKakaoLoading}
                    >
                      <KakaoIcon size={20} className="mr-2" />
                      {isKakaoLoading
                        ? '카카오에 연결 중...'
                        : '카카오로 계속하기'}
                    </button>
                    {formState === 'signUp' && (
                      <p className="mt-2 text-center text-xs text-grey-80">
                        소셜 로그인으로 회원가입 시 위의 약관에 대한 동의로
                        취급 됩니다.
                      </p>
                    )}
                  </div>

                  <div className="mt-10 text-center font-medium text-green-80 transition-opacity lg:hover:opacity-80">
                    <button
                      type="button"
                      onClick={handleStateChange}
                      className="text-m font-medium text-green-80 lg:hover:opacity-80"
                    >
                      {formState === 'signIn'
                        ? '아직 계정이 없으신가요? 회원가입하기'
                        : '이미 계정이 있으신가요? 로그인하기'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border">
          <p className="pt-6 text-start text-sm text-grey-60">
            Copyright 2025. Mindful Labs Inc. All rights reserved.
          </p>
        </div>
      </div>
      <div className="hidden flex-1 items-center bg-grey-20 lg:flex">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-y-8 p-8">
          <img
            src="/auth-page-image.png"
            alt="Mindthos 플랫폼 미리보기"
            className="object-contain"
          />
          <div className="flex flex-col gap-y-3 text-center">
            <h2 className="text-2xl font-emphasize text-grey-100">
              상담사에게 꼭 필요한 기능을 만나보세요.
            </h2>
            <p className="text-l font-sub text-grey-70">
              막막했던 사례 개념화부터 번거로운 행정 업무까지.
              <br />
              마음토스는 상담사가 온전히 내담자와 자신의 성장에
              <br />
              집중할 수 있도록 돕는 임상 전문 AI 도구입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
