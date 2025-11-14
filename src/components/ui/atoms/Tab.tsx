import React from 'react';

import { cn } from '@/lib/cn';

export type TabSize = 'sm' | 'md' | 'lg' | 'free';

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
  className?: string;
}

const sizeStyles: Record<TabSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
  free: '',
};

/**
 * Tab - 탭 네비게이션 컴포넌트
 * controlled/uncontrolled 모드 지원
 * role="tablist"로 접근성 준수, 화살표 키 네비게이션
 *
 * @example
 * <Tab items={[{value:'tab1',label:'탭1'}]} defaultValue="tab1" />
 */
export const Tab: React.FC<TabProps> = ({
  items,
  value: controlledValue,
  defaultValue,
  onValueChange,
  size = 'md',
  className,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue || items[0]?.value
  );
  const isControlled = controlledValue !== undefined;
  const selectedValue = isControlled ? controlledValue : uncontrolledValue;

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
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-surface-contrast p-1',
        className
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
              'rounded-[var(--radius-sm)] font-medium',
              'transition-colors duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-contrast',
              'disabled:cursor-not-allowed disabled:opacity-50',
              sizeStyles[size],
              isSelected
                ? 'bg-surface text-fg shadow-sm'
                : 'bg-transparent text-fg-muted hover:text-fg'
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

Tab.displayName = 'Tab';
