import React from 'react';

import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/cn';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'free';
export type ButtonTone =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'surface'
  | 'danger';
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'soft';

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  size?: ButtonSize;
  tone?: ButtonTone;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  asChild?: boolean;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 typo-sm rounded-sm',
  md: 'h-10 px-4 typo-sm rounded-md',
  lg: 'h-12 px-5 typo-m rounded-lg',
  free: '',
};

const toneVariantStyles: Record<ButtonTone, Record<ButtonVariant, string>> = {
  primary: {
    solid: 'interact-primary-bg text-primary-fg',
    outline:
      'border border-primary text-primary bg-primary-subtle hover:bg-primary-hover',
    ghost: 'bg-transparent text-primary hover:bg-primary-subtle',
    soft: 'bg-primary-subtle text-primary hover:bg-primary-hover',
  },
  secondary: {
    solid: 'bg-neutral text-neutral-fg hover:bg-neutral-hover',
    outline:
      'border border-neutral text-neutral-fg bg-transparent hover:bg-neutral-active',
    ghost: 'bg-transparent text-neutral-fg hover:bg-neutral-active',
    soft: 'bg-neutral-active text-neutral-fg hover:bg-neutral-hover',
  },
  accent: {
    solid: 'bg-accent text-primary-fg hover:opacity-90',
    outline:
      'border border-accent text-accent bg-transparent hover:bg-accent/10',
    ghost: 'bg-transparent text-accent hover:bg-accent/10',
    soft: 'bg-accent/10 text-accent hover:bg-accent/20',
  },
  neutral: {
    solid: 'bg-surface-contrast text-fg hover:bg-neutral',
    outline: 'border-default text-fg bg-transparent hover:bg-surface-contrast',
    ghost: 'bg-transparent text-fg hover:bg-surface-contrast',
    soft: 'bg-surface-contrast text-fg hover:bg-neutral',
  },
  surface: {
    solid: 'bg-surface text-fg-muted hover:bg-neutral',
    outline: 'border-default text-fg bg-transparent hover:bg-surface',
    ghost: 'bg-transparent text-fg hover:bg-surface',
    soft: 'bg-surface-contrast text-fg hover:bg-neutral',
  },
  danger: {
    solid: 'interact-danger-bg text-danger-fg',
    outline:
      'border border-danger text-danger bg-transparent hover:bg-danger-subtle',
    ghost: 'bg-transparent text-danger hover:bg-danger-subtle',
    soft: 'bg-danger-subtle text-danger hover:bg-danger-hover',
  },
};

/**
 * Button - 다양한 스타일과 상태를 지원하는 버튼
 * size, tone, variant 조합으로 다양한 디자인 구현
 * loading 상태, icon 지원
 *
 * @example
 * <Button tone="primary" variant="solid" loading>제출</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      size = 'md',
      tone = 'neutral',
      variant = 'solid',
      loading = false,
      disabled,
      icon,
      iconRight,
      asChild = false,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium',
          'transition-default',
          'focus-default',
          'disabled:cursor-not-allowed disabled:bg-surface-contrast disabled:text-fg-muted',
          sizeStyles[size],
          toneVariantStyles[tone][variant],
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon}
        {children}
        {!loading && iconRight}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
