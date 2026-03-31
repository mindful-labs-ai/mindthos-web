import { useCallback, useEffect, useState } from 'react';

import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { Modal } from '@/shared/ui/composites/Modal';

import type { GenogramGuideModalProps } from './types';

/**
 * 텍스트에서 **bold** 마크업을 파싱하여 JSX로 변환
 */
function parseTextWithBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={index} className="font-headline">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

export function GenogramGuideModal({
  open,
  onOpenChange,
  steps,
  onComplete,
  onDontShowAgain,
}: GenogramGuideModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (open) {
      trackEvent(MixpanelEvent.GenogramGuideModalOpen);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      trackEvent(MixpanelEvent.GenogramGuideStepChange, {
        step: currentStepIndex + 1,
      });
    }
  }, [currentStepIndex, open]);

  const isLastStep = currentStepIndex === steps.length - 1;
  const currentStep = steps[currentStepIndex];

  // 모달 닫기 핸들러 (스텝 초기화 포함)
  const closeAndReset = useCallback(() => {
    onOpenChange(false);
    // 닫힌 후 스텝 초기화 (애니메이션 후)
    setTimeout(() => setCurrentStepIndex(0), 200);
  }, [onOpenChange]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      trackEvent(MixpanelEvent.GenogramGuideComplete);
      onComplete?.();
      closeAndReset();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [isLastStep, onComplete, closeAndReset]);

  const handleDontShowAgain = useCallback(() => {
    onDontShowAgain?.();
    closeAndReset();
  }, [onDontShowAgain, closeAndReset]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        closeAndReset();
      } else {
        onOpenChange(true);
      }
    },
    [closeAndReset, onOpenChange]
  );

  if (!currentStep) return null;

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      className="max-w-[512px] rounded-2xl border-none p-0"
    >
      {/* 콘텐츠 */}
      <div className="flex flex-col items-center px-8 py-10">
        {/* 헤더 */}
        <div className="mb-6 flex items-center gap-2">
          <span className="typo-sm rounded-full bg-primary px-3 py-1 font-emphasize tracking-tighter text-primary-fg">
            Beta
          </span>
          <h2 className="typo-xl font-emphasize text-fg">가계도 그리기 안내</h2>
        </div>

        {/* 서브 타이틀 */}
        <p className="typo-xl mb-6 font-emphasize text-primary">
          이제 가계도 완성까지 한걸음 남았어요
        </p>

        {/* 스텝 인디케이터 */}
        <div className="typo-l mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary-subtle font-headline text-primary">
          {currentStepIndex + 1}
        </div>

        {/* 이미지 영역 */}
        <div className="mb-6 w-full max-w-[428px] overflow-hidden rounded-xl border border-border bg-surface-contrast">
          <img
            src={currentStep.imageSrc}
            alt={currentStep.imageAlt}
            className="h-auto w-full object-contain"
          />
        </div>

        {/* 메인 텍스트 */}
        <p className="typo-m mb-4 whitespace-pre-line text-center leading-relaxed text-fg">
          {parseTextWithBold(currentStep.mainText)}
        </p>

        {/* 서브 텍스트 */}
        <p className="typo-sm mb-8 text-center text-fg-muted">
          {currentStep.subText}
        </p>

        {/* 버튼 영역 */}
        {isLastStep ? (
          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={handleDontShowAgain}
              className="typo-m flex-1 rounded-xl border border-border bg-surface py-4 font-emphasize text-fg transition-colors lg:hover:bg-surface-contrast"
            >
              다시 보지 않기
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="typo-m lg:hover:bg-primary-400 flex-1 rounded-xl bg-primary py-4 font-emphasize text-primary-fg transition-colors"
            >
              확인
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="typo-m lg:hover:bg-primary-400 w-full rounded-xl bg-primary py-4 font-emphasize text-primary-fg transition-colors"
          >
            다음
          </button>
        )}
      </div>
    </Modal>
  );
}
