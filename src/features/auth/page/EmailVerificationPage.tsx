import { useEffect, useState } from 'react';

import { useLocation } from 'react-router-dom';

import { ROUTES } from '@/app/router/constants';
import { authService } from '@/shared/api/services/auth/authService';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { MailIcon } from '@/shared/icons';
import { Title } from '@/shared/ui';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';

export default function EmailVerificationPage() {
  const location = useLocation();
  const { navigateWithUtm } = useNavigateWithUtm();
  const email = (location.state as { email?: string })?.email;

  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!email) {
      const timer = setTimeout(
        () => navigateWithUtm(ROUTES.AUTH, { replace: true }),
        3000
      );
      return () => clearTimeout(timer);
    }
  }, [email, navigateWithUtm]);

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);
    setResendMessage('');

    try {
      await authService.resendEmailVerification(email);
      setResendMessage('인증 이메일을 다시 발송했습니다.');
    } catch (error) {
      setResendMessage(
        error instanceof Error
          ? error.message
          : '이메일 발송에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-xl bg-white p-8">
            <Text className="text-muted">
              잘못된 접근입니다. 로그인 페이지로 이동합니다...
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary-50 p-4">
              <MailIcon className="h-12 w-12 text-primary-500" />
            </div>
          </div>

          <Title as="h2" className="mb-2">
            이메일을 확인해주세요
          </Title>

          <Text className="mb-6 text-muted">
            {email ? (
              <>
                <span className="text-foreground font-medium">{email}</span>로
                인증 메일을 발송했습니다.
                <br />
                이메일의 링크를 클릭하여 회원가입을 완료해주세요.
              </>
            ) : (
              <>
                인증 메일을 발송했습니다.
                <br />
                이메일의 링크를 클릭하여 회원가입을 완료해주세요.
              </>
            )}
          </Text>

          {resendMessage && (
            <div
              className={`mb-4 rounded-lg p-3 text-sm ${
                resendMessage.includes('발송')
                  ? 'bg-green-50 text-green-600'
                  : 'bg-red-50 text-red-600'
              }`}
            >
              {resendMessage}
            </div>
          )}

          <div className="space-y-3">
            {email && (
              <Button
                onClick={handleResendEmail}
                disabled={isResending}
                variant="outline"
                tone="neutral"
                className="w-full"
              >
                {isResending ? '발송 중...' : '인증 이메일 다시 받기'}
              </Button>
            )}

            <Button
              onClick={() => navigateWithUtm(ROUTES.AUTH)}
              variant="ghost"
              tone="neutral"
              className="w-full"
            >
              로그인 페이지로 돌아가기
            </Button>
          </div>

          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <Text className="text-muted">
              💡 이메일이 보이지 않나요?
              <br />
              스팸 메일함을 확인하거나 위 버튼을 눌러 이메일을 다시 받아보세요.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
