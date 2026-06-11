import type React from 'react';

import { cn } from '@/lib/cn';

import { CALENDAR_COLOR_STYLES } from '../constants';
import type { CalendarEvent } from '../types';
import { formatEventTime, minutesFromMidnight } from '../utils/calendarDate';

interface EventBlockProps {
  event: CalendarEvent;
  hourHeight: number;
  /** 블록 클릭 — 일정 변경 패널 오픈 */
  onClick?: (event: CalendarEvent) => void;
}

/** 주간 뷰 시간 블록 (요일 컬럼 내 절대 배치) */
export function EventBlock({ event, hourHeight, onClick }: EventBlockProps) {
  const style = CALENDAR_COLOR_STYLES[event.colorKey];

  // 드래그 생성과 충돌하지 않도록 mousedown 전파 차단, 클릭 시 편집
  const handleMouseDown = (e: React.MouseEvent) => e.stopPropagation();
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  };

  if (event.allDay) {
    // 공휴일/종일 — 읽기 전용 배경(클릭/드래그 통과)
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 bottom-0 flex items-start justify-center px-2 py-1',
          style.chipBg
        )}
      >
        <span className={cn('text-xs font-medium', style.chipTitle)}>
          {event.title}
        </span>
      </div>
    );
  }

  const startMin = minutesFromMidnight(event.start);
  const endMin = event.end ? minutesFromMidnight(event.end) : startMin + 60;
  const top = (startMin / 60) * hourHeight;
  const height = Math.max(((endMin - startMin) / 60) * hourHeight, 22);

  return (
    <button
      type="button"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={cn(
        'absolute inset-x-0 overflow-hidden px-2 py-1 text-left',
        style.chipBg
      )}
      style={{ top, height }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className={cn('truncate text-xs font-medium', style.chipTitle)}>
          {event.title}
        </span>
        <span className={cn('shrink-0 text-xs font-medium', style.chipTime)}>
          {formatEventTime(event.start)}
        </span>
      </div>
    </button>
  );
}
