import React from 'react';

import { passwordResetRequestSchema } from '@/features/auth/schemas/passwordResetRequestSchema';
import { cn } from '@/lib/cn';
import { trackEvent } from '@/lib/mixpanel';
import { authService } from '@/shared/api/services/auth/authService';
import { AuthError, AuthErrorCode } from '@/shared/api/services/auth/types';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { GoogleIcon, KakaoIcon, MailIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { FormField } from '@/shared/ui/composites/FormField';
import { useToast } from '@/shared/ui/composites/Toast';

interface Props {
  onBackToLogin: () => void;
}

type ViewState =
  | { status: 'form'; error: string }
  | {
      status: 'socialOnly';
      email: string;
      providerLabel: string;
      providers: string[];
    }
  | { status: 'notFound'; email: string }
  | { status: 'sent'; email: string; resendError: string; resendInfo: string };

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  kakao: '카카오',
  apple: 'Apple',
  github: 'GitHub',
};

const formatProviderLabel = (providers: string[]): string => {
  const labels = providers
    .filter((p) => p !== 'email')
    .map((p) => PROVIDER_LABELS[p] ?? p);
  if (labels.length === 0) return '소셜 로그인';
  if (labels.length === 1) return labels[0];
  return labels.join(' / ');
};

const RATE_LIMIT_TOAST = {
  title: '요청이 너무 많습니다',
  description: '잠시 후 다시 시도해주세요.',
} as const;

const isRateLimitError = (error: unknown): error is AuthError =>
  error instanceof AuthError &&
  error.code === AuthErrorCode.RATE_LIMIT_EXCEEDED;

const PasswordResetRequestStep = ({ onBackToLogin }: Props) => {
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [oauthPending, setOauthPending] = React.useState<string | null>(null);
  const [state, setState] = React.useState<ViewState>({
    status: 'form',
    error: '',
  });

  const handleOAuthLogin = async (provider: 'google' | 'kakao') => {
    setOauthPending(provider);
    trackEvent(MixpanelEvent.LoginAttempt, {
      method: provider,
      from: 'password_reset_social_only',
    });
    try {
      if (provider === 'google') {
        await authService.loginWithGoogle();
      } else {
        await authService.loginWithKakao();
      }
    } catch (err) {
      trackEvent(MixpanelEvent.LoginFailed, {
        method: provider,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      setOauthPending(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = passwordResetRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setState({
        status: 'form',
        error: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.',
      });
      return;
    }

    setIsSubmitting(true);
    trackEvent(MixpanelEvent.PasswordResetRequestAttempt, { method: 'email' });

    try {
      const authMethod = await authService.checkAuthMethod(email);

      if (!authMethod.exists) {
        trackEvent(MixpanelEvent.PasswordResetRequestFailed, {
          reason: 'not_found',
        });
        setState({ status: 'notFound', email });
        return;
      }

      if (!authMethod.hasPassword) {
        trackEvent(MixpanelEvent.PasswordResetRequestFailed, {
          reason: 'social_only',
          providers: authMethod.providers.join(','),
        });
        setState({
          status: 'socialOnly',
          email,
          providerLabel: formatProviderLabel(authMethod.providers),
          providers: authMethod.providers,
        });
        return;
      }

      await authService.requestPasswordReset(email);
      trackEvent(MixpanelEvent.PasswordResetRequestSuccess);
      setState({
        status: 'sent',
        email,
        resendError: '',
        resendInfo: '',
      });
    } catch (err) {
      trackEvent(MixpanelEvent.PasswordResetRequestFailed, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      if (isRateLimitError(err)) {
        toast(RATE_LIMIT_TOAST);
        setState({ status: 'form', error: '' });
        return;
      }
      setState({
        status: 'form',
        error:
          err instanceof Error
            ? err.message
            : '재설정 이메일 발송에 실패했습니다. 다시 시도해주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (state.status !== 'sent') return;
    setIsResending(true);
    setState({ ...state, resendError: '', resendInfo: '' });

    try {
      await authService.requestPasswordReset(state.email);
      trackEvent(MixpanelEvent.PasswordResetRequestSuccess, { resend: true });
      setState({
        ...state,
        resendInfo: '재설정 이메일을 다시 발송했습니다.',
        resendError: '',
      });
    } catch (err) {
      trackEvent(MixpanelEvent.PasswordResetRequestFailed, {
        resend: true,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      if (isRateLimitError(err)) {
        toast(RATE_LIMIT_TOAST);
        setState({ ...state, resendError: '', resendInfo: '' });
        return;
      }
      setState({
        ...state,
        resendError:
          err instanceof Error
            ? err.message
            : '이메일 발송에 실패했습니다. 다시 시도해주세요.',
        resendInfo: '',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (state.status === 'sent') {
    return (
      <div className="rounded-xl bg-white p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-80 p-4">
            <MailIcon className="h-12 w-12 text-grey-100" />
          </div>
        </div>

        <h2 className="mb-2">비밀번호 재설정 메일을 발송했습니다</h2>

        <p className="mb-6 text-grey-100">
          <span className="font-medium text-grey-100">{state.email}</span>로
          재설정 링크를 발송했습니다.
          <br />
          이메일의 링크를 클릭해 비밀번호를 재설정해주세요.
        </p>

        {(state.resendInfo || state.resendError) && (
          <div
            role={state.resendError ? 'alert' : 'status'}
            aria-live="polite"
            className={cn(
              'mb-4 rounded-md p-3 text-sm font-medium',
              state.resendError
                ? 'bg-red-20 text-red-80'
                : 'bg-green-50 text-green-80'
            )}
          >
            {state.resendError || state.resendInfo}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleResend}
            disabled={isResending}
            variant="outline"
            tone="neutral"
            className="w-full"
          >
            {isResending ? '발송 중...' : '재설정 이메일 다시 받기'}
          </Button>
          <Button
            onClick={onBackToLogin}
            variant="ghost"
            tone="neutral"
            className="w-full"
          >
            로그인 페이지로 돌아가기
          </Button>
        </div>

        <div className="mt-6 rounded-md bg-grey-20 p-4">
          <Text className="text-grey-100">
            💡 이메일이 보이지 않나요?
            <br />
            스팸 메일함을 확인하거나 위 버튼을 눌러 이메일을 다시 받아보세요.
          </Text>
        </div>
      </div>
    );
  }

  if (state.status === 'socialOnly') {
    const hasGoogle = state.providers.includes('google');
    const hasKakao = state.providers.includes('kakao');
    const hasKnownProvider = hasGoogle || hasKakao;
    const isOAuthBusy = oauthPending !== null;

    return (
      <div className="rounded-xl bg-white p-8 text-center">
        <h2 className="mb-3 text-xl font-emphasize text-grey-100">
          {state.providerLabel} 계정으로 가입된 이메일입니다
        </h2>
        <p className="mb-6 text-sm text-grey-70">
          <span className="font-medium text-grey-100">{state.email}</span>은(는){' '}
          {state.providerLabel}(으)로 가입된 계정입니다.
          <br />
          비밀번호 대신 {state.providerLabel} 로 접속해주세요.
        </p>
        <div className="space-y-3">
          {hasGoogle && (
            <button
              className="flex h-12 w-full items-center justify-center rounded-md border border-grey-100 bg-white text-m font-headline transition-opacity lg:hover:opacity-60 disabled:opacity-60"
              onClick={() => handleOAuthLogin('google')}
              disabled={isOAuthBusy}
            >
              <GoogleIcon size={20} className="mr-2" />
              {oauthPending === 'google'
                ? 'Google에 연결 중...'
                : 'Google로 계속하기'}
            </button>
          )}
          {hasKakao && (
            <button
              className="flex h-12 w-full items-center justify-center rounded-md bg-[#FEE500] text-m font-headline transition-opacity lg:hover:opacity-60 disabled:opacity-60"
              onClick={() => handleOAuthLogin('kakao')}
              disabled={isOAuthBusy}
            >
              <KakaoIcon size={20} className="mr-2" />
              {oauthPending === 'kakao'
                ? '카카오에 연결 중...'
                : '카카오로 계속하기'}
            </button>
          )}
          {!hasKnownProvider && (
            <Button
              onClick={onBackToLogin}
              tone="primary"
              variant="solid"
              className="w-full"
            >
              로그인 페이지로 돌아가기
            </Button>
          )}
          <Button
            onClick={() => setState({ status: 'form', error: '' })}
            variant="ghost"
            tone="neutral"
            className="w-full"
            disabled={isOAuthBusy}
          >
            다른 이메일로 재설정하기
          </Button>
        </div>
      </div>
    );
  }

  if (state.status === 'notFound') {
    return (
      <div className="rounded-xl bg-white p-8 text-center">
        <h2 className="mb-3 text-xl font-emphasize text-grey-100">
          가입되지 않은 이메일입니다
        </h2>
        <p className="mb-6 text-sm text-grey-70">
          <span className="font-medium text-grey-100">{state.email}</span>{' '}
          계정을 찾을 수 없습니다.
          <br />
          이메일 주소를 확인하거나 회원가입을 진행해주세요.
        </p>
        <div className="space-y-3">
          <Button
            onClick={() => setState({ status: 'form', error: '' })}
            tone="primary"
            variant="solid"
            className="w-full"
          >
            다른 이메일로 다시 시도
          </Button>
          <Button
            onClick={onBackToLogin}
            variant="ghost"
            tone="neutral"
            className="w-full"
          >
            로그인 페이지로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-left">
        <h2 className="text-xl font-emphasize text-grey-100">
          비밀번호 재설정
        </h2>
        <p className="mt-2 text-sm font-sub text-grey-70">
          가입 시 사용한 이메일을 입력하시면 재설정 링크를 보내드립니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {state.error && <div className="auth-error-area">{state.error}</div>}

        <FormField>
          <input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="auth-input"
            disabled={isSubmitting}
          />
        </FormField>

        <button type="submit" disabled={isSubmitting} className="auth-button">
          {isSubmitting ? '확인 중...' : '재설정 링크 받기'}
        </button>

        <Button
          type="button"
          onClick={onBackToLogin}
          variant="ghost"
          tone="neutral"
          className="w-full"
          disabled={isSubmitting}
        >
          로그인 페이지로 돌아가기
        </Button>
      </form>
    </div>
  );
};

export default PasswordResetRequestStep;
