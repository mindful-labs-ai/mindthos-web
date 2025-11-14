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
        className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto',
        'min-w-[300px] max-w-md',
        'rounded-[var(--radius-lg)] border-2 border-border bg-surface shadow-lg',
        'p-4',
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
                'mt-2 text-sm font-medium text-primary hover:text-primary-600',
                'transition-colors duration-200'
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
