import React from 'react';

import { cn } from '@/lib/cn';

export type DateInputSize = 'sm' | 'md' | 'lg' | 'free';

export interface DateInputProps
  extends Omit<React.ComponentPropsWithoutRef<'input'>, 'size' | 'type'> {
  /**
   * Size variant
   * @default 'md'
   */
  size?: DateInputSize;
}

const sizeStyles: Record<DateInputSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-5 text-base rounded-[var(--radius-lg)]',
  free: '',
};

/**
 * DateInput component
 *
 * Native date input with consistent styling.
 *
 * @example
 * ```tsx
 * <DateInput value="2024-01-15" onChange={e => console.log(e.target.value)} />
 * <DateInput size="sm" min="2024-01-01" max="2024-12-31" />
 * ```
 */
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, size = 'md', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="date"
        className={cn(
          'border-2 border-border bg-surface',
          'placeholder:text-fg-muted',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'disabled:cursor-not-allowed disabled:opacity-50',
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

DateInput.displayName = 'DateInput';
