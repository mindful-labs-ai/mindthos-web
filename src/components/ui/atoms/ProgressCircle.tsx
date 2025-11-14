import React from 'react';

import { cn } from '@/lib/cn';

export interface ProgressCircleProps {
  /**
   * Progress value (0-100)
   */
  value: number;
  /**
   * Accessible label
   */
  label?: string;
  /**
   * Indeterminate state (loading animation)
   */
  indeterminate?: boolean;
  /**
   * Size in pixels
   * @default 48
   */
  size?: number;
  /**
   * Stroke width in pixels
   * @default 4
   */
  strokeWidth?: number;
  /**
   * Show percentage value in center
   * @default true
   */
  showValue?: boolean;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * ProgressCircle component
 *
 * Circular progress indicator with determinate and indeterminate modes.
 *
 * **A11y**: role="progressbar" with aria-valuenow/min/max.
 *
 * @example
 * ```tsx
 * <ProgressCircle value={75} label="Processing" />
 * <ProgressCircle indeterminate size={32} />
 * ```
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
            className="text-border"
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
            strokeLinecap="round"
            className="text-primary transition-all duration-300"
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
