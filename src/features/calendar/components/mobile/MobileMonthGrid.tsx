import { cn } from '@/lib/cn';

import { WEEKDAYS_KO } from '../../constants';
import type { CalendarEvent } from '../../types';
import { dayjs, getMonthMatrix, isSameDay } from '../../utils/calendarDate';
import type { Dayjs } from '../../utils/calendarDate';
import { EventChip } from '../EventChip';

interface MobileMonthGridProps {
  current: Dayjs;
  events: CalendarEvent[];
  /** 선택된 날짜 (없으면 null — 미선택 시 하이라이트/FAB 없음) */
  selectedDate: Dayjs | null;
  /** 날짜 셀 탭 → 선택 */
  onSelectDay: (day: Dayjs) => void;
  /** 일정 칩 탭 → 변경 패널 */
  onEventClick: (event: CalendarEvent) => void;
}

const MAX_CHIPS = 3;

function sortEvents(a: CalendarEvent, b: CalendarEvent) {
  if (!!a.allDay !== !!b.allDay) return a.allDay ? -1 : 1;
  return a.start.localeCompare(b.start);
}

/** 모바일 월간 그리드 — 높이 가득 채움, 미니칩, 날짜 탭 선택 */
export function MobileMonthGrid({
  current,
  events,
  selectedDate,
  onSelectDay,
  onEventClick,
}: MobileMonthGridProps) {
  const weeks = getMonthMatrix(current);
  const today = dayjs();

  return (
    <div className="flex h-full flex-col border-t border-grey-40">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7">
        {WEEKDAYS_KO.map((label, i) => (
          <div
            key={label}
            className={cn(
              'flex h-8 items-center justify-center text-xs font-medium',
              i === 0
                ? 'text-[#ff8787]'
                : i === 6
                  ? 'text-[#87a5ff]'
                  : 'text-grey-80'
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 셀 — 6행이 남은 높이를 균등 분할 */}
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
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
              onClick={() => onSelectDay(day)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSelectDay(day);
              }}
              className={cn(
                'flex min-h-0 flex-col gap-0.5 overflow-hidden border-b border-r border-grey-40 px-0.5 pb-1 pt-1 [&:nth-child(7n)]:border-r-0',
                isSelected && 'bg-green-20'
              )}
            >
              <div className="flex h-5 items-center justify-center">
                {isToday ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-80 text-[11px] font-emphasize text-white">
                    {day.date()}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'text-[11px] font-medium',
                      inMonth ? 'text-grey-100' : 'text-grey-60'
                    )}
                  >
                    {day.date()}
                  </span>
                )}
              </div>

              <div className="flex min-h-0 flex-col gap-0.5">
                {dayEvents.slice(0, MAX_CHIPS).map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                    compact
                  />
                ))}
                {overflow > 0 && (
                  <span className="pl-0.5 text-[9px] font-medium text-grey-60">
                    +{overflow}
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
