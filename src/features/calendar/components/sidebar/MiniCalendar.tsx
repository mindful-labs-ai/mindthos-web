import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/cn';

import type { CalendarEvent } from '../../types';
import { dayjs, getMonthMatrix, isSameDay } from '../../utils/calendarDate';
import type { Dayjs } from '../../utils/calendarDate';

interface MiniCalendarProps {
  current: Dayjs;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  /** 점(일정 있는 날) 표시용 이벤트 목록 */
  events?: CalendarEvent[];
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
  events = [],
}: MiniCalendarProps) {
  const weeks = getMonthMatrix(current);
  const today = dayjs();
  // 일정 있는 날(YYYY-MM-DD) 집합 — 날짜 아래 점으로 표시.
  // 공휴일은 '실제 일정'이 아니므로 점 표시에서 제외한다.
  const eventDays = new Set(
    events
      .filter((e) => e.kind !== 'holiday')
      .map((e) => dayjs(e.start).format('YYYY-MM-DD'))
  );

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
          const hasEvent = eventDays.has(day.format('YYYY-MM-DD'));
          return (
            <div
              key={day.toISOString()}
              className="flex flex-col items-center justify-start"
            >
              {/* 일정 있는 날 점 — 날짜 위에 표시. 자리는 항상 차지(정렬 유지), 없으면 투명 */}
              <span
                className={cn(
                  'h-1 w-1 rounded-full',
                  hasEvent ? 'bg-green-80' : 'bg-transparent'
                )}
              />
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
