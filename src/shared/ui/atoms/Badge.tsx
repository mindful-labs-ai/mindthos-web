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
  sm: 'px-2 py-0.5 typo-xs rounded-sm',
  md: 'px-2.5 py-1 typo-sm rounded-md',
  lg: 'px-3 py-1.5 typo-m rounded-lg',
};

const toneVariantStyles: Record<BadgeTone, Record<BadgeVariant, string>> = {
  primary: {
    solid: 'bg-primary text-primary-fg',
    soft: 'bg-primary-subtle text-primary',
    outline: 'border border-primary bg-primary-subtle text-primary',
  },
  secondary: {
    solid: 'bg-neutral text-neutral-fg',
    soft: 'bg-neutral-active text-fg',
    outline: 'border border-neutral text-neutral-fg bg-transparent',
  },
  accent: {
    solid: 'bg-accent text-primary-fg',
    soft: 'bg-accent/10 text-accent',
    outline: 'border border-accent text-accent bg-transparent',
  },
  neutral: {
    solid: 'bg-surface-contrast text-fg',
    soft: 'bg-surface-contrast text-fg',
    outline: 'border border-border text-fg bg-transparent',
  },
  success: {
    solid: 'bg-success text-primary-fg',
    soft: 'bg-green-20 text-green-80',
    outline: 'border border-success text-green-80 bg-transparent',
  },
  warning: {
    solid: 'bg-warn text-primary-fg',
    soft: 'bg-red-20 text-red-80',
    outline: 'border border-warn text-warn bg-transparent',
  },
  error: {
    solid: 'bg-danger text-danger-fg',
    soft: 'bg-danger-subtle text-danger',
    outline: 'border border-danger text-danger bg-transparent',
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
