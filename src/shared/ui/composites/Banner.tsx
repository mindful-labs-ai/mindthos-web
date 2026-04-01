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
        'rounded-lg border-2',
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className="flex-1">
        <div className={cn('font-emphasize', styles.text)}>{title}</div>
        {description && (
          <div className="typo-sm mt-1 text-fg-muted">{description}</div>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'typo-sm mt-2 font-medium',
              styles.text,
              'transition-opacity duration-normal lg:hover:opacity-80'
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
            'flex-shrink-0 rounded-sm p-1',
            'lg:hover:bg-neutral-active',
            'transition-default',
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
