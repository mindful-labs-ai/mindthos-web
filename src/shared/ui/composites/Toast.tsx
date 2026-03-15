import React from 'react';

import { cn } from '@/lib/cn';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  title: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

/**
 * ToastProvider - 토스트 알림 컨텍스트 제공
 *
 * @example
 * <ToastProvider><App /></ToastProvider>
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...options, id };

    setToasts((prev) => [...prev, newToast]);

    const duration = options.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          'pointer-events-none fixed left-4 right-4 top-4 z-toast',
          // 데스크톱: 기존 세로 나열
          'sm:left-auto sm:right-4 sm:flex sm:w-auto sm:flex-col sm:gap-2'
        )}
      >
        {toasts.map((t, index) => (
          <ToastItem
            key={t.id}
            toast={t}
            index={index}
            total={toasts.length}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

interface ToastItemProps {
  toast: Toast;
  index: number;
  total: number;
  onClose: () => void;
}

const MAX_VISIBLE_STACK = 3;

const ToastItem: React.FC<ToastItemProps> = ({
  toast,
  index,
  total,
  onClose,
}) => {
  // 모바일 Sonner 스타일: 최신(마지막)이 맨 위, 이전 것들은 뒤로 축소
  const reverseIndex = total - 1 - index; // 0 = 맨 위(최신), 1 = 그 뒤, ...
  const isHidden = reverseIndex >= MAX_VISIBLE_STACK;

  return (
    <div
      role="status"
      style={
        {
          // 모바일 스택용 inline style (sm+ 에서는 CSS로 덮어씀)
          '--stack-offset': `${reverseIndex * 8}px`,
          '--stack-scale': `${1 - reverseIndex * 0.05}`,
          '--stack-opacity': isHidden ? '0' : '1',
        } as React.CSSProperties
      }
      className={cn(
        'pointer-events-auto',
        'w-full sm:min-w-[300px] sm:max-w-md',
        'rounded-[var(--radius-lg)] border-2 border-border bg-surface shadow-lg',
        'p-4',
        // 모바일: absolute 스택 (최신이 위, 나머지는 뒤로)
        index < total - 1 &&
          'absolute left-0 right-0 top-0 sm:relative sm:left-auto sm:right-auto',
        'translate-y-[var(--stack-offset)] scale-[var(--stack-scale)] opacity-[var(--stack-opacity)]',
        'sm:translate-y-0 sm:scale-100 sm:opacity-100',
        'transition-all duration-200 ease-out',
        'origin-top',
        'animate-[slideIn_0.2s_ease-out]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="font-semibold text-fg">{toast.title}</div>
          {toast.description && (
            <div className="mt-1 text-sm text-fg-muted">
              {toast.description}
            </div>
          )}
          {toast.action && (
            <button
              onClick={() => {
                toast.action?.onClick();
                onClose();
              }}
              className={cn(
                'mt-2 rounded-[var(--radius-sm)] text-sm font-medium text-primary hover:text-primary-600',
                'transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close notification"
          className={cn(
            'flex-shrink-0 rounded-[var(--radius-sm)] p-1',
            'text-fg-muted hover:text-fg',
            'hover:bg-surface-contrast',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
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

/**
 * useToast - 토스트 알림 표시 훅
 *
 * @example
 * const { toast } = useToast();
 * toast({ title: 'Success', description: 'Saved' });
 */
export const useToast = (): ToastContextValue => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
