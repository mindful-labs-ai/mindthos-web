import React, { useEffect, useRef, useState } from 'react';

import { ChevronDown } from 'lucide-react';

interface InlineDropdownProps {
  items: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** 간단한 드롭다운 (아이콘 없음) */
export const InlineDropdown: React.FC<InlineDropdownProps> = ({
  items,
  value,
  onChange,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel =
    items.find((i) => i.value === value)?.label ?? '선택...';

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
        className="inline-flex h-10 w-full items-center justify-between gap-2 rounded-md bg-surface px-4 text-sm transition-colors hover:bg-surface-contrast"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          size={16}
          className={`text-fg-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul className="border-1 absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border-2 border-border bg-surface px-2 py-1">
          {items.map((item) => (
            <li
              key={item.value}
              role="option"
              aria-selected={item.value === value}
              className={`flex cursor-pointer justify-center px-4 py-2 text-sm transition-colors hover:bg-surface-contrast ${
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
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
