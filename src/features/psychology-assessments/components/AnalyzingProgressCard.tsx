import { cn } from '@/lib/cn';

import {
  AnalysisStepIndicator,
  type AnalysisStepStatus,
} from './AnalysisStepIndicator';

export interface AnalysisStep {
  id: string;
  label: string;
  status: AnalysisStepStatus;
}

interface AnalyzingProgressCardProps {
  steps: AnalysisStep[];
  /** 0~100 */
  percent: number;
  helperText?: string;
  className?: string;
}

export const AnalyzingProgressCard = ({
  steps,
  percent,
  helperText = '등록한 심리검사 결과지를 기반으로 결과 해석 및 분석을\n진행하고 있습니다. 분석은 1~3분 정도 소요됩니다.',
  className,
}: AnalyzingProgressCardProps) => {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      {/* 분석 진행 카드 */}
      <div className="w-full max-w-[339px] rounded-2xl bg-grey-20 p-7 pb-12">
        <h2 className="mb-8 text-center text-l font-headline text-grey-100">
          심리검사 결과지 분석 중
        </h2>
        <ul className="flex flex-col gap-5 px-2">
          {steps.map((step) => (
            <li key={step.id} className="flex items-center gap-3">
              <AnalysisStepIndicator status={step.status} size={24} />
              <span
                className={cn(
                  'text-m font-medium',
                  step.status === 'pending' ? 'text-grey-100' : 'text-grey-100'
                )}
              >
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 진행률 bar */}
      <div className="flex w-full max-w-[320px] items-center gap-3">
        <div className="relative h-1.5 flex-1 overflow-hidden bg-grey-30">
          <div
            className="h-full bg-green-80 transition-[width] duration-fast"
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span className="text-sm font-medium text-grey-70">
          {Math.round(clamped)}%
        </span>
      </div>

      {/* 안내 텍스트 */}
      <p className="whitespace-pre-line text-center text-m font-medium text-grey-70">
        {helperText}
      </p>
    </div>
  );
};
