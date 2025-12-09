import { Title } from '@/components/ui';
import { Stepper } from '@/components/ui/composites/Stepper';
import { cn } from '@/lib/cn';
import { OnboardingStep } from '@/services/onboarding/types';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';

import { useOnboardingForm } from '../hooks/useOnboardingForm';

import { CompleteStep, GuideStep } from './GuideStep';
import { InfoStep } from './InfoStep';
import { WritingEffect } from './WritingEffect';

const ONBOARDING_STEPS = [
  { label: '기본정보', description: '정보 입력' },
  { label: '축어록', description: '축어록 안내' },
  { label: '상담노트', description: '상담노트 안내' },
  { label: 'AI 수퍼비전', description: '수퍼비전 안내' },
  { label: '완료', description: '시작하기' },
];

export function OnboardingModal() {
  const user = useAuthStore((state) => state.user);
  const isOpen = useOnboardingStore((state) => state.isOpen);
  const currentStep = useOnboardingStore((state) => state.currentStep);

  const form = useOnboardingForm(user?.email || '');

  if (!isOpen || !user?.email) return null;

  const renderStep = () => {
    switch (currentStep) {
      case OnboardingStep.INFO:
        return (
          <InfoStep
            name={form.name}
            phoneNumber={form.phone}
            selectedOrganization={form.selectedOrganization}
            customOrganization={form.customOrganization}
            onNameChange={form.setName}
            onPhoneChange={form.setPhone}
            onOrganizationSelect={form.setSelectedOrganization}
            onCustomOrganizationChange={form.setCustomOrganization}
            onSubmit={form.handleInfoSubmit}
            isSubmitting={form.isSubmitting}
            error={form.error}
          />
        );

      case OnboardingStep.TRANSCRIBE:
        return (
          <GuideStep
            title="클릭 한 번으로 축어록을 생성해보세요."
            onNext={form.handleNext}
            isSubmitting={form.isSubmitting}
            error={form.error}
          >
            <div className="mt-4 space-y-3">
              <div className="flex h-[214px] items-center justify-center rounded-md bg-surface-contrast p-4">
                <Title as="h2" className="text-4xl font-semibold text-red-500">
                  UI 영상
                </Title>
              </div>
              <p className="mt-1 text-wrap text-left text-sm text-fg-muted">
                상담 노트가 필요한 경우에는 일반축어록을, 수퍼바이저에게 제출할
                고퀄리티 축어록이 필요한 경우에는 고급 축어록을 사용해보세요.
              </p>
            </div>
          </GuideStep>
        );

      case OnboardingStep.PROGRESS_NOTE:
        return (
          <GuideStep
            title={
              <>
                다양한 사례개념화 노트와
                <br />각 기관별 제출 양식까지 한 번에
              </>
            }
            onNext={form.handleNext}
            isSubmitting={form.isSubmitting}
            error={form.error}
          >
            <div className="mt-4 space-y-3">
              <div className="flex h-[214px] items-center justify-center rounded-md bg-surface-contrast p-4">
                <Title as="h2" className="text-4xl font-semibold text-red-500">
                  UI 영상
                </Title>
              </div>
              <p className="mt-1 text-wrap text-left text-sm text-fg-muted">
                양식에 맞는 노트 작성은 모두 마음토스에게 맡겨주세요. 선생님이
                더욱 내담자에게 집중할 수 있도록, 시간이 걸리는 일은 저희가
                해결해드려요.
              </p>
            </div>
          </GuideStep>
        );

      case OnboardingStep.AI_SUPERVISION:
        return (
          <GuideStep
            title={
              <>
                다음 회기 준비가 어렵다면,
                <br />
                클라이언트 다회기 AI 수퍼비전을 받아보세요
              </>
            }
            onNext={form.handleNext}
            isSubmitting={form.isSubmitting}
            error={form.error}
          >
            <div className="mt-4 space-y-3">
              <div className="flex h-[214px] items-center justify-center rounded-md bg-surface-contrast p-4">
                <Title as="h2" className="text-4xl font-semibold text-red-500">
                  UI 영상
                </Title>
              </div>
              <p className="mt-1 text-wrap text-left text-sm text-fg-muted">
                지금까지 진행된 회기의 축어록 내용을 AI가 분석하고 선생님에게 꼭
                필요한 수퍼비전을 작성해드려요. 이제 마음토스와 함께 더 나은
                상담을 함께 준비해보세요.
              </p>
            </div>
          </GuideStep>
        );

      case OnboardingStep.DONE:
        return (
          <CompleteStep
            onComplete={form.handleComplete}
            isSubmitting={form.isSubmitting}
            error={form.error}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div
        className={cn(
          'relative w-full max-w-md',
          'rounded-lg border-2 border-border bg-surface shadow-2xl',
          'p-8'
        )}
      >
        <Stepper steps={ONBOARDING_STEPS} currentStep={currentStep} />

        <div className="relative py-3"></div>

        {form.writingEffect ? <WritingEffect /> : renderStep()}
      </div>
    </div>
  );
}
