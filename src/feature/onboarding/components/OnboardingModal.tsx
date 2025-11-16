import { Stepper } from '@/components/ui/composites/Stepper';
import { cn } from '@/lib/cn';
import { OnboardingStep } from '@/services/onboarding/types';
import { useAuthStore } from '@/stores/authStore';
import { useOnboardingStore } from '@/stores/onboardingStore';

import { useOnboardingForm } from '../hooks/useOnboardingForm';

import { ConfirmModal } from './ConfirmModal';
import { CompleteStep, GuideStep } from './GuideStep';
import { NameStep } from './NameStep';
import { PhoneStep } from './PhoneStep';
import { WritingEffect } from './WritingEffect';

const ONBOARDING_STEPS = [
  { label: '이름', description: '이름 입력' },
  { label: '연락처', description: '전화번호 입력' },
  { label: '가이드', description: '서비스 안내' },
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
      case OnboardingStep.NAME:
        return (
          <NameStep
            value={form.name}
            onChange={form.setName}
            onSubmit={form.handleNameSubmit}
            isSubmitting={form.isSubmitting}
            error={form.error}
          />
        );

      case OnboardingStep.PHONE:
        return (
          <PhoneStep
            value={form.phone}
            onChange={form.setPhone}
            onSubmit={form.handlePhoneSubmit}
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
    <>
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

      <ConfirmModal
        open={form.showConfirmModal}
        onOpenChange={form.setShowConfirmModal}
        type={form.confirmationType}
        value={form.confirmationType === 'name' ? form.name : form.phone}
        onConfirm={
          form.confirmationType === 'name'
            ? form.handleConfirmName
            : form.handleConfirmPhone
        }
      />
    </>
  );
}
