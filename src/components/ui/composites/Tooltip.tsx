import React from 'react';

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

const placementStyles: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

/**
 * Tooltip - 호버/포커스 시 정보 표시
 * placement, delay 커스터마이징 가능
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
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();
  const tooltipId = React.useId();

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const trigger = React.useMemo(
    () =>
      React.cloneElement(children, {
        onMouseEnter: (e: React.MouseEvent) => {
          showTooltip();
          children.props.onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          hideTooltip();
          children.props.onMouseLeave?.(e);
        },
        onFocus: (e: React.FocusEvent) => {
          showTooltip();
          children.props.onFocus?.(e);
        },
        onBlur: (e: React.FocusEvent) => {
          hideTooltip();
          children.props.onBlur?.(e);
        },
        'aria-describedby': isVisible ? tooltipId : undefined,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [children, isVisible, tooltipId]
  );

  return (
    <div className="relative inline-block">
      {trigger}
      {isVisible && !disabled && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute z-50',
            'pointer-events-none',
            'max-w-xs',
            'rounded-[var(--radius-md)] bg-fg px-3 py-2',
            'text-xs text-surface shadow-lg',
            'animate-[fadeIn_0.1s_ease-out]',
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

Tooltip.displayName = 'Tooltip';
