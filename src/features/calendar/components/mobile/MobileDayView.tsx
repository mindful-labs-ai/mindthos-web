import { cn } from '@/lib/cn';

import { WEEKDAYS_KO } from '../../constants';
import type { CalendarEvent } from '../../types';
import {
  dayjs,
  getWeekDays,
  isSameDay,
} from '../../utils/calendarDate';
import type { Dayjs } from '../../utils/calendarDate';
import { EventBlock } from '../EventBlock';
import { EventChip } from '../EventChip';

interface MobileDayViewProps {
  current: Dayjs;
  events: CalendarEvent[];
  /** 주간 스트립에서 날짜 선택 → 그 날짜로 이동 */
  onSelectDay: (day: Dayjs) => void;
  /** 일정 블록 탭 → 변경 패널 */
  onEventClick: (event: CalendarEvent) => void;
}

const HOUR_HEIGHT = 56;
const TOP_PAD = 8;
const BOTTOM_PAD = 8;
const GUTTER_PX = 56;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const GRID_HEIGHT = HOURS.length * HOUR_HEIGHT;

/** 모바일 1일 타임라인 — 상단 주간 스트립 + 시간표(보기 전용, 블록 탭=편집). 추가는 FAB. */
export function MobileDayView({
  current,
  events,
  onSelectDay,
  onEventClick,
}: MobileDayViewProps) {
  const today = dayjs();
  const weekDays = getWeekDays(current);
  const dayEvents = events.filter((e) => isSameDay(dayjs(e.start), current));
  const timed = dayEvents.filter((e) => !e.allDay);
  const allDayEvents = dayEvents.filter((e) => e.allDay);

  return (
    <div className="flex h-full flex-col">
      {/* 주간 스트립 — 이번 주 중 선택일 한눈에 */}
      <div className="flex shrink-0 border-b border-grey-40">
        {weekDays.map((day, i) => {
          const isSel = isSameDay(day, current);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className="flex flex-1 flex-col items-center gap-1 py-2"
            >
              <span
                className={cn(
                  'text-[11px] font-medium',
                  i === 0
                    ? 'text-[#ff8787]'
                    : i === 6
                      ? 'text-[#87a5ff]'
                      : 'text-grey-60'
                )}
              >
                {WEEKDAYS_KO[i]}
              </span>
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  isSel
                    ? 'bg-green-80 text-white'
                    : isToday
                      ? 'text-green-80'
                      : 'text-grey-100'
                )}
              >
                {day.date()}
              </span>
            </button>
          );
        })}
      </div>

      {/* 종일(공휴일 등) */}
      {allDayEvents.length > 0 && (
        <div className="flex shrink-0 flex-col gap-1 border-b border-grey-40 px-3 py-2">
          <span className="text-xs font-medium text-grey-60">종일</span>
          {allDayEvents.map((event) => (
            <EventChip
              key={event.id}
              event={event}
              onClick={onEventClick}
              compact
            />
          ))}
        </div>
      )}

      {/* 시간표 (내부 스크롤) */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="flex"
          style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}
        >
          {/* 시간 거터 */}
          <div className="shrink-0" style={{ width: GUTTER_PX }}>
            {HOURS.map((h) => (
              <div
                key={h}
                className="relative pr-2 text-right"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2 right-2 text-xs font-medium text-grey-60">
                  {dayjs().hour(h).minute(0).format('h A')}
                </span>
              </div>
            ))}
          </div>

          {/* 1일 컬럼 (보기 전용 — 추가는 FAB) */}
          <div
            className="relative flex-1 border-l border-t border-grey-40"
            style={{ height: GRID_HEIGHT }}
          >
            {HOURS.map((h) => (
              <div
                key={h}
                className="border-b border-grey-40"
                style={{ height: HOUR_HEIGHT }}
              />
            ))}
            {timed.map((event) => (
              <EventBlock
                key={event.id}
                event={event}
                hourHeight={HOUR_HEIGHT}
                onClick={onEventClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
