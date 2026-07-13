import React from 'react';

import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/cn';
import { useClickOutside } from '@/shared/hooks/useClickOutside';
import { useDropdownPosition } from '@/shared/hooks/useDropdownPosition';

import type { CounselMethod } from '../../types';

interface CounselMethodSelectProps {
  value: CounselMethod | null;
  onChange: (value: CounselMethod | null) => void;
}

type OptionKey = 'none' | CounselMethod;

const OPTIONS: { key: OptionKey; label: string }[] = [
  { key: 'none', label: '선택 안함' },
  { key: 'in_person', label: '대면' },
  { key: 'online', label: '비대면' },
];

const LABEL: Record<OptionKey, string> = {
  none: '선택 안함',
  in_person: '대면',
  online: '비대면',
};

/** 상담 방식 선택 — 대면/비대면/선택 안함. (상담 일정에서만 노출) */
export function CounselMethodSelect({
  value,
  onChange,
}: CounselMethodSelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false), open);
  // 화면 밖으로 안 나가게: 위/아래 펼침 + 넘치면 좌표 보정
  const { direction, offset } = useDropdownPosition(ref, dropdownRef, open, {
    estimatedHeight: 160,
  });

  const currentKey: OptionKey = value ?? 'none';

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-emphasize text-grey-100">상담 방식</span>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex h-[35px] items-center gap-1.5 rounded-md border border-grey-30 bg-white px-2.5 text-sm',
            value ? 'text-grey-100' : 'text-grey-60'
          )}
        >
          {LABEL[currentKey]}
          <ChevronDown size={16} strokeWidth={1.5} />
        </button>
        {open && (
          <div
            ref={dropdownRef}
            style={{
              transform:
                offset.x || offset.y
                  ? `translate(${offset.x}px, ${offset.y}px)`
                  : undefined,
            }}
            className={cn(
              'absolute right-0 z-30 w-[110px] rounded-md border border-grey-30 bg-white p-1.5 shadow-modal',
              direction === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
            )}
          >
            {OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => {
                  onChange(o.key === 'none' ? null : o.key);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center rounded px-2.5 py-2 text-left text-sm',
                  o.key === currentKey
                    ? 'font-emphasize text-green-80'
                    : 'text-grey-100 lg:hover:bg-grey-10'
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
