import { useCallback, useEffect, useState } from 'react';

import { X } from 'lucide-react';

import type { GenogramGuideModalProps } from './types';

/**
 * 텍스트에서 **bold** 마크업을 파싱하여 JSX로 변환
 */
function parseTextWithBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={index} className="font-bold">
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

  const isLastStep = currentStepIndex === steps.length - 1;
  const currentStep = steps[currentStepIndex];

  // 모달 닫기 핸들러 (스텝 초기화 포함)
  const closeAndReset = useCallback(() => {
    onOpenChange(false);
    // 닫힌 후 스텝 초기화 (애니메이션 후)
    setTimeout(() => setCurrentStepIndex(0), 200);
  }, [onOpenChange]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // 스크롤 방지
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
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

  if (!open || !currentStep) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        role="presentation"
        className="absolute inset-0 bg-black/50"
        onClick={closeAndReset}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            closeAndReset();
          }
        }}
      />

      {/* Modal */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-[512px] overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* 닫기 버튼 */}
        <button
          type="button"
          className="absolute right-4 top-4 z-10 rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
          onClick={closeAndReset}
        >
          <X className="h-5 w-5" />
        </button>

        {/* 콘텐츠 */}
        <div className="flex flex-col items-center px-8 py-10">
          {/* 헤더 */}
          <div className="mb-6 flex items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold tracking-tighter text-white">
              Beta
            </span>
            <h2 className="text-2xl font-semibold text-fg">
              가계도 그리기 안내
            </h2>
          </div>

          {/* 서브 타이틀 */}
          <p className="mb-6 text-xl font-semibold text-primary">
            이제 가계도 완성까지 한걸음 남았어요
          </p>

          {/* 스텝 인디케이터 */}
          <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary">
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
          <p className="mb-4 whitespace-pre-line text-center text-base leading-relaxed text-fg">
            {parseTextWithBold(currentStep.mainText)}
          </p>

          {/* 서브 텍스트 */}
          <p className="mb-8 text-center text-sm text-fg-muted">
            {currentStep.subText}
          </p>

          {/* 버튼 영역 */}
          {isLastStep ? (
            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={handleDontShowAgain}
                className="flex-1 rounded-xl border border-border bg-white py-4 text-base font-semibold text-fg transition-colors hover:bg-surface-contrast"
              >
                다시 보지 않기
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 rounded-xl bg-primary py-4 text-base font-semibold text-white transition-colors hover:bg-primary-400"
              >
                확인
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="w-full rounded-xl bg-primary py-4 text-base font-semibold text-white transition-colors hover:bg-primary-400"
            >
              다음
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
