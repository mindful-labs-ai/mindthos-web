import React from 'react';

import { Check, Minus } from 'lucide-react';

import { cn } from '@/lib/cn';

export type CheckBoxSize = 'sm' | 'md' | 'lg' | 'free';
export type CheckBoxTone = 'primary' | 'secondary' | 'accent' | 'neutral';
export type CheckBoxVariant = 'solid' | 'outline' | 'ghost' | 'soft';

export interface CheckBoxProps
  extends Omit<React.ComponentPropsWithoutRef<'input'>, 'size' | 'type'> {
  size?: CheckBoxSize;
  tone?: CheckBoxTone;
  variant?: CheckBoxVariant;
  indeterminate?: boolean;
  label?: React.ReactNode;
  description?: React.ReactNode;
}

const sizeStyles: Record<CheckBoxSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  free: '',
};

const iconSizeMap: Record<CheckBoxSize, number> = {
  sm: 12,
  md: 14,
  lg: 16,
  free: 14,
};

/**
 * CheckBox - 체크박스 컴포넌트
 * 라벨, 설명, indeterminate 상태 지원
 *
 * @example
 * <CheckBox label="Accept terms" />
 */
export const CheckBox = React.forwardRef<HTMLInputElement, CheckBoxProps>(
  (
    {
      className,
      size = 'md',
      tone = 'primary',
      variant: _variant = 'solid',
      indeterminate = false,
      label,
      description,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      const element =
        (typeof ref === 'function' ? null : ref?.current) || inputRef.current;
      if (element) {
        element.indeterminate = indeterminate;
      }
    }, [indeterminate, ref]);

    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    const getToneClass = () => {
      const toneMap: Record<CheckBoxTone, string> = {
        primary: 'checked:bg-primary checked:border-primary',
        secondary: 'checked:bg-secondary checked:border-secondary',
        accent: 'checked:bg-accent checked:border-accent',
        neutral: 'checked:bg-secondary-600 checked:border-secondary-600',
      };
      return toneMap[tone];
    };

    return (
      <div className={cn('flex items-start gap-2', className)}>
        <div className="relative inline-flex">
          <input
            ref={ref || inputRef}
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            aria-checked={indeterminate ? 'mixed' : undefined}
            className={cn(
              'peer appearance-none rounded-[var(--radius-sm)] border-2 border-border',
              'cursor-pointer bg-surface',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
              'transition-colors duration-200',
              'disabled:cursor-not-allowed disabled:opacity-50',
              sizeStyles[size],
              getToneClass()
            )}
            {...props}
          />
          <div
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center justify-center text-white',
              'opacity-0 transition-opacity duration-200',
              'peer-checked:opacity-100',
              disabled && 'opacity-50'
            )}
          >
            {indeterminate ? (
              <Minus size={iconSizeMap[size]} strokeWidth={3} />
            ) : (
              <Check size={iconSizeMap[size]} strokeWidth={3} />
            )}
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'cursor-pointer text-sm font-medium text-fg',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                className={cn(
                  'text-xs text-fg-muted',
                  disabled && 'opacity-50'
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

CheckBox.displayName = 'CheckBox';
