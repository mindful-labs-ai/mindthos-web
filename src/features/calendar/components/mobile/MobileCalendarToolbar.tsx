import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

import { cn } from '@/lib/cn';

import type { CalendarViewMode } from '../../types';
import type { Dayjs } from '../../utils/calendarDate';

interface MobileCalendarToolbarProps {
  current: Dayjs;
  viewMode: CalendarViewMode;
  onPrev: () => void;
  onNext: () => void;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onOpenFilter: () => void;
}

/** 모바일 토글: 일(week) / 월(month) */
const VIEW_OPTIONS: { value: CalendarViewMode; label: string }[] = [
  { value: 'week', label: '일' },
  { value: 'month', label: '월' },
];

/** 모바일 상단 툴바 — 월/일 라벨 + ◀▶ + 일/월 토글 + 필터 */
export function MobileCalendarToolbar({
  current,
  viewMode,
  onPrev,
  onNext,
  onViewModeChange,
  onOpenFilter,
}: MobileCalendarToolbarProps) {
  // 월/주(일간) 모두 월 라벨 — 요일/날짜는 주간 스트립이 담당
  const label = current.format('YYYY.MM');

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          aria-label="이전"
          onClick={onPrev}
          className="flex h-7 w-7 shrink-0 items-center justify-center text-grey-80"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="truncate text-xl font-medium text-black">{label}</span>
        <button
          type="button"
          aria-label="다음"
          onClick={onNext}
          className="flex h-7 w-7 shrink-0 items-center justify-center text-grey-80"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center rounded-md border border-grey-40 bg-grey-10 p-0.5">
          {VIEW_OPTIONS.map((opt) => {
            const active = opt.value === viewMode;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onViewModeChange(opt.value)}
                className={cn(
                  'flex h-7 w-9 items-center justify-center rounded text-sm font-medium',
                  active
                    ? 'bg-white text-grey-100'
                    : 'text-[#b7b7b7]'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-label="필터"
          onClick={onOpenFilter}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-grey-40 bg-white text-grey-80"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>
    </div>
  );
}
