import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/cn';
import { ChevronDownIcon } from '@/shared/icons';

import { ASSESSMENT_TYPES, type AssessmentTypeId } from '../types';

interface AssessmentTypeDropdownProps {
  value: AssessmentTypeId | null;
  onChange: (value: AssessmentTypeId) => void;
  /** 미선택 상태일 때 강조 표시 (주황 텍스트) */
  emphasizeMissing?: boolean;
  className?: string;
}

export const AssessmentTypeDropdown = ({
  value,
  onChange,
  emphasizeMissing = false,
  className,
}: AssessmentTypeDropdownProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selected = ASSESSMENT_TYPES.find((opt) => opt.id === value);
  const labelText = selected ? selected.label : '검사 종류를 선택해주세요.';

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'inline-flex items-center gap-1 text-sm transition-colors',
          selected
            ? 'text-grey-80'
            : emphasizeMissing
              ? 'text-[#F59E0B]'
              : 'text-grey-80'
        )}
      >
        <span className="font-sub">{labelText}</span>
        <ChevronDownIcon className="text-grey-70" size={18} />
      </button>

      {open && (
        <ul className="absolute left-0 top-full z-popover mt-2 flex min-w-[200px] flex-col gap-1 rounded-2xl border border-grey-30 bg-white p-2">
          {ASSESSMENT_TYPES.map((opt) => {
            const isSelected = opt.id === value;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full rounded-lg px-4 py-2.5 text-left text-m transition-colors',
                    isSelected
                      ? 'bg-grey-20 font-medium text-grey-100'
                      : 'font-medium text-grey-100 lg:hover:bg-grey-10'
                  )}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
