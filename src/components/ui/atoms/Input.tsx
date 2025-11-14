import React from 'react';

import { cn } from '@/lib/cn';

export type InputSize = 'sm' | 'md' | 'lg' | 'free';
export type InputTone = 'primary' | 'secondary' | 'accent' | 'neutral';
export type InputVariant = 'solid' | 'outline' | 'ghost' | 'soft';

export interface InputProps
  extends Omit<React.ComponentPropsWithoutRef<'input'>, 'size'> {
  size?: InputSize;
  tone?: InputTone;
  variant?: InputVariant;
  error?: boolean;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-5 text-base rounded-[var(--radius-lg)]',
  free: '',
};

const variantStyles: Record<InputVariant, string> = {
  solid: 'bg-surface-contrast border-transparent',
  outline: 'bg-surface border-border',
  ghost: 'bg-transparent border-transparent',
  soft: 'bg-surface-contrast/50 border-transparent',
};

/**
 * Input - 텍스트 입력 컴포넌트
 * prefix/suffix, error 상태 지원
 *
 * @example
 * <Input placeholder="Enter name" prefix={<Icon />} />
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size = 'md',
      tone: _tone = 'neutral',
      variant = 'outline',
      error = false,
      prefix,
      suffix,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasAffixes = prefix || suffix;

    const input = (
      <input
        ref={ref}
        disabled={disabled}
        aria-invalid={error || undefined}
        className={cn(
          'w-full bg-transparent outline-none',
          'placeholder:text-fg-muted',
          'disabled:cursor-not-allowed',
          !hasAffixes && [
            'border-2',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
            sizeStyles[size],
            variantStyles[variant],
            error && 'border-danger focus-visible:ring-danger',
          ],
          hasAffixes && 'px-0',
          className
        )}
        {...props}
      />
    );

    if (hasAffixes) {
      return (
        <div
          className={cn(
            'flex items-center gap-2 border-2',
            'transition-colors duration-200',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-surface',
            sizeStyles[size],
            variantStyles[variant],
            error && 'border-danger focus-within:ring-danger',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {prefix && (
            <span className="flex-shrink-0 text-fg-muted">{prefix}</span>
          )}
          {input}
          {suffix && (
            <span className="flex-shrink-0 text-fg-muted">{suffix}</span>
          )}
        </div>
      );
    }

    return input;
  }
);

Input.displayName = 'Input';
