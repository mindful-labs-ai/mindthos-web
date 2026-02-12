import React, { useEffect, useRef, useState } from 'react';

interface IconDropdownProps {
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  renderIcon?: (value: string) => React.ReactNode;
  className?: string;
}

/** 아이콘 포함 드롭다운 */
export const IconDropdown: React.FC<IconDropdownProps> = ({
  items,
  value,
  onChange,
  renderIcon,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedItem = items.find((i) => i.value === value);
  const selectedLabel = selectedItem?.label ?? '선택...';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 text-sm transition-colors hover:bg-surface-contrast"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-2 truncate">
          {renderIcon && renderIcon(value)}
          {selectedLabel}
        </span>
      </button>
      {open && (
        <ul className="absolute z-50 mt-1 flex max-h-60 w-full flex-col gap-1 overflow-auto rounded-md border-2 border-border bg-surface px-2 py-1 shadow-lg">
          {items.map((item) => (
            <li
              key={item.value}
              role="option"
              aria-selected={item.value === value}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 pl-4 text-sm transition-colors hover:bg-surface-contrast ${
                item.value === value ? 'bg-surface-contrast font-medium' : ''
              }`}
              onMouseDown={() => {
                onChange(item.value);
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onChange(item.value);
                  setOpen(false);
                }
              }}
            >
              {renderIcon && renderIcon(item.value)}
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
