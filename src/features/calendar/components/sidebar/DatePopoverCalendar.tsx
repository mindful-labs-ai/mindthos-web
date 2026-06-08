import React from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/cn';

import { dayjs, getMonthMatrix, isSameDay } from '../../utils/calendarDate';
import type { Dayjs } from '../../utils/calendarDate';

interface DatePopoverCalendarProps {
  value: Dayjs | null;
  onSelect: (day: Dayjs) => void;
}

/**
 * 날짜 필드 클릭 시 뜨는 팝오버 달력.
 * 오늘 = 초록 링(테두리), 선택 = 초록 채움(bg green-20), 타월 = 회색.
 */
export function DatePopoverCalendar({
  value,
  onSelect,
}: DatePopoverCalendarProps) {
  const [viewMonth, setViewMonth] = React.useState<Dayjs>(
    () => value ?? dayjs()
  );
  const weeks = getMonthMatrix(viewMonth);
  const today = dayjs();

  return (
    <div className="absolute left-0 top-full z-30 mt-2 w-[311px] rounded-md border border-[#ecedf3] bg-white p-6 shadow-[0px_4px_24px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-between">
        <span className="text-l font-medium text-grey-100">
          {viewMonth.format('YYYY.MM')}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => setViewMonth((m) => m.subtract(1, 'month'))}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-grey-40 bg-grey-10 text-[#a1a2a8]"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => setViewMonth((m) => m.add(1, 'month'))}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-grey-40 bg-grey-10 text-[#a1a2a8]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-y-2">
        {weeks.flat().map((day) => {
          const inMonth = day.isSame(viewMonth, 'month');
          const isSelected = !!value && isSameDay(day, value);
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className="flex items-center justify-center"
            >
              <button
                type="button"
                onClick={() => onSelect(day)}
                className={cn(
                  'flex h-[30px] w-[30px] items-center justify-center rounded-full text-m font-medium',
                  isSelected
                    ? 'bg-green-20 text-green-80'
                    : isToday
                      ? 'border border-green-80 text-grey-100'
                      : inMonth
                        ? 'text-grey-100'
                        : 'text-grey-60'
                )}
              >
                {day.date()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
