import React from 'react';

import { getTermsRoute, ROUTES, TERMS_TYPES } from '@/app/router/constants';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { HyperLink } from '@/shared/ui';
import { CheckBox } from '@/shared/ui/atoms/CheckBox';
import { FormField } from '@/shared/ui/composites/FormField';
import { useAuthStore } from '@/stores/authStore';

const SignUpForm = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [privacyAccepted, setPrivacyAccepted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const signup = useAuthStore((state) => state.signup);
  const { navigateWithUtm } = useNavigateWithUtm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted || !privacyAccepted) {
      setError('약관에 동의해주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await signup(email, password, {
        termsAccepted,
        privacyAccepted,
      });

      trackEvent(MixpanelEvent.SignupSuccess, { method: 'email' });

      navigateWithUtm(ROUTES.EMAIL_VERIFICATION, {
        state: { email },
      });
    } catch (err) {
      trackEvent(MixpanelEvent.SignupFailed, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(
        err instanceof Error
          ? err.message
          : '회원가입에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="auth-input"
            disabled={isSubmitting}
          />
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
              <span>서비스 이용약관에 동의합니다.</span>
              <HyperLink
                href={getTermsRoute(TERMS_TYPES.SERVICE)}
                external
                underline="hover"
                className="ml-1 text-green-80 hover:text-green-40"
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
              <span>개인정보 처리방침에 동의합니다.</span>
              <HyperLink
                href={getTermsRoute(TERMS_TYPES.PRIVACY)}
                external
                underline="hover"
                className="ml-1 text-green-80 hover:text-green-40"
              >
                [보기]
              </HyperLink>
            </label>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!termsAccepted || !privacyAccepted || isSubmitting}
        className="auth-button"
      >
        {isSubmitting ? '처리 중...' : '이메일 인증하기'}
      </button>
    </form>
  );
};

export default SignUpForm;
