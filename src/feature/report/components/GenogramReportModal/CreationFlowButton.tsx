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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      이어서 진행하기
    </button>
  );
}
