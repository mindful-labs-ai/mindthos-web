import React from 'react';

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { FormField } from '@/components/ui/composites/FormField';
import { trackEvent } from '@/lib/mixpanel';
import { ROUTES } from '@/router/constants';
import { useAuthStore } from '@/stores/authStore';

const SignInForm = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      trackEvent('login_success', { method: 'email' });
      // 로그인 성공 시 홈으로 리다이렉트
      navigate(ROUTES.ROOT);
    } catch (err) {
      trackEvent('login_failed', {
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
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

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
          autoComplete="current-password"
          className="h-12 text-base"
          disabled={isSubmitting}
        />
      </FormField>
      <Button
        type="submit"
        size="lg"
        variant="solid"
        tone="primary"
        className="h-12 w-full bg-primary-500 text-base hover:bg-primary-600"
        disabled={isSubmitting}
      >
        {isSubmitting ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  );
};

export default SignInForm;
