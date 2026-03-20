import React from 'react';

import { cn } from '@/lib/cn';

export type ChipSize = 'sm' | 'md' | 'lg' | 'free';
export type ChipTone = 'primary' | 'secondary' | 'accent' | 'neutral';

export interface ChipProps {
  label: React.ReactNode;
  tone?: ChipTone;
  size?: ChipSize;
  onClose?: () => void;
  className?: string;
}

const sizeStyles: Record<ChipSize, string> = {
  sm: 'px-2 py-0.5 typo-xs gap-1 leading-chip',
  md: 'px-3 py-1 typo-sm gap-1.5 leading-chip',
  lg: 'px-4 py-1.5 typo-m gap-2 leading-chip',
  free: '',
};

const toneStyles: Record<ChipTone, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-neutral/10 text-neutral-fg',
  accent: 'bg-accent/10 text-accent',
  neutral: 'bg-surface-contrast text-fg',
};

/**
 * Chip - 작은 알약 모양 라벨
 * 선택적 닫기 버튼 지원
 * aria-label로 접근성 준수
 *
 * @example
 * <Chip label="태그" onClose={() => {}} />
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  tone = 'neutral',
  size = 'md',
  onClose,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeStyles[size],
        toneStyles[tone],
        className
      )}
    >
      {label}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={`Remove ${label}`}
          className={cn(
            'inline-flex items-center justify-center rounded-full',
            'hover:bg-neutral-active',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current',
            'transition-default',
            size === 'sm' && 'h-3 w-3',
            size === 'md' && 'h-4 w-4',
            size === 'lg' && 'h-5 w-5'
          )}
        >
          <svg
            className={cn(
              size === 'sm' && 'h-2 w-2',
              size === 'md' && 'h-3 w-3',
              size === 'lg' && 'h-3.5 w-3.5'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

Chip.displayName = 'Chip';
