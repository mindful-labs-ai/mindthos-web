import { cn } from '@/lib/cn';

import { WEEKDAYS_KO } from '../constants';
import type { CalendarEvent } from '../types';
import { dayjs, getMonthMatrix, isSameDay } from '../utils/calendarDate';
import type { Dayjs } from '../utils/calendarDate';

import { EventChip } from './EventChip';

interface MonthGridProps {
  current: Dayjs;
  events: CalendarEvent[];
  /** 일정 추가 시 선택된 날짜 (초록 테두리 하이라이트) */
  selectedDate?: Dayjs | null;
  /** 날짜 셀 단일 클릭 — 추가 모드일 때만 선택 날짜 갱신 */
  onDateClick?: (day: Dayjs) => void;
  /** 날짜 셀 더블 클릭 (데스크탑) — 일정 추가 패널 오픈 */
  onDateDoubleClick?: (day: Dayjs) => void;
  /** 일정 칩 클릭 — 일정 변경 패널 오픈 */
  onEventClick?: (event: CalendarEvent) => void;
}

const MAX_CHIPS = 3;

/** 일정 정렬: 종일 먼저, 그 다음 시작 시간순 */
function sortEvents(a: CalendarEvent, b: CalendarEvent) {
  if (!!a.allDay !== !!b.allDay) return a.allDay ? -1 : 1;
  return a.start.localeCompare(b.start);
}

/** 월간 7×6 그리드 */
export function MonthGrid({
  current,
  events,
  selectedDate,
  onDateClick,
  onDateDoubleClick,
  onEventClick,
}: MonthGridProps) {
  const weeks = getMonthMatrix(current);
  const today = dayjs();

  return (
    <div className="overflow-hidden rounded-2xl border border-grey-40 bg-white">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-grey-40 bg-[#fcfcfe]">
        {WEEKDAYS_KO.map((label, i) => (
          <div
            key={label}
            className={cn(
              'flex h-[49px] items-center justify-center text-[18px] font-medium',
              i === 0
                ? 'text-[#ff8787]'
                : i === 6
                  ? 'text-[#87a5ff]'
                  : 'text-grey-100'
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 셀 */}
      <div className="grid grid-cols-7">
        {weeks.flat().map((day) => {
          const inMonth = day.isSame(current, 'month');
          const isToday = isSameDay(day, today);
          const isSelected = !!selectedDate && isSameDay(day, selectedDate);
          const dayEvents = events
            .filter((e) => isSameDay(dayjs(e.start), day))
            .sort(sortEvents);
          const overflow = dayEvents.length - MAX_CHIPS;

          return (
            <div
              key={day.toISOString()}
              role="button"
              tabIndex={0}
              onClick={() => onDateClick?.(day)}
              onDoubleClick={() => onDateDoubleClick?.(day)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onDateDoubleClick?.(day);
              }}
              className={cn(
                'flex min-h-[136px] cursor-pointer flex-col gap-1 border-b border-r border-grey-40 p-2 text-left [&:nth-child(7n)]:border-r-0',
                isSelected && 'relative z-10 ring-2 ring-inset ring-green-80'
              )}
            >
              <div className="flex h-[30px] items-center">
                {isToday ? (
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-green-80 text-m font-emphasize text-white">
                    {day.date()}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'pl-1 text-m font-medium',
                      inMonth ? 'text-grey-100' : 'text-grey-60'
                    )}
                  >
                    {day.date()}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                {dayEvents.slice(0, MAX_CHIPS).map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                  />
                ))}
                {overflow > 0 && (
                  <span className="pl-1 text-xs font-medium text-grey-60">
                    +{overflow}개
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
