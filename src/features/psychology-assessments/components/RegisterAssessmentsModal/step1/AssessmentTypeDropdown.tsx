import { useEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

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
  const [position, setPosition] = useState({ top: 0, left: 0, width: 200 });
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const updatePosition = () => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 200),
    });
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const selected = ASSESSMENT_TYPES.find((opt) => opt.id === value);
  const labelText = selected ? selected.label : '검사 종류를 선택해 주세요.';

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => {
          updatePosition();
          setOpen((prev) => !prev);
        }}
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

      {open &&
        createPortal(
          <ul
            ref={menuRef}
            className="fixed z-popover flex flex-col gap-1 rounded-2xl border border-grey-30 bg-white p-2 shadow-elevated"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
          >
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
          </ul>,
          document.body
        )}
    </div>
  );
};
