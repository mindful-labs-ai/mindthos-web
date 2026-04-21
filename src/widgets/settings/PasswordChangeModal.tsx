import React from 'react';

import { passwordChangeSchema } from '@/features/auth/schemas/passwordChangeSchema';
import { trackEvent } from '@/lib/mixpanel';
import { authService } from '@/shared/api/services/auth/authService';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { FormField } from '@/shared/ui/composites/FormField';
import { Modal } from '@/shared/ui/composites/Modal';
import { useToast } from '@/shared/ui/composites/Toast';

export interface PasswordChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PASSWORD_MATCH_DEBOUNCE_MS = 300;

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const debouncedNewPassword = useDebouncedValue(
    newPassword,
    PASSWORD_MATCH_DEBOUNCE_MS
  );
  const debouncedNewPasswordConfirm = useDebouncedValue(
    newPasswordConfirm,
    PASSWORD_MATCH_DEBOUNCE_MS
  );

  const passwordMatchState: 'idle' | 'match' | 'mismatch' = React.useMemo(() => {
    if (!debouncedNewPasswordConfirm) return 'idle';
    return debouncedNewPassword === debouncedNewPasswordConfirm
      ? 'match'
      : 'mismatch';
  }, [debouncedNewPassword, debouncedNewPasswordConfirm]);

  React.useEffect(() => {
    if (!open) {
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setError('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = passwordChangeSchema.safeParse({
      currentPassword,
      newPassword,
      newPasswordConfirm,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    trackEvent(MixpanelEvent.PasswordUpdateAttempt, { context: 'settings' });

    try {
      await authService.changePassword(currentPassword, newPassword);
      trackEvent(MixpanelEvent.PasswordUpdateSuccess, { context: 'settings' });
      toast({
        title: '비밀번호 변경 완료',
        description: '새 비밀번호로 다시 로그인해주세요.',
      });
      onOpenChange(false);
      await authService.logout();
    } catch (err) {
      trackEvent(MixpanelEvent.PasswordUpdateFailed, {
        context: 'settings',
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

  const isSubmitDisabled =
    isSubmitting ||
    !currentPassword ||
    passwordMatchState !== 'match' ||
    newPassword.length < 6;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-sm"
      closeOnOverlay={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
        <div>
          <Text className="typo-xl font-emphasize">비밀번호 변경</Text>
          <Text className="typo-sm mt-2 text-fg-muted">
            보안을 위해 현재 비밀번호를 먼저 확인합니다.
          </Text>
        </div>

        {error && (
          <p className="typo-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-4">
          <FormField>
            <input
              type="password"
              placeholder="현재 비밀번호"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="auth-input"
              disabled={isSubmitting}
            />
          </FormField>
          <FormField>
            <input
              type="password"
              placeholder="새 비밀번호 (6자 이상)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
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

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            tone="neutral"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="solid"
            tone="primary"
            className="flex-1"
            disabled={isSubmitDisabled}
          >
            {isSubmitting ? '변경 중...' : '변경하기'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
