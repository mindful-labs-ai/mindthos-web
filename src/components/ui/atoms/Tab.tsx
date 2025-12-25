import React from 'react';

import { cn } from '@/lib/cn';

export type TabSize = 'sm' | 'md' | 'lg' | 'free';
export type TabVariant = 'pill' | 'underline';

export interface TabItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface TabProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: TabSize;
  variant?: TabVariant;
  className?: string;
  fullWidth?: boolean;
}

const SCROLL_AMOUNT = 160;

const pillSizeStyles: Record<TabSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
  free: '',
};

const underlineSizeStyles: Record<TabSize, string> = {
  sm: 'px-3 py-2 pt-1 text-sm',
  md: 'px-4 py-3 pt-2 text-sm',
  lg: 'px-5 py-4 pt-3 text-base',
  free: '',
};

/**
 * Tab - 탭 네비게이션 컴포넌트
 * controlled/uncontrolled 모드 지원
 * role="tablist"로 접근성 준수, 화살표 키 네비게이션
 *
 * @example
 * <Tab items={[{value:'tab1',label:'탭1'}]} defaultValue="tab1" />
 * <Tab items={[{value:'tab1',label:'탭1'}]} variant="underline" />
 */
export const Tab: React.FC<TabProps> = ({
  items,
  value: controlledValue,
  defaultValue,
  onValueChange,
  size = 'md',
  variant = 'pill',
  className,
  fullWidth = false,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue || items[0]?.value
  );
  const isControlled = controlledValue !== undefined;
  const selectedValue = isControlled ? controlledValue : uncontrolledValue;
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const sizeStyles =
    variant === 'underline' ? underlineSizeStyles : pillSizeStyles;

  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  const handleScrollBy = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener('scroll', updateScrollState);

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      resizeObserver.disconnect();
    };
  }, [items.length, updateScrollState]);

  const handleSelect = (value: string) => {
    if (!isControlled) {
      setUncontrolledValue(value);
    }
    onValueChange?.(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent, _currentIndex: number) => {
    const enabledItems = items.filter((item) => !item.disabled);
    const currentEnabledIndex = enabledItems.findIndex(
      (item) => item.value === selectedValue
    );

    let nextIndex = currentEnabledIndex;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentEnabledIndex + 1) % enabledItems.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex =
          (currentEnabledIndex - 1 + enabledItems.length) % enabledItems.length;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = enabledItems.length - 1;
        break;
      default:
        return;
    }

    handleSelect(enabledItems[nextIndex].value);
  };

  return (
    <div
      className={cn(
        'relative',
        fullWidth ? 'w-full' : 'inline-flex max-w-[512px]',
        className
      )}
    >
      <div
        role="tablist"
        ref={scrollRef}
        className={cn(
          'scrollbar-hide flex items-center overflow-x-auto',
          fullWidth ? 'w-full' : 'w-fit max-w-full',
          variant === 'pill'
            ? 'gap-1 rounded-[var(--radius-md)] bg-surface-strong p-1'
            : 'gap-2'
        )}
      >
        {items.map((item, index) => {
          const isSelected = item.value === selectedValue;
          return (
            <button
              key={item.value}
              role="tab"
              type="button"
              aria-selected={isSelected}
              aria-controls={`tabpanel-${item.value}`}
              disabled={item.disabled}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => handleSelect(item.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'flex-shrink-0 whitespace-nowrap font-medium transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'min-w-20 items-center text-center disabled:cursor-not-allowed disabled:opacity-50',
                sizeStyles[size],
                variant === 'pill'
                  ? cn(
                      'rounded-[var(--radius-sm)]',
                      'focus-visible:ring-offset-2 focus-visible:ring-offset-surface-strong',
                      isSelected
                        ? 'bg-surface text-fg shadow-sm'
                        : 'bg-transparent text-fg-muted hover:text-fg'
                    )
                  : cn(
                      'relative rounded-t-lg border border-transparent',
                      isSelected
                        ? 'border-b-0 border-l-border border-r-border border-t-border bg-surface text-primary shadow-sm'
                        : 'border-b-0 border-l-border border-r-border border-t-border text-fg-muted hover:text-fg'
                    )
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {canScrollLeft && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10" />
          <button
            type="button"
            aria-label="이전 탭"
            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-surface shadow-sm ring-1 ring-border transition hover:bg-surface-strong"
            onClick={() => handleScrollBy('left')}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-fg"
            >
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      {canScrollRight && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10" />
          <button
            type="button"
            aria-label="다음 탭"
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-surface shadow-sm ring-1 ring-border transition hover:bg-surface-strong"
            onClick={() => handleScrollBy('right')}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-fg"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
};

Tab.displayName = 'Tab';
