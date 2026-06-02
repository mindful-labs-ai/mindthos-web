import { cn } from '@/lib/cn';
import { WaveRotatingText } from '@/shared/ui';

import { useDelayedProgressStart } from '../../../hooks/useDelayedProgressStart';

import { ReviewLoadingAnimation } from './ReviewLoadingAnimation';

interface UploadingProgressProps {
  /** 0~100 */
  percent: number;
  /** 위로 돌아가며 무한 반복 표시할 안내 문구들 */
  messages?: string[];
  className?: string;
}

// OCR 결과지 확인 단계에서 위로 돌아가며 물결 그라데이션으로 표시할 문구들.
// 원하는 문구를 자유롭게 추가/수정하면 된다.
const REVIEW_MESSAGES = [
  '추가한 결과지를 확인하고 있어요',
  '결과지의 검사 항목을 살펴보고 있어요',
  '어떤 검사인지 판별하고 있어요',
  '검사 점수를 꼼꼼히 읽고 있어요',
];

export const UploadingProgress = ({
  percent,
  messages = REVIEW_MESSAGES,
  className,
}: UploadingProgressProps) => {
  const clamped = useDelayedProgressStart(percent);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-6 py-16',
        className
      )}
    >
      <ReviewLoadingAnimation />

      <WaveRotatingText
        texts={messages}
        interval={5000}
        className="text-grey-70"
      />

      <div className="flex w-full max-w-[280px] items-center gap-2">
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
        <span className="text-xs text-grey-60">{Math.round(clamped)}%</span>
      </div>
    </div>
  );
};
