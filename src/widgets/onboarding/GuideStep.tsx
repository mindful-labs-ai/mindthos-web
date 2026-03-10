// TODO: 삭제 예정 - OnboardingModal에서만 사용되며, OnboardingModal이 사용되지 않음
import { Title } from '@/shared/ui';
import { Button } from '@/shared/ui/atoms/Button';

interface GuideStepProps {
  title: React.ReactNode;
  onNext: () => void;
  isSubmitting: boolean;
  error: string;
  children: React.ReactNode;
}

export function GuideStep({
  title,
  onNext,
  isSubmitting,
  error,
  children,
}: GuideStepProps) {
  return (
    <div className="flex flex-col gap-6 break-keep">
      <div className="text-center">
        <Title
          as="h2"
          id="onboarding-title"
          className="text-left text-xl font-bold text-fg"
        >
          {title}
        </Title>
        {children}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        onClick={onNext}
        disabled={isSubmitting}
        tone="primary"
        className="w-full"
      >
        {isSubmitting ? '진행 중...' : '다음'}
      </Button>
    </div>
  );
}

export function CompleteStep({
  onComplete,
  isSubmitting,
  error,
}: {
  onComplete: () => void;
  isSubmitting: boolean;
  error: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 id="onboarding-title" className="text-2xl font-bold text-fg">
          준비 완료!
        </h2>
        <p className="mt-4 text-fg-muted">
          이제 모든 기능을 사용할 수 있습니다
        </p>
        <div className="mt-6 text-4xl">🎉</div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        onClick={onComplete}
        disabled={isSubmitting}
        tone="primary"
        className="w-full"
      >
        {isSubmitting ? '완료 중...' : '시작하기'}
      </Button>
    </div>
  );
}
