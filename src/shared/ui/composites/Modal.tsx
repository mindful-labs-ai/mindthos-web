import React from 'react';

import { cn } from '@/lib/cn';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement>;
  closeOnOverlay?: boolean;
  hideCloseButton?: boolean;
  children: React.ReactNode;
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function getVisibleFocusable(container: HTMLElement): HTMLElement[] {
  const all = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(all).filter(
    (el) =>
      !el.hasAttribute('disabled') &&
      (el.offsetWidth > 0 || el.offsetHeight > 0)
  );
}

/**
 * Modal - 접근 가능한 다이얼로그
 * 포커스 트랩(sentinel 방식), 백드롭 클릭 종료, ESC 키 지원
 *
 * @example
 * <Modal open={isOpen} onOpenChange={setIsOpen} title="Title">Content</Modal>
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  initialFocusRef,
  closeOnOverlay = true,
  hideCloseButton = false,
  children,
  className,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  // 초기 포커스 설정 & 닫힐 때 포커스 복원
  React.useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else if (contentRef.current) {
          const first = getVisibleFocusable(contentRef.current)[0];
          first?.focus();
        }
      }, 0);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open, initialFocusRef]);

  // ESC 닫기 + 스크롤 잠금
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  // Sentinel 포커스 핸들러: 모달 경계에 도달하면 반대쪽으로 순환
  const handleSentinelFocus = React.useCallback(
    (position: 'start' | 'end') => {
      if (!contentRef.current) return;
      const focusable = getVisibleFocusable(contentRef.current);
      if (focusable.length === 0) return;

      if (position === 'start') {
        // 시작 sentinel에 도달 → 마지막 요소로
        focusable[focusable.length - 1].focus();
      } else {
        // 끝 sentinel에 도달 → 첫 번째 요소로
        focusable[0].focus();
      }
    },
    []
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 animate-[fadeIn_0.2s_ease-out] bg-black/50 backdrop-blur-sm"
        onClick={() => closeOnOverlay && onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Focus trap: start sentinel */}
      <span
        tabIndex={0}
        role="button"
        onFocus={() => handleSentinelFocus('start')}
        aria-hidden="true"
        style={{ position: 'fixed', opacity: 0, pointerEvents: 'none' }}
      />

      {/* Content */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
        className={cn(
          'relative z-10',
          'max-h-[90vh] w-full overflow-auto',
          'rounded-[var(--radius-lg)] border-2 border-border bg-surface shadow-xl',
          'animate-[scaleIn_0.2s_ease-out]',
          'px-6 py-4',
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <>
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-fg">
                {title}
              </h2>
            )}
            {description && (
              <p id="modal-description" className="mt-1 text-sm text-fg-muted">
                {description}
              </p>
            )}
            <div className="mb-3 border-b border-border pt-3" />
          </>
        )}

        {/* Body */}
        {children}

        {/* Close button */}
        {!hideCloseButton && (
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
            className={cn(
              'absolute right-4 top-4',
              'rounded-[var(--radius-sm)] p-1',
              'text-fg-muted hover:bg-surface-contrast hover:text-fg',
              'transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
          >
            <svg
              className="h-5 w-5"
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

      {/* Focus trap: end sentinel */}
      <span
        tabIndex={0}
        role="button"
        onFocus={() => handleSentinelFocus('end')}
        aria-hidden="true"
        style={{ position: 'fixed', opacity: 0, pointerEvents: 'none' }}
      />
    </div>
  );
};

Modal.displayName = 'Modal';
