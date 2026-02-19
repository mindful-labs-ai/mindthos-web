import React from 'react';

import { HyperLink } from '@/components/ui';
import { Button } from '@/components/ui/atoms/Button';
import { CheckBox } from '@/components/ui/atoms/CheckBox';
import { Input } from '@/components/ui/atoms/Input';
import { FormField } from '@/components/ui/composites/FormField';
import { trackEvent } from '@/lib/mixpanel';
import { getTermsRoute, ROUTES, TERMS_TYPES } from '@/router/constants';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
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

      trackEvent('signup_success', { method: 'email' });

      navigateWithUtm(ROUTES.EMAIL_VERIFICATION, {
        state: { email },
      });
    } catch (err) {
      trackEvent('signup_failed', {
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
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <FormField>
          <Input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-12 text-base"
            disabled={isSubmitting}
          />
        </FormField>
        <FormField>
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="h-12 text-base"
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
            <label htmlFor="terms" className="text-sm text-muted">
              <span>서비스 이용약관에 동의합니다.</span>
              <HyperLink
                href={getTermsRoute(TERMS_TYPES.SERVICE)}
                external
                underline="hover"
                className="ml-1 text-primary-500 hover:text-primary-600"
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
            <label htmlFor="privacy" className="text-sm text-muted">
              <span>개인정보 처리방침에 동의합니다.</span>
              <HyperLink
                href={getTermsRoute(TERMS_TYPES.PRIVACY)}
                external
                underline="hover"
                className="ml-1 text-primary-500 hover:text-primary-600"
              >
                [보기]
              </HyperLink>
            </label>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        tone="primary"
        size="lg"
        variant="solid"
        disabled={!termsAccepted || !privacyAccepted || isSubmitting}
        className="h-12 w-full bg-primary-500 text-base hover:bg-primary-600 disabled:cursor-not-allowed"
      >
        {isSubmitting ? '처리 중...' : '이메일 인증하기'}
      </Button>
    </form>
  );
};

export default SignUpForm;
