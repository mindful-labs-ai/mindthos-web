import React from 'react';

import { cn } from '@/lib/cn';

export type CreditSize = 'sm' | 'md' | 'lg';
export type CreditVariant = 'default' | 'bar' | 'minimal';

export interface CreditProps {
  /**
   * Current usage count
   */
  used: number;
  /**
   * Total available count
   */
  total: number;
  /**
   * Size variant
   * @default 'md'
   */
  size?: CreditSize;
  /**
   * Display variant
   * @default 'default'
   */
  variant?: CreditVariant;
  /**
   * Label text
   */
  label?: string;
  /**
   * Show percentage
   * @default false
   */
  showPercentage?: boolean;
  /**
   * Warning threshold (0-1, triggers warning color)
   * @default 0.8
   */
  warningThreshold?: number;
  /**
   * Danger threshold (0-1, triggers danger color)
   * @default 0.95
   */
  dangerThreshold?: number;
  /**
   * Additional className
   */
  className?: string;
}

const sizeStyles: Record<CreditSize, { text: string; bar: string }> = {
  sm: { text: 'text-xs', bar: 'h-1' },
  md: { text: 'text-sm', bar: 'h-2' },
  lg: { text: 'text-base', bar: 'h-3' },
};

/**
 * Credit component
 *
 * Displays usage credits/quota with visual indicators.
 * Shows current usage vs total available with optional progress bar.
 *
 * **A11y**: aria-label, aria-valuenow/min/max for screen readers.
 *
 * @example
 * ```tsx
 * <Credit used={250} total={300} label="API Calls" />
 * <Credit used={280} total={300} variant="bar" showPercentage />
 * <Credit used={295} total={300} variant="minimal" />
 * ```
 */
export const Credit: React.FC<CreditProps> = ({
  used,
  total,
  size = 'md',
  variant = 'default',
  label,
  showPercentage = false,
  warningThreshold = 0.8,
  dangerThreshold = 0.95,
  className,
}) => {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const ratio = total > 0 ? used / total : 0;

  const getToneColor = () => {
    if (ratio >= dangerThreshold) return 'danger';
    if (ratio >= warningThreshold) return 'warn';
    return 'primary';
  };

  const tone = getToneColor();

  const toneColorClasses = {
    primary: 'text-primary',
    warn: 'text-warn',
    danger: 'text-danger',
  };

  const toneBgClasses = {
    primary: 'bg-primary',
    warn: 'bg-warn',
    danger: 'bg-danger',
  };

  if (variant === 'minimal') {
    return (
      <div
        className={cn('inline-flex items-center gap-1.5', className)}
        role="status"
        aria-label={`${label ? `${label}: ` : ''}${used} of ${total} used`}
      >
        {label && (
          <span className={cn('font-medium text-fg-muted', sizeStyles[size].text)}>
            {label}:
          </span>
        )}
        <span
          className={cn(
            'font-semibold',
            toneColorClasses[tone],
            sizeStyles[size].text
          )}
        >
          {used} / {total}
        </span>
        {showPercentage && (
          <span className={cn('text-fg-muted', sizeStyles[size].text)}>
            ({percentage.toFixed(0)}%)
          </span>
        )}
      </div>
    );
  }

  if (variant === 'bar') {
    return (
      <div
        className={cn('flex flex-col gap-1.5', className)}
        role="progressbar"
        aria-label={`${label ? `${label}: ` : ''}${used} of ${total} used`}
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div className="flex items-center justify-between gap-2">
          {label && (
            <span className={cn('font-medium text-fg', sizeStyles[size].text)}>
              {label}
            </span>
          )}
          <span
            className={cn(
              'font-semibold',
              toneColorClasses[tone],
              sizeStyles[size].text
            )}
          >
            {used} / {total}
            {showPercentage && (
              <span className="ml-1 text-fg-muted">
                ({percentage.toFixed(0)}%)
              </span>
            )}
          </span>
        </div>
        <div
          className={cn(
            'w-full overflow-hidden rounded-full bg-surface-contrast',
            sizeStyles[size].bar
          )}
        >
          <div
            className={cn(
              'h-full transition-all duration-300',
              toneBgClasses[tone]
            )}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  }

  // default variant
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-[var(--radius-md)] border-2 border-border bg-surface px-3 py-2',
        className
      )}
      role="status"
      aria-label={`${label ? `${label}: ` : ''}${used} of ${total} used`}
    >
      {label && (
        <span className={cn('font-medium text-fg-muted', sizeStyles[size].text)}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-1">
        <span
          className={cn(
            'font-semibold',
            toneColorClasses[tone],
            sizeStyles[size].text
          )}
        >
          {used}
        </span>
        <span className={cn('text-fg-muted', sizeStyles[size].text)}>/</span>
        <span className={cn('font-semibold text-fg', sizeStyles[size].text)}>
          {total}
        </span>
      </div>
      {showPercentage && (
        <span
          className={cn(
            'rounded-[var(--radius-sm)] bg-surface-contrast px-1.5 py-0.5 font-medium',
            toneColorClasses[tone],
            sizeStyles[size].text
          )}
        >
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  );
};

Credit.displayName = 'Credit';
