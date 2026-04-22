import React from 'react';

import { ROUTES } from '@/app/router/constants';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { FormField } from '@/shared/ui/composites/FormField';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  onForgotPassword: () => void;
}

const SignInForm = ({ onForgotPassword }: Props) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const login = useAuthStore((state) => state.login);
  const { navigateWithUtm } = useNavigateWithUtm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      trackEvent(MixpanelEvent.LoginSuccess, { method: 'email' });
      navigateWithUtm(ROUTES.ROOT);
    } catch (err) {
      trackEvent(MixpanelEvent.LoginFailed, {
        method: 'email',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(
        err instanceof Error
          ? err.message
          : '로그인에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="auth-error-area">{error}</div>}

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
          autoComplete="current-password"
          className="auth-input"
          disabled={isSubmitting}
        />
      </FormField>
      <button type="submit" className="auth-button" disabled={isSubmitting}>
        {isSubmitting ? '로그인 중...' : '로그인'}
      </button>

      <div className="text-right">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm font-medium text-grey-70 underline-offset-2 lg:hover:text-green-80 lg:hover:underline"
          disabled={isSubmitting}
        >
          비밀번호를 잊으셨나요?
        </button>
      </div>
    </form>
  );
};

export default SignInForm;
