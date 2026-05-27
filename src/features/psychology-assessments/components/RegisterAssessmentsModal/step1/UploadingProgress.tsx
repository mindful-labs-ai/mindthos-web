import { cn } from '@/lib/cn';

import { ReviewLoadingAnimation } from './ReviewLoadingAnimation';

interface UploadingProgressProps {
  /** 0~100 */
  percent: number;
  label?: string;
  className?: string;
}

export const UploadingProgress = ({
  percent,
  label = '추가한 결과지를 검토하고 있습니다',
  className,
}: UploadingProgressProps) => {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-6 py-16',
        className
      )}
    >
      <ReviewLoadingAnimation />

      <p className="text-m font-medium text-grey-70">{label}</p>

      <div className="flex w-full max-w-[280px] items-center gap-2">
        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-grey-30">
          <div
            className="h-full rounded-full bg-green-80 transition-[width] duration-fast"
            style={{ width: `${clamped}%` }}
          />
        </div>
        <span className="text-xs text-grey-60">{Math.round(clamped)}%</span>
      </div>
    </div>
  );
};
