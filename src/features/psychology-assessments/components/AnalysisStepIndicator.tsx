import { cn } from '@/lib/cn';
import { CheckIcon } from '@/shared/icons';

export type AnalysisStepStatus = 'completed' | 'in_progress' | 'pending';

interface AnalysisStepIndicatorProps {
  status: AnalysisStepStatus;
  size?: number;
  className?: string;
}

export const AnalysisStepIndicator = ({
  status,
  size = 24,
  className,
}: AnalysisStepIndicatorProps) => {
  if (status === 'completed') {
    return (
      <span
        className={cn(
          'flex flex-shrink-0 items-center justify-center rounded-full bg-green-80 text-white',
          className
        )}
        style={{ width: size, height: size }}
      >
        <CheckIcon size={Math.round(size * 0.6)} strokeWidth={3} />
      </span>
    );
  }

  if (status === 'in_progress') {
    return (
      <span
        className={cn(
          'flex flex-shrink-0 items-center justify-center rounded-full border border-green-80 bg-white',
          className
        )}
        style={{ width: size, height: size }}
        aria-label="진행 중"
      >
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            className="currentColor"
            strokeWidth="2"
          />
          <path
            d="M22 12 A 10 10 0 0 0 12 2"
            className="stroke-primary"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'flex flex-shrink-0 rounded-full border border-grey-70 bg-white',
        className
      )}
      style={{ width: size, height: size }}
    />
  );
};
