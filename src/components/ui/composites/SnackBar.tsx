import React from 'react';

import { cn } from '@/lib/cn';

export interface SnackBarAction {
  label: string;
  onClick: () => void;
}

export interface SnackBarProps {
  open: boolean;
  message: string;
  action?: SnackBarAction;
  onOpenChange: (open: boolean) => void;
  duration?: number;
  className?: string;
}

/**
 * SnackBar component
 *
 * Bottom announcement/notification bar.
 *
 * **A11y**: aria-live assertive for critical messages, otherwise polite.
 * **Keyboard**: Esc to dismiss.
 *
 * @example
 * ```tsx
 * <SnackBar
 *   open={isOpen}
 *   message="File saved successfully"
 *   action={{ label: 'Undo', onClick: () => {} }}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 */
export const SnackBar: React.FC<SnackBarProps> = ({
  open,
  message,
  action,
  onOpenChange,
  duration = 5000,
  className,
}) => {
  React.useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onOpenChange]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'fixed bottom-4 left-1/2 z-50 -translate-x-1/2',
        'min-w-[300px] max-w-md',
        'rounded-[var(--radius-lg)] border-2 border-border bg-surface-contrast shadow-lg',
        'px-4 py-3',
        'flex items-center justify-between gap-4',
        'animate-[slideUp_0.2s_ease-out]',
        className
      )}
    >
      <span className="text-sm text-fg">{message}</span>
      <div className="flex flex-shrink-0 items-center gap-2">
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onOpenChange(false);
            }}
            className={cn(
              'text-sm font-medium text-primary hover:text-primary-600',
              'transition-colors duration-200'
            )}
          >
            {action.label}
          </button>
        )}
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          className={cn(
            'rounded-[var(--radius-sm)] p-1',
            'text-fg-muted hover:bg-surface-contrast hover:text-fg',
            'transition-colors duration-200'
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
      </div>
    </div>
  );
};

SnackBar.displayName = 'SnackBar';
