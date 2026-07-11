import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/cn';

import type { CalendarViewMode } from '../types';
import type { Dayjs } from '../utils/calendarDate';

interface CalendarToolbarProps {
  current: Dayjs;
  viewMode: CalendarViewMode;
  onPrev: () => void;
  onNext: () => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
}

const VIEW_OPTIONS: { value: CalendarViewMode; label: string }[] = [
  { value: 'week', label: '주간' },
  { value: 'month', label: '월간' },
];

function NavButton({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-md border border-grey-40 bg-grey-10 text-[#a1a2a8]"
    >
      {children}
    </button>
  );
}

/** 상단 툴바: ◀ 2026.02 ▶ + 주간/월간 토글 */
export function CalendarToolbar({
  current,
  viewMode,
  onPrev,
  onNext,
  onViewModeChange,
}: CalendarToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <NavButton onClick={onPrev} label="이전">
          <ChevronLeft size={16} />
        </NavButton>
        <span className="text-[36px] font-medium leading-none text-black">
          {current.format('YYYY.MM')}
        </span>
        <NavButton onClick={onNext} label="다음">
          <ChevronRight size={16} />
        </NavButton>
      </div>

      <div className="flex h-[50px] w-[186px] items-center rounded-md border border-grey-40 bg-grey-10 p-1">
        {VIEW_OPTIONS.map((opt) => {
          const active = opt.value === viewMode;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onViewModeChange(opt.value)}
              className={cn(
                'flex h-[42px] w-[87px] items-center justify-center rounded-md text-m font-medium transition-colors',
                active
                  ? 'border border-grey-40 bg-white text-grey-100'
                  : 'text-[#b7b7b7]'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
