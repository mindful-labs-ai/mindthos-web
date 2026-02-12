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
  triggerClassName?: string; // trigger wrapper 커스텀 className
  /** 외부 클릭 시 닫기 비활성화 (가이드 모드 등) */
  disableOutsideClick?: boolean;
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
  triggerClassName,
  disableOutsideClick = false,
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
      // 외부 클릭 비활성화 시 ESC도 무시
      if (disableOutsideClick) return;

      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      // 외부 클릭 비활성화 시 무시
      if (disableOutsideClick) return;

      const target = e.target as Node;

      if (
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(target) &&
        !contentRef.current.contains(target)
      ) {
        // 중첩 PopUp의 portal 콘텐츠 클릭인지 확인 — portal로 body에 렌더링된 자식 PopUp 영역 클릭 시 무시
        const targetEl = target as HTMLElement;
        if (targetEl.closest?.('[data-popup-portal]')) {
          return;
        }

        // 외부 클릭 시 이벤트 전파 중단 (외부 요소의 이벤트 실행 방지)
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // capture phase에서 먼저 감지하여 외부 클릭 이벤트 차단
      document.addEventListener('mousedown', handleClickOutside, true);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [isOpen, setOpen, disableOutsideClick]);

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('relative inline-block', triggerClassName || '')}
      >
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
            role="presentation"
            data-popup-portal
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
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
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

PopUp.displayName = 'PopUp';
