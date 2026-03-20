import { CHECKLIST } from '@/shared/constants/genogramReport';
import { CreditIcon } from '@/shared/icons';

import type { ModalStep, ReportFormData } from './types';

interface CreationFlowButtonProps {
  step: ModalStep;
  answers: (number | null)[];
  formData: ReportFormData;
  onVerifyComplete: () => void;
  onInputComplete: () => void;
}

export function CreationFlowButton({
  step,
  answers,
  formData,
  onVerifyComplete,
  onInputComplete,
}: CreationFlowButtonProps) {
  const allCorrect = answers.every((a, i) => a === CHECKLIST[i].correctIndex);
  const allFilled =
    formData.counselorName.trim() !== '' &&
    formData.clientName.trim() !== '' &&
    formData.startDate !== '' &&
    formData.endDate !== '' &&
    formData.organization.trim() !== '';

  const isDisabled = step === 'verify' ? !allCorrect : !allFilled;
  const handleClick = step === 'verify' ? onVerifyComplete : onInputComplete;
  const isInput = step === 'input';

  return (
    <div className="flex flex-col items-center">
      {isInput && (
        <div className="mb-2 flex items-center gap-1 rounded-lg bg-primary-subtle px-3 py-1">
          <span className="typo-sm text-primary line-through">100</span>
          <span className="typo-sm font-headline text-primary">10</span>
          <CreditIcon size={14} />
          <span className="typo-sm text-primary">사용</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-center typo-m font-emphasize text-primary-fg transition-colors hover:bg-primary-400 disabled:disabled-default"
      >
        {isInput ? '보고서 생성하기' : '이어서 진행하기'}
      </button>
      {isInput && (
        <p className="mt-2 typo-sm font-medium text-primary">
          출시 기념 90% 크레딧 할인
        </p>
      )}
    </div>
  );
}
