import React from 'react';

import { cn } from '@/lib/cn';

export interface SidebarItem {
  icon?: React.ReactNode;
  label: string;
  href?: string;
  value?: string;
  disabled?: boolean;
}

export interface SidebarProps {
  items: SidebarItem[];
  collapsible?: boolean;
  onSelect?: (value: string) => void;
  activeValue?: string;
  className?: string;
}

/**
 * Sidebar - 네비게이션 사이드바
 * 키보드 네비게이션 (↑↓), 활성 항목 표시
 *
 * @example
 * <Sidebar items={[{ icon: <Icon />, label: 'Home', value: 'home' }]} />
 */
export const Sidebar: React.FC<SidebarProps> = ({
  items,
  collapsible: _collapsible = false,
  onSelect,
  activeValue,
  className,
}) => {
  const [focusedIndex, setFocusedIndex] = React.useState(0);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabledItems = items.filter((item) => !item.disabled);
    const currentEnabledIndex = enabledItems.findIndex((_, i) => {
      const originalIndex = items.indexOf(enabledItems[i]);
      return originalIndex === index;
    });

    let nextIndex = currentEnabledIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentEnabledIndex + 1) % enabledItems.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex =
          (currentEnabledIndex - 1 + enabledItems.length) % enabledItems.length;
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const item = items[index];
        if (!item.disabled && (item.value || item.href)) {
          onSelect?.(item.value || item.href || '');
        }
        return;
      }
      default:
        return;
    }

    const nextItem = enabledItems[nextIndex];
    const nextOriginalIndex = items.indexOf(nextItem);
    setFocusedIndex(nextOriginalIndex);
  };

  return (
    <nav
      className={cn(
        'flex flex-col gap-1 py-2',
        'border-r border-border bg-sidebar-bg',

        className
      )}
    >
      {items.map((item, index) => {
        const isActive = activeValue === (item.value || item.href);
        const Component = item.href ? 'a' : 'button';

        return (
          <Component
            key={item.value || item.href || index}
            data-value={item.value || item.href}
            href={item.href}
            type={item.href ? undefined : 'button'}
            disabled={item.disabled}
            aria-current={isActive ? 'page' : undefined}
            tabIndex={index === focusedIndex ? 0 : -1}
            onClick={() => {
              if (!item.disabled) {
                onSelect?.(item.value || item.href || '');
              }
            }}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'flex items-center gap-3 rounded-md p-2',
              'typo-sm text-left font-medium',
              'transition-default',
              'focus-default',
              'active:bg-surface-strong',
              'disabled:disabled-default',
              isActive
                ? 'bg-surface-contrast text-fg'
                : 'text-fg-muted lg:hover:bg-surface-contrast'
            )}
          >
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            <span className="truncate">{item.label}</span>
          </Component>
        );
      })}
    </nav>
  );
};

Sidebar.displayName = 'Sidebar';
