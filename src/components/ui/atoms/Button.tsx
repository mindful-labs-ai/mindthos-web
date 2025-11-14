import React from 'react';

import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/cn';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'free';
export type ButtonTone =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'surface';
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'soft';

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  /**
   * Size variant of the button
   * - `sm`: text-sm px-3 h-8 rounded-sm
   * - `md`: text-sm px-4 h-10 rounded-md
   * - `lg`: text-base px-5 h-12 rounded-lg
   * - `free`: minimal baseline; control via className
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * Tone variant of the button
   * - `primary`: primary color scheme
   * - `secondary`: secondary/gray color scheme
   * - `accent`: accent color scheme
   * - `neutral`: neutral color scheme
   * @default 'neutral'
   */
  tone?: ButtonTone;
  /**
   * Visual variant of the button
   * - `solid`: filled background
   * - `outline`: bordered with transparent background
   * - `ghost`: transparent with hover effect
   * - `soft`: light background with tone color
   * @default 'solid'
   */
  variant?: ButtonVariant;
  /**
   * Loading state - shows spinner and disables interaction
   */
  loading?: boolean;
  /**
   * Icon to display before children
   */
  icon?: React.ReactNode;
  /**
   * Icon to display after children
   */
  iconRight?: React.ReactNode;
  /**
   * Render as child element (using Radix Slot)
   */
  asChild?: boolean;
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-sm rounded-[var(--radius-md)]',
  lg: 'h-12 px-5 text-base rounded-[var(--radius-lg)]',
  free: '',
};

const toneVariantStyles: Record<ButtonTone, Record<ButtonVariant, string>> = {
  primary: {
    solid: 'bg-primary text-surface hover:bg-primary-600',
    outline:
      'border-2 border-primary text-primary bg-transparent hover:bg-primary/10',
    ghost: 'bg-transparent text-primary hover:bg-primary/10',
    soft: 'bg-primary/10 text-primary hover:bg-primary/20',
  },
  secondary: {
    solid: 'bg-secondary text-surface hover:bg-secondary-600',
    outline:
      'border-2 border-secondary text-secondary bg-transparent hover:bg-secondary/10',
    ghost: 'bg-transparent text-secondary hover:bg-secondary/10',
    soft: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
  },
  accent: {
    solid: 'bg-accent text-surface hover:opacity-90',
    outline:
      'border-2 border-accent text-accent bg-transparent hover:bg-accent/10',
    ghost: 'bg-transparent text-accent hover:bg-accent/10',
    soft: 'bg-accent/10 text-accent hover:bg-accent/20',
  },
  neutral: {
    solid: 'bg-surface-contrast text-fg hover:bg-border',
    outline:
      'border-2 border-border text-fg bg-transparent hover:bg-surface-contrast',
    ghost: 'bg-transparent text-fg hover:bg-surface-contrast',
    soft: 'bg-surface-contrast text-fg hover:bg-border',
  },
  surface: {
    solid: 'bg-surface text-fg-muted hover:bg-border',
    outline: 'border-2 border-border text-fg bg-transparent hover:bg-surface',
    ghost: 'bg-transparent text-fg hover:bg-surface',
    soft: 'bg-surface-contrast text-fg hover:bg-border',
  },
};

/**
 * Button component
 *
 * A versatile button component with multiple size, tone, and variant options.
 * Supports loading state, icons, and full className override.
 *
 * **A11y**: Uses `type="button"` by default, `aria-busy` when loading, proper disabled state, focus-visible ring.
 * **Keyboard**: Responds to Enter and Space keys.
 *
 * @example
 * ```tsx
 * <Button size="md" tone="primary" variant="solid">
 *   Click me
 * </Button>
 *
 * <Button loading icon={<Icon />}>
 *   Loading...
 * </Button>
 *
 * <Button size="free" className="w-full py-6">
 *   Custom size via className
 * </Button>
 * ```
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
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'disabled:cursor-not-allowed disabled:opacity-50',
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
