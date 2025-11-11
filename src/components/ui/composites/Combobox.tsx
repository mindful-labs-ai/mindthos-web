import React from 'react';

import { cn } from '@/lib/cn';

export interface ComboboxItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  /**
   * Combobox items
   */
  items: ComboboxItem[];
  /**
   * Controlled value
   */
  value?: string;
  /**
   * Default value (uncontrolled)
   */
  defaultValue?: string;
  /**
   * Change handler
   */
  onChange?: (value: string) => void;
  /**
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Custom filter function
   */
  filterFn?: (items: ComboboxItem[], query: string) => ComboboxItem[];
  /**
   * Additional className
   */
  className?: string;
}

const defaultFilter = (
  items: ComboboxItem[],
  query: string
): ComboboxItem[] => {
  const lowerQuery = query.toLowerCase();
  return items.filter((item) => item.label.toLowerCase().includes(lowerQuery));
};

/**
 * Combobox component
 *
 * Searchable select with autocomplete and filtering.
 *
 * **A11y**: role="combobox", aria-autocomplete, aria-controls.
 * **Keyboard**: Type to search, ↑↓ to navigate, Enter to select.
 *
 * @example
 * ```tsx
 * <Combobox
 *   items={[
 *     { value: '1', label: 'React' },
 *     { value: '2', label: 'Vue' },
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 * />
 * ```
 */
export const Combobox: React.FC<ComboboxProps> = ({
  items,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  filterFn = defaultFilter,
  className,
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue || ''
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isControlled = controlledValue !== undefined;
  const selectedValue = isControlled ? controlledValue : uncontrolledValue;

  const filteredItems = React.useMemo(
    () => filterFn(items, searchQuery),
    [items, searchQuery, filterFn]
  );

  const selectedItem = items.find((item) => item.value === selectedValue);

  const handleSelect = (itemValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(itemValue);
    }
    onChange?.(itemValue);
    setSearchQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (
          isOpen &&
          focusedIndex >= 0 &&
          focusedIndex < filteredItems.length
        ) {
          const item = filteredItems[focusedIndex];
          if (!item.disabled) {
            handleSelect(item.value);
          }
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        inputRef.current?.blur();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex((prev) => Math.min(filteredItems.length - 1, prev + 1));
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
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
    }
  }, [searchQuery, isOpen]);

  const displayValue = isOpen ? searchQuery : selectedItem?.label || '';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="combobox-listbox"
          className={cn(
            'w-full rounded-[var(--radius-md)] border-2 border-border bg-surface px-3 py-2 pr-10',
            'text-sm text-fg transition-colors duration-200',
            'placeholder:text-fg-muted',
            'hover:border-primary/50',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {isOpen && !disabled && (
        <ul
          id="combobox-listbox"
          role="listbox"
          className={cn(
            'absolute z-50 mt-1 w-full',
            'max-h-60 overflow-auto',
            'rounded-[var(--radius-md)] border-2 border-border bg-surface shadow-lg',
            'py-1'
          )}
        >
          {filteredItems.length === 0 ? (
            <li className="px-3 py-2 text-sm text-fg-muted">
              No results found
            </li>
          ) : (
            filteredItems.map((item, index) => (
              <li
                key={item.value}
                role="option"
                aria-selected={selectedValue === item.value}
                onClick={() => !item.disabled && handleSelect(item.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!item.disabled) handleSelect(item.value);
                  }
                }}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm transition-colors duration-200',
                  'hover:bg-surface-contrast',
                  item.disabled && 'cursor-not-allowed opacity-50',
                  focusedIndex === index && 'bg-surface-contrast',
                  selectedValue === item.value &&
                    'bg-primary/10 font-medium text-primary'
                )}
              >
                {item.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

Combobox.displayName = 'Combobox';
