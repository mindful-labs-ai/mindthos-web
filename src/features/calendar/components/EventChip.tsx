import { cn } from '@/lib/cn';

import { CALENDAR_COLOR_STYLES } from '../constants';
import type { CalendarEvent } from '../types';
import { formatEventTime } from '../utils/calendarDate';

interface EventChipProps {
  event: CalendarEvent;
  /** 칩 클릭 — 일정 변경 패널 오픈 (공휴일은 읽기 전용이라 무시) */
  onClick?: (event: CalendarEvent) => void;
  /** 모바일 월간 미니칩 — 이름만, 작게(시간 생략) */
  compact?: boolean;
}

/**
 * 월간 셀 일정 칩.
 * - 공휴일(kind 'holiday'): 읽기 전용 — 클릭 불가(비-인터랙티브 div)
 * - 종일: 가운데 정렬, 시간 없음 / 시간 일정: 일정명(좌) + 시간(우)
 * - compact(모바일): 이름만, 18px 높이
 */
export function EventChip({ event, onClick, compact }: EventChipProps) {
  const style = CALENDAR_COLOR_STYLES[event.colorKey];
  const centered = event.allDay;
  const readOnly = event.kind === 'holiday';

  const className = compact
    ? cn(
        'flex h-[18px] w-full items-center rounded-[3px] px-1',
        style.chipBg,
        centered ? 'justify-center' : 'justify-start'
      )
    : cn(
        'flex h-[25px] w-full items-center rounded-sm px-2',
        style.chipBg,
        centered ? 'justify-center' : 'justify-between gap-1'
      );

  const content = (
    <>
      <span
        className={cn(
          'truncate font-medium',
          compact ? 'text-[10px] leading-none' : 'text-xs',
          style.chipTitle
        )}
        title={event.title}
      >
        {event.title}
      </span>
      {!centered && !compact && (
        <span className={cn('shrink-0 text-xs font-medium', style.chipTime)}>
          {formatEventTime(event.start)}
        </span>
      )}
    </>
  );

  // 공휴일: 읽기 전용 — 클릭은 아래 날짜 셀로 통과
  if (readOnly) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      className={className}
    >
      {content}
    </button>
  );
}
