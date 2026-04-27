import React from 'react';

import { getTermsRoute, TERMS_TYPES } from '@/app/router/constants';
import { signupSchema } from '@/features/auth/schemas/signupSchema';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { HyperLink } from '@/shared/ui';
import { CheckBox } from '@/shared/ui/atoms/CheckBox';
import { FormField } from '@/shared/ui/composites/FormField';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  onSignupSuccess: (email: string) => void;
}

const PASSWORD_MATCH_DEBOUNCE_MS = 300;

const SignUpForm = ({ onSignupSuccess }: Props) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordConfirm, setPasswordConfirm] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [privacyAccepted, setPrivacyAccepted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const signup = useAuthStore((state) => state.signup);

  const debouncedPassword = useDebouncedValue(
    password,
    PASSWORD_MATCH_DEBOUNCE_MS
  );
  const debouncedPasswordConfirm = useDebouncedValue(
    passwordConfirm,
    PASSWORD_MATCH_DEBOUNCE_MS
  );

  const passwordMatchState: 'idle' | 'match' | 'mismatch' =
    React.useMemo(() => {
      if (!debouncedPasswordConfirm) return 'idle';
      return debouncedPassword === debouncedPasswordConfirm
        ? 'match'
        : 'mismatch';
    }, [debouncedPassword, debouncedPasswordConfirm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = signupSchema.safeParse({
      email,
      password,
      passwordConfirm,
      termsAccepted,
      privacyAccepted,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '입력값을 확인해 주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    trackEvent(MixpanelEvent.SignupAttempt, { method: 'email' });

    try {
      await signup(email, password, { termsAccepted, privacyAccepted });
      trackEvent(MixpanelEvent.SignupSuccess, { method: 'email' });
      onSignupSuccess(email);
    } catch (err) {
      trackEvent(MixpanelEvent.SignupFailed, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(
        err instanceof Error
          ? err.message
          : '회원가입을 완료하지 못했어요. 입력 정보를 확인하고 다시 시도해 주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    !termsAccepted ||
    !privacyAccepted ||
    isSubmitting ||
    passwordMatchState !== 'match';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="auth-error-area">{error}</div>}

      <div className="space-y-4">
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
        <FormField>
          <input
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="auth-input"
            disabled={isSubmitting}
          />
        </FormField>
        <FormField>
          <input
            type="password"
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className="auth-input"
            disabled={isSubmitting}
          />
          {passwordMatchState === 'mismatch' && (
            <p className="mt-1 text-xs font-medium text-red-80">
              비밀번호가 같지 않아요
            </p>
          )}
          {passwordMatchState === 'match' && (
            <p className="mt-1 text-xs font-medium text-green-80">
              비밀번호가 일치해요
            </p>
          )}
        </FormField>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <CheckBox
              id="terms"
              tone="neutral"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={isSubmitting}
            />
            <label htmlFor="terms" className="text-sm font-sub text-grey-80">
              <span>서비스 이용약관에 동의해요.</span>
              <HyperLink
                href={getTermsRoute(TERMS_TYPES.SERVICE)}
                external
                underline="hover"
                className="ml-1 text-green-80 lg:hover:text-green-40"
              >
                [보기]
              </HyperLink>
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <CheckBox
              id="privacy"
              tone="neutral"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              disabled={isSubmitting}
            />
            <label htmlFor="privacy" className="text-sm font-sub text-grey-80">
              <span>개인정보 처리방침에 동의해요.</span>
              <HyperLink
                href={getTermsRoute(TERMS_TYPES.PRIVACY)}
                external
                underline="hover"
                className="ml-1 text-green-80 lg:hover:text-green-40"
              >
                [보기]
              </HyperLink>
            </label>
          </div>
        </div>
      </div>

      <button type="submit" disabled={isSubmitDisabled} className="auth-button">
        {isSubmitting ? '처리 중...' : '이메일 인증하기'}
      </button>
    </form>
  );
};

export default SignUpForm;
