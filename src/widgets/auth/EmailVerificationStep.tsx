import { useState } from 'react';

import { cn } from '@/lib/cn';
import { authService } from '@/shared/api/services/auth/authService';
import { MailIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';

interface Props {
  email: string;
  onBackToLogin: () => void;
}

type ResendState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

const EmailVerificationStep = ({ email, onBackToLogin }: Props) => {
  const [isResending, setIsResending] = useState(false);
  const [resendState, setResendState] = useState<ResendState>({
    status: 'idle',
  });

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendState({ status: 'idle' });

    try {
      await authService.resendEmailVerification(email);
      setResendState({
        status: 'success',
        message: '인증 이메일을 다시 발송했습니다.',
      });
    } catch (error) {
      setResendState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : '이메일 발송에 실패했습니다. 다시 시도해주세요.',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-8 text-center">
      <div className="mb-6 flex justify-center">
        <div className="rounded-full bg-green-80 p-4">
          <MailIcon className="h-12 w-12 text-grey-10" />
        </div>
      </div>

      <h2 className="mb-2">이메일을 확인해주세요</h2>

      <p className="mb-6 text-grey-100">
        <span className="font-medium text-grey-100">{email}</span>로 인증 메일을
        발송했습니다.
        <br />
        이메일의 링크를 클릭하여 회원가입을 완료해주세요.
      </p>

      {resendState.status !== 'idle' && (
        <div
          role={resendState.status === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={cn(
            'mb-4 rounded-md p-3 text-sm font-medium',
            resendState.status === 'success'
              ? 'bg-green-50 text-green-80'
              : 'bg-red-20 text-red-80'
          )}
        >
          {resendState.message}
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={handleResendEmail}
          disabled={isResending}
          variant="outline"
          tone="neutral"
          className="w-full"
        >
          {isResending ? '발송 중...' : '인증 이메일 다시 받기'}
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
};

export default EmailVerificationStep;
