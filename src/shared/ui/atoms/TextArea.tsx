import React from 'react';

import { cn } from '@/lib/cn';

export type TextAreaSize = 'sm' | 'md' | 'lg' | 'free';
export type TextAreaTone = 'primary' | 'secondary' | 'accent' | 'neutral';
export type TextAreaVariant = 'solid' | 'outline' | 'ghost' | 'soft';

export interface TextAreaProps
  extends Omit<React.ComponentPropsWithoutRef<'textarea'>, 'size'> {
  size?: TextAreaSize;
  tone?: TextAreaTone;
  variant?: TextAreaVariant;
  error?: boolean;
}

const sizeStyles: Record<TextAreaSize, string> = {
  sm: 'p-2 typo-sm rounded-sm',
  md: 'p-3 typo-sm rounded-md',
  lg: 'p-4 typo-m rounded-lg',
  free: '',
};

const variantStyles: Record<TextAreaVariant, string> = {
  solid: 'bg-surface-contrast border-transparent',
  outline: 'bg-input-bg border-input-border',
  ghost: 'bg-transparent border-transparent',
  soft: 'bg-surface-contrast/50 border-transparent',
};

/**
 * TextArea - 다줄 텍스트 입력
 * size, variant, error 상태 지원
 *
 * @example
 * <TextArea placeholder="Enter description" rows={4} />
 */
export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      size = 'md',
      tone: _tone = 'neutral',
      variant = 'outline',
      error = false,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        aria-invalid={error || undefined}
        className={cn(
          'w-full resize-y border-2',
          'placeholder:text-input-placeholder',
          'transition-default',
          'focus-default',
          'disabled:disabled-default',
          sizeStyles[size],
          variantStyles[variant],
          error && 'border-danger focus-visible:ring-danger',
          className
        )}
        {...props}
      />
    );
  }
);

TextArea.displayName = 'TextArea';
