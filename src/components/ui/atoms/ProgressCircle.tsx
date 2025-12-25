import React from 'react';

import { cn } from '@/lib/cn';

export interface ProgressCircleProps {
  value: number;
  label?: string;
  indeterminate?: boolean;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
}

/**
 * ProgressCircle - 원형 진행률 표시기
 * 확정/불확정 모드 지원, 퍼센트 표시 옵션
 *
 * @example
 * <ProgressCircle value={75} label="Processing" />
 */
export const ProgressCircle = React.forwardRef<
  HTMLDivElement,
  ProgressCircleProps
>(
  (
    {
      value,
      label,
      indeterminate = false,
      size = 48,
      strokeWidth = 4,
      showValue = true,
      className,
    },
    ref
  ) => {
    const clampedValue = Math.min(100, Math.max(0, value));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clampedValue / 100) * circumference;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuemin={indeterminate ? undefined : 0}
        aria-valuemax={indeterminate ? undefined : 100}
        aria-label={label}
        className={cn(
          'relative inline-flex items-center justify-center',
          className
        )}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className={cn(indeterminate && 'animate-spin')}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-primary-200"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={indeterminate ? circumference * 0.75 : offset}
            strokeLinecap="butt"
            className="text-primary-400 transition-all duration-300"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
        {!indeterminate && showValue && (
          <span className="absolute text-xs font-medium text-fg">
            {clampedValue}%
          </span>
        )}
      </div>
    );
  }
);

ProgressCircle.displayName = 'ProgressCircle';
