import type { AIGenogramOutput } from '../../utils/aiJsonConverter';

export type GenogramStep = 'confirm' | 'analyze' | 'edit' | 'render';

export interface GenogramStepModalState {
  isOpen: boolean;
  currentStep: GenogramStep;
  isLoading: boolean;
  error: string | null;
  aiOutput: AIGenogramOutput | null;
  editedJson: string;
}

export const GENERATION_STEPS = [
  { label: '가족 구성원 분석' },
  { label: '가계도 그리기' },
];

export const CREDIT_COST = 50;

export function stepToIndex(step: GenogramStep): number {
  switch (step) {
    case 'confirm':
      return -1; // confirm은 스테퍼에 표시되지 않음
    case 'analyze':
      return 0;
    case 'edit':
      return -1; // edit은 편집 플로우이므로 스테퍼에 표시되지 않음
    case 'render':
      return 1;
  }
}
