import React from 'react';

import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Tooltip - 호버/포커스 시 정보 표시 (Portal 사용)
 * placement, delay 커스터마이징 가능
 * overflow-hidden 부모 요소에서도 정상 작동
 *
 * @example
 * <Tooltip content="Info"><button>Hover</button></Tooltip>
 */
export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  placement = 'top',
  delay = 200,
  disabled = false,
  className,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const tooltipId = React.useId();

  // 위치 계산
  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + 8;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + 8;
        break;
    }

    // 화면 경계 체크
    const padding = 8;
    top = Math.max(
      padding,
      Math.min(top, window.innerHeight - tooltipRect.height - padding)
    );
    left = Math.max(
      padding,
      Math.min(left, window.innerWidth - tooltipRect.width - padding)
    );

    setPosition({ top, left });
  }, [placement]);

  // 위치 업데이트
  React.useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isVisible, updatePosition]);

  const showTooltip = React.useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [disabled, delay]);

  const hideTooltip = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        className="relative inline-block"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {isVisible &&
        !disabled &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 9999,
            }}
            className={cn(
              'pointer-events-none',
              'max-w-xs',
              'rounded-[var(--radius-md)] bg-surface px-3 py-2',
              'text-xs text-surface shadow-lg',
              'animate-[fadeIn_0.1s_ease-out]',
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

Tooltip.displayName = 'Tooltip';
