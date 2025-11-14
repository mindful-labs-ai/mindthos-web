import React from 'react';

import { cn } from '@/lib/cn';

export interface DropdownItem {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface DropdownProps {
  items: DropdownItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  portal?: boolean;
}

/**
 * Dropdown (Select) component
 *
 * Accessible dropdown select with keyboard navigation and typeahead.
 *
 * **A11y**: button+listbox pattern, typeahead search, Esc to close, focus return.
 * **Keyboard**: ↑↓ to navigate, Enter to select, Esc to close, typeahead search.
 *
 * @example
 * ```tsx
 * <Dropdown
 *   items={[
 *     { value: '1', label: 'Option 1' },
 *     { value: '2', label: 'Option 2', disabled: true },
 *   ]}
 *   placeholder="Select option"
 *   onChange={(value) => console.log(value)}
 * />
 * ```
 */
export const Dropdown: React.FC<DropdownProps> = ({
  items,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className,
  portal: _portal = false,
}) => {
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const isControlled = controlledValue !== undefined;
  const selectedValue = isControlled ? controlledValue : uncontrolledValue;
  const selectedItem = items.find((item) => item.value === selectedValue);

  const handleSelect = (value: string) => {
    if (!isControlled) {
      setUncontrolledValue(value);
    }
    onChange?.(value);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const enabledItems = items.filter((item) => !item.disabled);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => (prev + 1) % enabledItems.length);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(
            (prev) => (prev - 1 + enabledItems.length) % enabledItems.length
          );
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen) {
          handleSelect(enabledItems[highlightedIndex].value);
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      default:
        // Typeahead search
        if (e.key.length === 1) {
          const newQuery = searchQuery + e.key.toLowerCase();
          setSearchQuery(newQuery);

          const matchIndex = enabledItems.findIndex((item) =>
            String(item.label).toLowerCase().startsWith(newQuery)
          );
          if (matchIndex !== -1) {
            setHighlightedIndex(matchIndex);
          }

          if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
          }
          searchTimeoutRef.current = setTimeout(() => setSearchQuery(''), 500);
        }
        break;
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="dropdown-listbox"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={cn(
          'inline-flex items-center justify-between gap-2',
          'h-10 w-full min-w-[200px] px-4 text-sm',
          'rounded-[var(--radius-md)] border-2 border-border bg-surface',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !selectedItem && 'text-fg-muted'
        )}
      >
        <span className="truncate">{selectedItem?.label || placeholder}</span>
        <svg
          className={cn(
            'h-4 w-4 text-fg-muted transition-transform',
            isOpen && 'rotate-180'
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

      {isOpen && (
        <ul
          ref={listRef}
          id="dropdown-listbox"
          role="listbox"
          className={cn(
            'absolute z-50 mt-1 w-full',
            'max-h-60 overflow-auto',
            'rounded-[var(--radius-md)] border-2 border-border bg-surface shadow-lg',
            'py-1'
          )}
        >
          {items.map((item) => {
            const isHighlighted =
              items.filter((i) => !i.disabled).indexOf(item) ===
              highlightedIndex;
            const isSelected = item.value === selectedValue;

            return (
              <li
                key={item.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={item.disabled}
                onClick={() => !item.disabled && handleSelect(item.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!item.disabled) handleSelect(item.value);
                  }
                }}
                className={cn(
                  'cursor-pointer px-4 py-2 text-sm',
                  'transition-colors duration-150',
                  item.disabled && 'cursor-not-allowed opacity-50',
                  !item.disabled && isHighlighted && 'bg-surface-contrast',
                  !item.disabled &&
                    !isHighlighted &&
                    'hover:bg-surface-contrast/50',
                  isSelected && 'font-medium text-primary'
                )}
              >
                {item.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

Dropdown.displayName = 'Dropdown';
