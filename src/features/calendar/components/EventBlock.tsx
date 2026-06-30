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
  /** 선택(편집 중) 일정 — 색 반전 강조 */
  selected?: boolean;
}

/** 주간 뷰 시간 블록 (요일 컬럼 내 절대 배치) */
export function EventBlock({
  event,
  hourHeight,
  onClick,
  selected,
}: EventBlockProps) {
  const style = CALENDAR_COLOR_STYLES[event.colorKey];
  // 선택(편집 중) 강조: 옅은 배경 → 시간 텍스트 색(진한 솔리드) 배경 + 흰 글자
  const bgClass = selected ? style.selectedBg : style.chipBg;
  const titleColor = selected ? 'text-white' : style.chipTitle;
  const timeColor = selected ? 'text-white' : style.chipTime;
  // 작성 중 더미 블록(미리보기) — 점선·반투명·비클릭, 제목 없으면 '새 일정'.
  const isDraft = !!event.isDraft;
  const displayTitle = event.title || (isDraft ? '새 일정' : '');

  // 드래그 생성과 충돌하지 않도록 mousedown 전파 차단, 클릭 시 편집
  const handleMouseDown = (e: React.MouseEvent) => e.stopPropagation();
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(event);
  };

  if (event.eventTimeKind === 'ALL_DAY') {
    // 공휴일/종일 — 읽기 전용 배경(클릭/드래그 통과)
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 top-0 flex items-start justify-center px-2 py-1',
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

  const inner = (
    <div className="flex items-center justify-between gap-1">
      <span className={cn('truncate text-xs font-medium', titleColor)}>
        {displayTitle}
      </span>
      <span className={cn('shrink-0 text-xs font-medium', timeColor)}>
        {formatEventTime(event.start)}
      </span>
    </div>
  );

  // 더미 블록 — 비클릭(셀로 통과), 점선 테두리로 미리보기 표시.
  if (isDraft) {
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 overflow-hidden rounded-sm border border-dashed border-green-80 px-2 py-1 text-left opacity-90',
          bgClass
        )}
        style={{ top, height }}
      >
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={cn(
        'absolute inset-x-0 overflow-hidden px-2 py-1 text-left',
        bgClass
      )}
      style={{ top, height }}
    >
      {inner}
    </button>
  );
}
