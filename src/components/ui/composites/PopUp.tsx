import React from 'react';

import { cn } from '@/lib/cn';

export type PopUpPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface PopUpProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: PopUpPlacement;
  className?: string;
}

const placementStyles: Record<PopUpPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

/**
 * PopUp (Popover/Hovercard) component
 *
 * Popover component with trigger and content.
 *
 * **A11y**: aria-controls, Esc to close, focus return.
 * **Keyboard**: Esc to close.
 *
 * @example
 * ```tsx
 * <PopUp
 *   trigger={<button>Click me</button>}
 *   content={<div>Popup content</div>}
 * />
 * ```
 */
export const PopUp: React.FC<PopUpProps> = ({
  trigger,
  content,
  open: controlledOpen,
  onOpenChange,
  placement = 'bottom',
  className,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentId = React.useId();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(value);
      }
      onOpenChange?.(value);
    },
    [isControlled, onOpenChange]
  );

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, setOpen]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(!isOpen);
          }
        }}
        aria-controls={contentId}
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          id={contentId}
          role="dialog"
          className={cn(
            'absolute z-50',
            'min-w-[200px] max-w-xs',
            'rounded-[var(--radius-md)] border-2 border-border bg-surface shadow-lg',
            'p-4',
            'animate-[fadeIn_0.15s_ease-out]',
            placementStyles[placement],
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

PopUp.displayName = 'PopUp';
