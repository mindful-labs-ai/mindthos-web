import React from 'react';

import { cn } from '@/lib/cn';

export interface SelectItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  /**
   * Select items
   */
  items: SelectItem[];
  /**
   * Multiple selection mode
   * @default false
   */
  multiple?: boolean;
  /**
   * Controlled value (string or string[])
   */
  value?: string | string[];
  /**
   * Default value (uncontrolled)
   */
  defaultValue?: string | string[];
  /**
   * Change handler
   */
  onChange?: (value: string | string[]) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * Select component
 *
 * Enhanced select with single or multiple selection support.
 *
 * **A11y**: aria-multiselectable, aria-expanded, keyboard navigation.
 * **Keyboard**: Enter/Space to open, ↑↓ to navigate, Enter to select.
 *
 * @example
 * ```tsx
 * <Select
 *   items={[{ value: '1', label: 'Option 1' }]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 * <Select multiple items={items} value={multipleSelected} />
 * ```
 */
export const Select: React.FC<SelectProps> = ({
  items,
  multiple = false,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | string[]>(
    defaultValue || (multiple ? [] : '')
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const selectedValue = isControlled ? controlledValue : uncontrolledValue;

  const handleSelect = (itemValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
      const newValues = currentValues.includes(itemValue)
        ? currentValues.filter((v) => v !== itemValue)
        : [...currentValues, itemValue];

      if (!isControlled) {
        setUncontrolledValue(newValues);
      }
      onChange?.(newValues);
    } else {
      if (!isControlled) {
        setUncontrolledValue(itemValue);
      }
      onChange?.(itemValue);
      setIsOpen(false);
    }
  };

  const getDisplayValue = (): string => {
    if (multiple && Array.isArray(selectedValue)) {
      if (selectedValue.length === 0) return placeholder;
      return `${selectedValue.length} selected`;
    }
    const selected = items.find((item) => item.value === selectedValue);
    return selected ? String(selected.label) : placeholder;
  };

  const isSelected = (itemValue: string): boolean => {
    if (multiple && Array.isArray(selectedValue)) {
      return selectedValue.includes(itemValue);
    }
    return selectedValue === itemValue;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && focusedIndex < items.length) {
          const item = items[focusedIndex];
          if (!item.disabled) {
            handleSelect(item.value);
          }
        } else {
          setIsOpen(!isOpen);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) => Math.min(items.length - 1, prev + 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) => Math.max(0, prev - 1));
        }
        break;
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-multiselectable={multiple}
        className={cn(
          'flex w-full items-center justify-between gap-2',
          'rounded-[var(--radius-md)] border-2 border-border bg-surface px-3 py-2',
          'text-sm text-fg transition-colors duration-200',
          'hover:border-primary/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isOpen && 'border-primary'
        )}
      >
        <span className={cn(!selectedValue && 'text-fg-muted')}>
          {getDisplayValue()}
        </span>
        <svg
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
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

      {isOpen && !disabled && (
        <ul
          role="listbox"
          aria-multiselectable={multiple}
          className={cn(
            'absolute z-50 mt-1 w-full',
            'max-h-60 overflow-auto',
            'rounded-[var(--radius-md)] border-2 border-border bg-surface shadow-lg',
            'py-1'
          )}
        >
          {items.map((item, index) => {
            const selected = isSelected(item.value);
            return (
              <li
                key={item.value}
                role="option"
                aria-selected={selected}
                onClick={() => !item.disabled && handleSelect(item.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!item.disabled) handleSelect(item.value);
                  }
                }}
                tabIndex={0}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm',
                  'cursor-pointer transition-colors duration-200',
                  'hover:bg-surface-contrast',
                  item.disabled && 'cursor-not-allowed opacity-50',
                  focusedIndex === index && 'bg-surface-contrast',
                  selected && 'bg-primary/10 font-medium text-primary'
                )}
              >
                {multiple && (
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border-2',
                      selected ? 'border-primary bg-primary' : 'border-border bg-surface'
                    )}
                  >
                    {selected && (
                      <svg className="h-3 w-3 text-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

Select.displayName = 'Select';
