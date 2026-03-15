import React from 'react';

import { cn } from '@/lib/cn';

export interface ProgressBarProps {
  value: number;
  label?: string;
  indeterminate?: boolean;
  className?: string;
}

/**
 * ProgressBar - 선형 진행 표시기
 * determinate/indeterminate 모드 지원
 * role="progressbar"로 접근성 준수
 *
 * @example
 * <ProgressBar value={50} label="업로드" />
 */
export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, label, indeterminate = false, className }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div ref={ref} className={cn('w-full', className)}>
        {label && (
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-fg-muted">{label}</span>
            {!indeterminate && (
              <span className="text-sm text-fg-muted">{clampedValue}%</span>
            )}
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : clampedValue}
          aria-valuemin={indeterminate ? undefined : 0}
          aria-valuemax={indeterminate ? undefined : 100}
          aria-label={label}
          className={cn(
            'h-2 w-full overflow-hidden rounded-full bg-surface-contrast',
            indeterminate && 'relative'
          )}
        >
          <div
            className={cn(
              'h-full bg-primary transition-all duration-300',
              indeterminate &&
                'absolute w-1/3 animate-[shimmer_1.5s_ease-in-out_infinite]'
            )}
            style={indeterminate ? undefined : { width: `${clampedValue}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
