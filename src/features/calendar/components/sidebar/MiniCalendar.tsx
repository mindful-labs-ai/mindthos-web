import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/cn';

import { dayjs, getMonthMatrix, isSameDay } from '../../utils/calendarDate';
import type { Dayjs } from '../../utils/calendarDate';

interface MiniCalendarProps {
  current: Dayjs;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function MiniNavButton({
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

/** 사이드탭 상시 노출 미니 월 달력 (메인과 current 공유) */
export function MiniCalendar({
  current,
  onPrevMonth,
  onNextMonth,
}: MiniCalendarProps) {
  const weeks = getMonthMatrix(current);
  const today = dayjs();

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-m font-medium text-grey-100">
          {current.format('YYYY.MM')}
        </span>
        <div className="flex items-center gap-1">
          <MiniNavButton onClick={onPrevMonth} label="이전 달">
            <ChevronLeft size={16} />
          </MiniNavButton>
          <MiniNavButton onClick={onNextMonth} label="다음 달">
            <ChevronRight size={16} />
          </MiniNavButton>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-2">
        {weeks.flat().map((day) => {
          const inMonth = day.isSame(current, 'month');
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className="flex items-center justify-center"
            >
              {isToday ? (
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-green-80 text-sm font-emphasize text-white">
                  {day.date()}
                </span>
              ) : (
                <span
                  className={cn(
                    'flex h-[30px] w-[30px] items-center justify-center text-sm font-medium',
                    inMonth ? 'text-grey-100' : 'text-grey-60'
                  )}
                >
                  {day.date()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
