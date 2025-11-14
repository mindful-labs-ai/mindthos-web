import React from 'react';

import { cn } from '@/lib/cn';

export type BadgeSize = 'sm' | 'md' | 'lg';
export type BadgeTone =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error';
export type BadgeVariant = 'solid' | 'soft' | 'outline';

export interface BadgeProps extends React.ComponentPropsWithoutRef<'span'> {
  /**
   * Size variant of the badge
   * - `sm`: text-xs px-2 py-0.5
   * - `md`: text-sm px-2.5 py-1
   * - `lg`: text-base px-3 py-1.5
   * @default 'md'
   */
  size?: BadgeSize;
  /**
   * Tone variant of the badge
   * @default 'neutral'
   */
  tone?: BadgeTone;
  /**
   * Visual variant of the badge
   * - `solid`: filled background
   * - `soft`: light background with tone color
   * - `outline`: bordered with transparent background
   * @default 'soft'
   */
  variant?: BadgeVariant;
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs rounded-[var(--radius-sm)]',
  md: 'px-2.5 py-1 text-sm rounded-[var(--radius-md)]',
  lg: 'px-3 py-1.5 text-base rounded-[var(--radius-lg)]',
};

const toneVariantStyles: Record<BadgeTone, Record<BadgeVariant, string>> = {
  primary: {
    solid: 'bg-primary text-surface',
    soft: 'bg-primary/10 text-primary',
    outline: 'border border-primary text-primary bg-transparent',
  },
  secondary: {
    solid: 'bg-secondary text-surface',
    soft: 'bg-secondary/10 text-secondary',
    outline: 'border border-secondary text-secondary bg-transparent',
  },
  accent: {
    solid: 'bg-accent text-surface',
    soft: 'bg-accent/10 text-accent',
    outline: 'border border-accent text-accent bg-transparent',
  },
  neutral: {
    solid: 'bg-surface-contrast text-fg',
    soft: 'bg-surface-contrast text-fg',
    outline: 'border border-border text-fg bg-transparent',
  },
  success: {
    solid: 'bg-green-500 text-white',
    soft: 'bg-green-50 text-green-700',
    outline: 'border border-green-500 text-green-700 bg-transparent',
  },
  warning: {
    solid: 'bg-yellow-500 text-white',
    soft: 'bg-yellow-50 text-yellow-700',
    outline: 'border border-yellow-500 text-yellow-700 bg-transparent',
  },
  error: {
    solid: 'bg-red-500 text-white',
    soft: 'bg-red-50 text-red-700',
    outline: 'border border-red-500 text-red-700 bg-transparent',
  },
};

/**
 * Badge component
 *
 * A small label component for displaying status, categories, or metadata.
 * Supports multiple sizes, tones, and variants.
 *
 * @example
 * ```tsx
 * <Badge tone="success" variant="soft">SOAP</Badge>
 * <Badge tone="primary" size="sm">New</Badge>
 * <Badge tone="error" variant="solid">Error</Badge>
 * ```
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      size = 'md',
      tone = 'neutral',
      variant = 'soft',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium whitespace-nowrap',
          sizeStyles[size],
          toneVariantStyles[tone][variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
