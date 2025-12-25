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
  size?: BadgeSize;
  tone?: BadgeTone;
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
    soft: 'bg-primary-100 text-primary',
    outline: 'border border-primary bg-primary-100 text-primary',
  },
  secondary: {
    solid: 'bg-secondary text-surface',
    soft: 'bg-secondary text-fg',
    outline: 'border border-secondary text-secondary bg-transparent',
  },
  accent: {
    solid: 'bg-accent text-surface',
    soft: 'bg-accent text-accent',
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
 * Badge - 상태, 카테고리, 메타데이터 표시용 라벨
 * 다양한 size, tone, variant 조합 지원
 *
 * @example
 * <Badge tone="success" variant="soft">SOAP</Badge>
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
          'inline-flex items-center justify-center whitespace-nowrap font-medium',
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
