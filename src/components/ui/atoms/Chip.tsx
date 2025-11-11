import React from 'react';

import { cn } from '@/lib/cn';

export type ChipSize = 'sm' | 'md' | 'lg' | 'free';
export type ChipTone = 'primary' | 'secondary' | 'accent' | 'neutral';

export interface ChipProps {
  /**
   * Label text
   */
  label: React.ReactNode;
  /**
   * Tone variant
   * @default 'neutral'
   */
  tone?: ChipTone;
  /**
   * Size variant
   * @default 'md'
   */
  size?: ChipSize;
  /**
   * Close handler (shows close button when provided)
   */
  onClose?: () => void;
  /**
   * Additional className
   */
  className?: string;
}

const sizeStyles: Record<ChipSize, string> = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2',
  free: '',
};

const toneStyles: Record<ChipTone, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  accent: 'bg-accent/10 text-accent',
  neutral: 'bg-surface-contrast text-fg',
};

/**
 * Chip component
 *
 * Small pill-shaped label with optional close button.
 *
 * **A11y**: Close button has aria-label.
 *
 * @example
 * ```tsx
 * <Chip label="Tag" />
 * <Chip label="React" tone="primary" onClose={() => {}} />
 * <Chip label="Small" size="sm" tone="accent" />
 * ```
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
            'hover:bg-black/10 dark:hover:bg-white/10',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current',
            'transition-colors duration-200',
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
