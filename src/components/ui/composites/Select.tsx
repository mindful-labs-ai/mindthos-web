import React from 'react';

import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

export interface SelectItem {
  value: string;
  label: React.ReactNode;
  /** 선택된 값을 표시할 때 사용할 문자열 (label이 JSX인 경우 필수) */
  displayLabel?: string;
  disabled?: boolean;
}

export interface SelectProps {
  items: SelectItem[];
  multiple?: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxDropdownHeight?: number; // 드롭다운 최대 높이 (px)
}

/**
 * Select - 향상된 선택 컴포넌트
 * single/multiple 선택 모드, 키보드 네비게이션
 *
 * @example
 * <Select items={[{ value: '1', label: 'Option 1' }]} onChange={setSelected} />
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
  maxDropdownHeight = 240, // 기본값 240px (max-h-60)
}) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    string | string[]
  >(defaultValue || (multiple ? [] : ''));
  const [isOpen, setIsOpen] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLUListElement>(null);
  const [dropdownPosition, setDropdownPosition] = React.useState<{
    top: number;
    left: number;
    width: number;
  }>({ top: 0, left: 0, width: 0 });

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
    if (!selected) return placeholder;
    // displayLabel이 있으면 사용, 없으면 label을 문자열로 변환
    return selected.displayLabel ?? String(selected.label);
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

  // 드롭다운 위치 계산
  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // 아래 공간이 충분하면 아래에, 아니면 위에 표시
      const shouldShowAbove =
        spaceBelow < maxDropdownHeight && spaceAbove > spaceBelow;

      if (shouldShowAbove) {
        setDropdownPosition({
          top: rect.top + window.scrollY - maxDropdownHeight - 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      } else {
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    }
  }, [isOpen, maxDropdownHeight]);

  // 외부 클릭 감지
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // 버튼이나 드롭다운 내부 클릭이 아닐 때만 닫기
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
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
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'flex w-full items-center justify-between gap-2',
          'rounded-[var(--radius-md)] border-2 border-border bg-surface px-3 py-2',
          'text-sm text-fg transition-colors duration-200',
          'hover:border-primary-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isOpen && 'border-primary'
        )}
      >
        <span className={cn(!selectedValue && 'text-fg-muted', 'truncate')}>
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

      {isOpen &&
        !disabled &&
        createPortal(
          <ul
            ref={dropdownRef}
            role="listbox"
            aria-multiselectable={multiple}
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              maxHeight: `${maxDropdownHeight}px`,
              overflow: 'auto',
            }}
            className={cn(
              'z-[9999]',
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
                        selected
                          ? 'border-primary bg-primary'
                          : 'border-border bg-surface'
                      )}
                    >
                      {selected && (
                        <svg
                          className="h-3 w-3 text-surface"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                  <span>{item.label}</span>
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
};

Select.displayName = 'Select';
