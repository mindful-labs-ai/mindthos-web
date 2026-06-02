import { cn } from '@/lib/cn';
import { WaveRotatingText } from '@/shared/ui';

import {
  AnalysisStepIndicator,
  type AnalysisStepStatus,
} from './AnalysisStepIndicator';

export interface AnalysisStep {
  id: string;
  label: string;
  status: AnalysisStepStatus;
}

// 분석 중 위로 돌아가며 물결 그라데이션으로 표시할 안내 문구들.
const ANALYSIS_MESSAGES = [
  '결과지 점수를 살펴보고 있어요',
  '내담자의 마음을 헤아리고 있어요',
  '검사 항목별 이론을 적용해보고 있어요',
  '결과지를 안전하게 살펴보고 있어요',
];

interface AnalyzingProgressCardProps {
  steps: AnalysisStep[];
  /** 0~100 */
  percent: number;
  /** 위로 돌아가며 무한 반복 표시할 안내 문구들 */
  messages?: string[];
  className?: string;
}

export const AnalyzingProgressCard = ({
  steps,
  percent,
  messages = ANALYSIS_MESSAGES,
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
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-grey-30">
          {/* 천천히 차오르는 전환(transition-[width] 1200ms) + 물결 그라데이션(progress-flow) */}
          <div
            className="h-full rounded-full transition-[width] duration-[1200ms] ease-out"
            style={{
              width: `${clamped}%`,
              background:
                'linear-gradient(90deg, var(--color-green-80) 30%, var(--color-green-40) 50%, var(--color-green-80) 90%)',
              backgroundSize: '200% 100%',
              animation: 'progress-flow 2.5s linear infinite',
            }}
          />
        </div>
        <span className="text-sm font-medium text-grey-70">
          {Math.round(clamped)}%
        </span>
      </div>

      {/* 안내 텍스트 — 위로 돌아가는 물결 로테이팅 */}
      <WaveRotatingText
        texts={messages}
        interval={5000}
        className="text-grey-70"
      />
    </div>
  );
};
