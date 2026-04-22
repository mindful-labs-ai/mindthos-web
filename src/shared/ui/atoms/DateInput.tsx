import React from 'react';

import { cn } from '@/lib/cn';

export type DateInputSize = 'sm' | 'md' | 'lg' | 'free';

export interface DateInputProps
  extends Omit<React.ComponentPropsWithoutRef<'input'>, 'size' | 'type'> {
  size?: DateInputSize;
}

const sizeStyles: Record<DateInputSize, string> = {
  sm: 'h-8 px-3 typo-sm rounded-sm',
  md: 'h-10 px-4 typo-sm rounded-md',
  lg: 'h-12 px-5 typo-m rounded-lg',
  free: '',
};

/**
 * DateInput - 날짜 입력 컴포넌트
 * 네이티브 date input 사용
 * 일관된 스타일 제공
 *
 * @example
 * <DateInput value="2024-01-15" onChange={...} />
 */
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, size = 'md', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="date"
        className={cn(
          'border-default bg-input-bg',
          'placeholder:text-input-placeholder',
          'transition-default',
          'focus-default',
          'disabled:disabled-default',
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

DateInput.displayName = 'DateInput';
