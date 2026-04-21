import React from 'react';

import { passwordResetSchema } from '@/features/auth/schemas/passwordResetSchema';
import { trackEvent } from '@/lib/mixpanel';
import { authService } from '@/shared/api/services/auth/authService';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { FormField } from '@/shared/ui/composites/FormField';

interface Props {
  onSuccess: () => void;
}

const PASSWORD_MATCH_DEBOUNCE_MS = 300;

const PasswordResetForm = ({ onSuccess }: Props) => {
  const [password, setPassword] = React.useState('');
  const [passwordConfirm, setPasswordConfirm] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const debouncedPassword = useDebouncedValue(
    password,
    PASSWORD_MATCH_DEBOUNCE_MS
  );
  const debouncedPasswordConfirm = useDebouncedValue(
    passwordConfirm,
    PASSWORD_MATCH_DEBOUNCE_MS
  );

  const passwordMatchState: 'idle' | 'match' | 'mismatch' = React.useMemo(() => {
    if (!debouncedPasswordConfirm) return 'idle';
    return debouncedPassword === debouncedPasswordConfirm ? 'match' : 'mismatch';
  }, [debouncedPassword, debouncedPasswordConfirm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = passwordResetSchema.safeParse({ password, passwordConfirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    trackEvent(MixpanelEvent.PasswordUpdateAttempt, { context: 'reset' });

    try {
      await authService.updatePassword(password);
      trackEvent(MixpanelEvent.PasswordUpdateSuccess, { context: 'reset' });
      onSuccess();
    } catch (err) {
      trackEvent(MixpanelEvent.PasswordUpdateFailed, {
        context: 'reset',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(
        err instanceof Error
          ? err.message
          : '비밀번호 변경에 실패했습니다. 다시 시도해주세요.'
      );
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || passwordMatchState !== 'match';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="auth-error-area">{error}</div>}

      <div className="space-y-4">
        <FormField>
          <input
            type="password"
            placeholder="새 비밀번호 (6자 이상)"
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
            placeholder="새 비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className="auth-input"
            disabled={isSubmitting}
          />
          {passwordMatchState === 'mismatch' && (
            <p className="mt-1 text-xs font-medium text-red-80">
              비밀번호가 일치하지 않습니다
            </p>
          )}
          {passwordMatchState === 'match' && (
            <p className="mt-1 text-xs font-medium text-green-80">
              비밀번호가 일치합니다
            </p>
          )}
        </FormField>
      </div>

      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="auth-button"
      >
        {isSubmitting ? '처리 중...' : '비밀번호 변경하기'}
      </button>
    </form>
  );
};

export default PasswordResetForm;
