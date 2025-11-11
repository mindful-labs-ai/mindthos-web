import React from 'react';

import { cn } from '@/lib/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  /**
   * Size variant
   * @default 'md'
   */
  size?: SpinnerSize;
  /**
   * Accessible label
   */
  ariaLabel?: string;
  /**
   * Additional className
   */
  className?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

/**
 * Spinner component
 *
 * Loading spinner with size variants.
 *
 * **A11y**: aria-busy and sr-only label.
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="sm" ariaLabel="Loading content" />
 * ```
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  ariaLabel = 'Loading',
  className,
}) => {
  return (
    <div
      className={cn('inline-flex items-center justify-center', className)}
      aria-busy="true"
    >
      <div
        className={cn(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizeStyles[size]
        )}
        role="status"
      >
        <span className="sr-only">{ariaLabel}</span>
      </div>
    </div>
  );
};

Spinner.displayName = 'Spinner';
