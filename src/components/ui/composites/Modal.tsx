import React from 'react';

import { cn } from '@/lib/cn';

export interface ModalProps {
  /**
   * Open state
   */
  open: boolean;
  /**
   * Change handler
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Modal title
   */
  title?: React.ReactNode;
  /**
   * Modal description
   */
  description?: React.ReactNode;
  /**
   * Initial focus ref
   */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /**
   * Close on overlay click
   * @default true
   */
  closeOnOverlay?: boolean;
  /**
   * Content
   */
  children: React.ReactNode;
  /**
   * Additional className for the content
   */
  className?: string;
}

/**
 * Modal (Dialog) component
 *
 * Accessible modal dialog with focus trap and backdrop.
 *
 * **A11y**: role="dialog" aria-modal, focus trap, Esc to close, focus return.
 * **Keyboard**: Esc to close, Tab traps focus within modal.
 *
 * @example
 * ```tsx
 * <Modal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Confirm Action"
 *   description="Are you sure you want to proceed?"
 * >
 *   <div>Modal content here</div>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  initialFocusRef,
  closeOnOverlay = true,
  children,
  className,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus initial element or first focusable element
      setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else {
          const firstFocusable = contentRef.current?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        }
      }, 0);
    } else {
      // Return focus
      previousFocusRef.current?.focus();
    }
  }, [open, initialFocusRef]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }

      // Focus trap
      if (e.key === 'Tab' && open && contentRef.current) {
        const focusableElements =
          contentRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 animate-[fadeIn_0.2s_ease-out] bg-black/50 backdrop-blur-sm"
        onClick={() => closeOnOverlay && onOpenChange(false)}
        aria-hidden="true"
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
          'max-h-[90vh] w-full max-w-lg overflow-auto',
          'rounded-[var(--radius-lg)] border-2 border-border bg-surface shadow-xl',
          'animate-[scaleIn_0.2s_ease-out]',
          className
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="border-b border-border px-6 py-4">
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
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4">{children}</div>

        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close dialog"
          className={cn(
            'absolute right-4 top-4',
            'rounded-[var(--radius-sm)] p-1',
            'text-fg-muted hover:bg-surface-contrast hover:text-fg',
            'transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
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
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';
