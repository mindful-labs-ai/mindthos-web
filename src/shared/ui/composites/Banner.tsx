import React from 'react';

import { cn } from '@/lib/cn';

export type BannerTone = 'info' | 'success' | 'warn' | 'danger';

export interface BannerAction {
  label: string;
  onClick: () => void;
}

export interface BannerProps {
  title: string;
  description?: string;
  tone?: BannerTone;
  action?: BannerAction;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const toneStyles: Record<
  BannerTone,
  { bg: string; border: string; text: string }
> = {
  info: {
    bg: 'bg-info/10',
    border: 'border-info/20',
    text: 'text-info',
  },
  success: {
    bg: 'bg-success/10',
    border: 'border-success/20',
    text: 'text-success',
  },
  warn: {
    bg: 'bg-warn/10',
    border: 'border-warn/20',
    text: 'text-warn',
  },
  danger: {
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    text: 'text-danger',
  },
};

/**
 * Banner - 공지 배너
 * tone별 스타일, 선택적 액션 버튼
 * dismissible 옵션 지원
 *
 * @example
 * <Banner title="공지" action={{label:'더보기',onClick:...}} dismissible />
 */
export const Banner: React.FC<BannerProps> = ({
  title,
  description,
  tone = 'info',
  action,
  dismissible = false,
  onDismiss,
  className,
}) => {
  const styles = toneStyles[tone];

  return (
    <div
      role="region"
      aria-label="Banner"
      className={cn(
        'flex items-start gap-4 p-4',
        'rounded-[var(--radius-lg)] border-2',
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className="flex-1">
        <div className={cn('font-semibold', styles.text)}>{title}</div>
        {description && (
          <div className="mt-1 text-sm text-fg-muted">{description}</div>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'mt-2 text-sm font-medium',
              styles.text,
              'transition-opacity duration-200 hover:opacity-80'
            )}
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss banner"
          className={cn(
            'flex-shrink-0 rounded-[var(--radius-sm)] p-1',
            'hover:bg-black/5 dark:hover:bg-white/5',
            'transition-colors duration-200',
            styles.text
          )}
        >
          <svg
            className="h-4 w-4"
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
    </div>
  );
};

Banner.displayName = 'Banner';
