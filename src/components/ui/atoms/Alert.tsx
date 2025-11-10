import React from 'react';

import { cn } from '@/lib/cn';

export type AlertTone = 'info' | 'success' | 'warn' | 'danger';

export interface AlertProps {
  /**
   * Alert title
   */
  title?: string;
  /**
   * Alert content/description
   */
  children: React.ReactNode;
  /**
   * Tone variant
   * @default 'info'
   */
  tone?: AlertTone;
  /**
   * Show icon
   * @default true
   */
  showIcon?: boolean;
  /**
   * Custom icon
   */
  icon?: React.ReactNode;
  /**
   * Dismissible
   * @default false
   */
  dismissible?: boolean;
  /**
   * Dismiss handler
   */
  onDismiss?: () => void;
  /**
   * Additional className
   */
  className?: string;
}

const InfoIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const SuccessIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const WarnIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const DangerIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const toneStyles: Record<
  AlertTone,
  { bg: string; border: string; text: string; icon: React.ReactNode }
> = {
  info: {
    bg: 'bg-info/10',
    border: 'border-info/20',
    text: 'text-info',
    icon: <InfoIcon />,
  },
  success: {
    bg: 'bg-success/10',
    border: 'border-success/20',
    text: 'text-success',
    icon: <SuccessIcon />,
  },
  warn: {
    bg: 'bg-warn/10',
    border: 'border-warn/20',
    text: 'text-warn',
    icon: <WarnIcon />,
  },
  danger: {
    bg: 'bg-danger/10',
    border: 'border-danger/20',
    text: 'text-danger',
    icon: <DangerIcon />,
  },
};

/**
 * Alert component
 *
 * Inline alert message with various tones and optional icon.
 *
 * **A11y**: role="alert" for important messages.
 *
 * @example
 * ```tsx
 * <Alert tone="info" title="Note">
 *   This is an informational message.
 * </Alert>
 * <Alert tone="danger" dismissible onDismiss={() => {}}>
 *   Error occurred!
 * </Alert>
 * ```
 */
export const Alert: React.FC<AlertProps> = ({
  title,
  children,
  tone = 'info',
  showIcon = true,
  icon,
  dismissible = false,
  onDismiss,
  className,
}) => {
  const styles = toneStyles[tone];
  const displayIcon = icon || styles.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-[var(--radius-md)] border-2 p-4',
        styles.bg,
        styles.border,
        className
      )}
    >
      {showIcon && (
        <div className={cn('flex-shrink-0', styles.text)}>{displayIcon}</div>
      )}
      <div className="flex-1 space-y-1">
        {title && (
          <div className={cn('font-semibold', styles.text)}>{title}</div>
        )}
        <div className="text-sm text-fg">{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss alert"
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

Alert.displayName = 'Alert';
