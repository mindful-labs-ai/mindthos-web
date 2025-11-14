import React from 'react';

import { cn } from '@/lib/cn';

export interface AccordionItem {
  value: string;
  header: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  type: 'single' | 'multiple';
  items: AccordionItem[];
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
}

/**
 * Accordion - 접을 수 있는 섹션
 * single/multiple 확장 모드 지원
 *
 * @example
 * <Accordion type="single" items={[{ value: '1', header: 'Title', content: '...' }]} />
 */
export const Accordion: React.FC<AccordionProps> = ({
  type,
  items,
  value: controlledValue,
  defaultValue,
  onValueChange,
  className,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    string | string[]
  >(defaultValue || (type === 'single' ? '' : []));

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const isOpen = (itemValue: string): boolean => {
    if (type === 'single') {
      return value === itemValue;
    }
    return Array.isArray(value) && value.includes(itemValue);
  };

  const toggle = (itemValue: string) => {
    let newValue: string | string[];

    if (type === 'single') {
      newValue = value === itemValue ? '' : itemValue;
    } else {
      const currentArray = Array.isArray(value) ? value : [];
      newValue = currentArray.includes(itemValue)
        ? currentArray.filter((v) => v !== itemValue)
        : [...currentArray, itemValue];
    }

    if (!isControlled) {
      setUncontrolledValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <div
      className={cn(
        'divide-y divide-border rounded-[var(--radius-lg)] border-2 border-border',
        className
      )}
    >
      {items.map((item) => {
        const open = isOpen(item.value);

        return (
          <div key={item.value}>
            <button
              type="button"
              disabled={item.disabled}
              aria-expanded={open}
              aria-controls={`accordion-content-${item.value}`}
              onClick={() => !item.disabled && toggle(item.value)}
              className={cn(
                'flex w-full items-center justify-between px-6 py-4',
                'text-left font-medium text-fg',
                'hover:bg-surface-contrast/50',
                'transition-colors duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              <span>{item.header}</span>
              <svg
                className={cn(
                  'h-5 w-5 text-fg-muted transition-transform duration-200',
                  open && 'rotate-180'
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {open && (
              <div
                id={`accordion-content-${item.value}`}
                role="region"
                aria-labelledby={`accordion-header-${item.value}`}
                className="bg-surface-contrast/30 px-6 py-4 text-base text-fg-muted"
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

Accordion.displayName = 'Accordion';
