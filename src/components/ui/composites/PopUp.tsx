import React from 'react';

import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

export type PopUpPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface PopUpProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: PopUpPlacement;
  className?: string;
}

/**
 * PopUp - 팝오버 컴포넌트 (Portal 사용)
 * trigger 클릭 시 content 표시
 * Esc 키로 닫기, 외부 클릭 감지
 *
 * @example
 * // 4방향 (기본)
 * <PopUp trigger={<button>열기</button>} content={<div>내용</div>} placement="bottom" />
 *
 * // 8방향 (대각선 포함)
 * <PopUp trigger={<button>열기</button>} content={<div>내용</div>} placement="bottom-right" />
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
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
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

  // 위치 계산
  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top - contentRect.height - 8;
        left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + 8;
        left = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
        left = triggerRect.left - contentRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
        left = triggerRect.right + 8;
        break;
      case 'top-left':
        top = triggerRect.bottom - contentRect.height;
        left = triggerRect.left - contentRect.width - 8;
        break;
      case 'top-right':
        top = triggerRect.bottom - contentRect.height;
        left = triggerRect.right + 8;
        break;
      case 'bottom-left':
        top = triggerRect.top;
        left = triggerRect.left - contentRect.width - 8;
        break;
      case 'bottom-right':
        top = triggerRect.top;
        left = triggerRect.right + 8;
        break;
    }

    // 화면 경계 체크
    const padding = 8;
    top = Math.max(
      padding,
      Math.min(top, window.innerHeight - contentRect.height - padding)
    );
    left = Math.max(
      padding,
      Math.min(left, window.innerWidth - contentRect.width - padding)
    );

    setPosition({ top, left });
  }, [placement]);

  // 위치 업데이트
  React.useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isOpen, updatePosition]);

  // 키보드 & 외부 클릭 처리
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        !contentRef.current.contains(e.target as Node)
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
    <>
      <div ref={triggerRef} className="relative inline-block w-full">
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
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={contentRef}
            id={contentId}
            role="dialog"
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 9999,
            }}
            className={cn(
              'min-w-[200px] max-w-xs',
              'rounded-[var(--radius-md)] border-2 border-border bg-surface shadow-lg',
              'p-4',
              'animate-[fadeIn_0.15s_ease-out]',
              className
            )}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};

PopUp.displayName = 'PopUp';
