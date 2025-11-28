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
  { label: '가이드 1', description: '서비스 안내' },
  { label: '가이드 2', description: '상세 안내' },
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

      case OnboardingStep.GUIDE_1:
        return (
          <GuideStep
            title="서비스 이용 방법"
            onNext={form.handleNext}
            isSubmitting={form.isSubmitting}
            error={form.error}
          >
            <div className="mt-4 space-y-3 text-left">
              <div className="rounded-lg bg-surface-contrast p-4">
                <h3 className="font-semibold text-fg">1. 메인 페이지</h3>
                <p className="mt-1 text-sm text-fg-muted">
                  원하는 기능을 선택하세요
                </p>
              </div>
              <div className="rounded-lg bg-surface-contrast p-4">
                <h3 className="font-semibold text-fg">2. 정보 입력</h3>
                <p className="mt-1 text-sm text-fg-muted">
                  필요한 정보를 입력하세요
                </p>
              </div>
              <div className="rounded-lg bg-surface-contrast p-4">
                <h3 className="font-semibold text-fg">3. 결과 확인</h3>
                <p className="mt-1 text-sm text-fg-muted">
                  결과를 확인하고 활용하세요
                </p>
              </div>
            </div>
          </GuideStep>
        );

      case OnboardingStep.GUIDE_2:
        return (
          <GuideStep
            title="상세 기능 안내"
            onNext={form.handleNext}
            isSubmitting={form.isSubmitting}
            error={form.error}
          >
            <div className="mt-4 space-y-3 text-left">
              <div className="rounded-lg bg-surface-contrast p-4">
                <h3 className="font-semibold text-fg">클라이언트 관리</h3>
                <p className="mt-1 text-sm text-fg-muted">
                  상담 고객을 등록하고 관리하세요
                </p>
              </div>
              <div className="rounded-lg bg-surface-contrast p-4">
                <h3 className="font-semibold text-fg">세션 기록</h3>
                <p className="mt-1 text-sm text-fg-muted">
                  상담 내용을 효과적으로 기록하세요
                </p>
              </div>
              <div className="rounded-lg bg-surface-contrast p-4">
                <h3 className="font-semibold text-fg">템플릿 활용</h3>
                <p className="mt-1 text-sm text-fg-muted">
                  미리 만들어진 템플릿을 활용하세요
                </p>
              </div>
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

        <div className="relative py-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
        </div>

        {form.writingEffect ? <WritingEffect /> : renderStep()}
      </div>
    </div>
  );
}
