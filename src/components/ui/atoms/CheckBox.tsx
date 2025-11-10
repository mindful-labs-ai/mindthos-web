import React from 'react';

import { cn } from '@/lib/cn';

export type CheckBoxSize = 'sm' | 'md' | 'lg' | 'free';
export type CheckBoxTone = 'primary' | 'secondary' | 'accent' | 'neutral';
export type CheckBoxVariant = 'solid' | 'outline' | 'ghost' | 'soft';

export interface CheckBoxProps
  extends Omit<React.ComponentPropsWithoutRef<'input'>, 'size' | 'type'> {
  /**
   * Size variant
   * @default 'md'
   */
  size?: CheckBoxSize;
  /**
   * Tone variant
   * @default 'primary'
   */
  tone?: CheckBoxTone;
  /**
   * Visual variant
   * @default 'solid'
   */
  variant?: CheckBoxVariant;
  /**
   * Indeterminate state (shows dash instead of checkmark)
   */
  indeterminate?: boolean;
  /**
   * Label text
   */
  label?: React.ReactNode;
  /**
   * Description text
   */
  description?: React.ReactNode;
}

const sizeStyles: Record<CheckBoxSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  free: '',
};

/**
 * CheckBox component
 *
 * Accessible checkbox with optional label and description.
 * Supports indeterminate state and multiple visual variants.
 *
 * **A11y**: Native input with proper label association, aria-checked="mixed" when indeterminate, Space toggles.
 * **Keyboard**: Space to toggle.
 *
 * @example
 * ```tsx
 * <CheckBox label="Accept terms" />
 * <CheckBox indeterminate label="Select all" />
 * <CheckBox size="sm" tone="accent" label="Subscribe" description="Get weekly updates" />
 * ```
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
        neutral: 'checked:bg-surface-contrast checked:border-border',
      };
      return toneMap[tone];
    };

    return (
      <div className={cn('flex items-start gap-2', className)}>
        <input
          ref={ref || inputRef}
          type="checkbox"
          id={checkboxId}
          disabled={disabled}
          aria-checked={indeterminate ? 'mixed' : undefined}
          className={cn(
            'appearance-none rounded-[var(--radius-sm)] border-2 border-border',
            'cursor-pointer bg-surface',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
            'transition-colors duration-200',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'checked:text-surface',
            sizeStyles[size],
            getToneClass()
          )}
          {...props}
        />
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
