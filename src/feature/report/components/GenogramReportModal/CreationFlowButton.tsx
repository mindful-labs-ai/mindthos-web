import { CreditIcon } from '@/shared/icons';

import { CHECKLIST } from './constants';
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
        <div className="mb-2 flex items-center gap-1 rounded-lg bg-primary-100 px-3 py-1">
          <span className="text-sm text-primary-600 line-through">100</span>
          <span className="text-sm font-bold text-primary-600">10</span>
          <CreditIcon size={14} />
          <span className="text-sm text-primary-600">사용</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isInput ? '보고서 생성하기' : '이어서 진행하기'}
      </button>
      {isInput && (
        <p className="mt-2 text-sm font-medium text-primary">
          출시 기념 90% 크레딧 할인
        </p>
      )}
    </div>
  );
}
