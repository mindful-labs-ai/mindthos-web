import React from 'react';

import { WEEKDAYS_KO } from '../constants';
import type { CalendarEvent } from '../types';
import {
  dayjs,
  getWeekDays,
  isSameDay,
  minutesFromMidnight,
} from '../utils/calendarDate';
import type { Dayjs } from '../utils/calendarDate';

import { EventBlock } from './EventBlock';

interface WeekGridProps {
  current: Dayjs;
  events: CalendarEvent[];
  /** 드래그로 시간 범위 선택 → 일정 추가 (day + 시작/종료 분) */
  onCreateRange?: (day: Dayjs, startMinutes: number, endMinutes: number) => void;
  /** 일정 블록 클릭 — 일정 변경 패널 오픈 */
  onEventClick?: (event: CalendarEvent) => void;
}

const HOUR_HEIGHT = 48;
const TOP_PAD = 12; // 12 AM 라벨/선 잘림 방지 여백
const BOTTOM_PAD = 12; // 마지막 시간 라벨/선 잘림 방지 여백
const GUTTER_PX = 66; // 시간 거터 너비
const LINE_LEFT_PX = 61; // 수평선이 거터로 약 5px 침범 → 시간 라벨과 밀접
const SNAP_MIN = 30; // 드래그 스냅 단위(분)
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const GRID_HEIGHT = HOURS.length * HOUR_HEIGHT;
// 12 AM(0) ~ 24:00 까지 선 (HOURS + 1개)
const HOUR_LINES = Array.from({ length: HOURS.length + 1 }, (_, i) => i);

/** 컬럼 내 y좌표(px) → 스냅된 분 */
function yToSnappedMin(clientY: number, columnTop: number): number {
  const raw = ((clientY - columnTop) / HOUR_HEIGHT) * 60;
  const clamped = Math.max(0, Math.min(24 * 60, raw));
  return Math.round(clamped / SNAP_MIN) * SNAP_MIN;
}

/** 종일 제외, 해당 날짜 일정의 [시작분, 종료분) 구간 목록 */
function busyIntervals(events: CalendarEvent[]): [number, number][] {
  return events
    .filter((e) => !e.allDay)
    .map((e) => {
      const start = minutesFromMidnight(e.start);
      const end = e.end ? minutesFromMidnight(e.end) : start + 60;
      return [start, end] as [number, number];
    });
}

/** min이 기존 일정 구간 내부인지 (드래그 시작 차단용) */
function isInsideBusy(min: number, intervals: [number, number][]): boolean {
  return intervals.some(([a, b]) => min >= a && min < b);
}

/** 드래그 종료점을 기존 일정에 닿지 않도록 제한 (경계에서 멈춤) */
function clampDragEnd(
  start: number,
  end: number,
  intervals: [number, number][]
): number {
  if (end >= start) {
    // 아래로 드래그: start 이후 가장 가까운 일정 시작점까지만
    let limit = 24 * 60;
    for (const [a] of intervals) {
      if (a >= start && a < limit) limit = a;
    }
    return Math.min(end, limit);
  }
  // 위로 드래그: start 이전 가장 가까운 일정 종료점까지만
  let limit = 0;
  for (const [, b] of intervals) {
    if (b <= start && b > limit) limit = b;
  }
  return Math.max(end, limit);
}

interface DragState {
  day: Dayjs;
  startMin: number;
  endMin: number;
}

/**
 * 주간 뷰: 시간 거터 + 7 요일 컬럼 + 시간선 + 시간 블록.
 *
 * - 헤더와 본문을 같은 스크롤 컨테이너에 넣고 헤더를 sticky로 고정 → 컬럼 경계선 정렬.
 * - 수평 시간선은 절대 배치로 12 AM ~ 24:00, 거터로 약간 침범시켜 라벨과 밀접.
 * - 컬럼을 세로로 드래그하면 시간 범위가 선택되고, 놓으면 그 시간으로 일정 추가 패널이 열림.
 */
export function WeekGrid({
  current,
  events,
  onCreateRange,
  onEventClick,
}: WeekGridProps) {
  const days = getWeekDays(current);
  const today = dayjs();

  const [drag, setDrag] = React.useState<DragState | null>(null);
  const dragRef = React.useRef<DragState | null>(null);

  // 최신 drag 값을 ref에 동기화 (window mouseup 핸들러에서 참조)
  React.useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  // 드래그 종료(마우스 어디서 떼든)
  React.useEffect(() => {
    const onUp = () => {
      const d = dragRef.current;
      if (!d) return;
      const start = Math.min(d.startMin, d.endMin);
      const end = Math.max(d.startMin, d.endMin);
      setDrag(null);
      if (end - start >= SNAP_MIN) onCreateRange?.(d.day, start, end);
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [onCreateRange]);

  return (
    <div className="overflow-hidden rounded-2xl border border-grey-40 bg-white">
      <div className="max-h-[760px] overflow-y-auto">
        {/* 헤더: 요일 + 날짜 (스크롤 시 상단 고정) */}
        <div className="sticky top-0 z-10 flex border-b border-grey-40 bg-[#fcfcfe]">
          <div className="shrink-0" style={{ width: GUTTER_PX }} />
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className="flex flex-1 flex-col items-center gap-1 py-2"
              >
                <span className="text-m font-medium text-grey-60">
                  {WEEKDAYS_KO[i]}
                </span>
                {isToday ? (
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-green-80 text-m font-emphasize text-white">
                    {day.date()}
                  </span>
                ) : (
                  <span className="flex h-[30px] items-center text-m font-medium text-grey-100">
                    {day.date()}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 본문 */}
        <div
          className="relative select-none"
          style={{ paddingTop: TOP_PAD, paddingBottom: BOTTOM_PAD }}
        >
          {/* 수평 시간선 (12 AM ~ 24:00) — 거터로 약간 침범 */}
          {HOUR_LINES.map((i) => (
            <div
              key={i}
              className="pointer-events-none absolute border-t border-grey-40"
              style={{
                top: TOP_PAD + i * HOUR_HEIGHT,
                left: LINE_LEFT_PX,
                right: 0,
              }}
            />
          ))}

          <div className="flex">
            {/* 시간 거터 */}
            <div className="shrink-0" style={{ width: GUTTER_PX }}>
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="relative pr-2 text-right"
                  style={{ height: HOUR_HEIGHT }}
                >
                  <span className="absolute -top-2 right-2 text-sm font-medium text-grey-60">
                    {dayjs().hour(h).minute(0).format('h A')}
                  </span>
                </div>
              ))}
            </div>

            {/* 요일 컬럼 (드래그로 시간 범위 선택 가능) */}
            {days.map((day) => {
              const dayEvents = events.filter((e) =>
                isSameDay(dayjs(e.start), day)
              );
              const busy = busyIntervals(dayEvents);
              const dragHere = drag && isSameDay(drag.day, day);
              return (
                // 마우스 드래그 전용 시간 선택 표면 (키보드 비대상)
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                <div
                  key={day.toISOString()}
                  className="relative flex-1 cursor-pointer border-l border-grey-40"
                  style={{ height: GRID_HEIGHT }}
                  onMouseDown={(e) => {
                    if (e.button !== 0) return;
                    const top = e.currentTarget.getBoundingClientRect().top;
                    const min = yToSnappedMin(e.clientY, top);
                    // 기존 일정 위에서는 드래그 시작하지 않음
                    if (isInsideBusy(min, busy)) return;
                    setDrag({ day, startMin: min, endMin: min });
                  }}
                  onMouseMove={(e) => {
                    if (!dragRef.current || !isSameDay(dragRef.current.day, day))
                      return;
                    const top = e.currentTarget.getBoundingClientRect().top;
                    const raw = yToSnappedMin(e.clientY, top);
                    // 기존 일정에 닿지 않도록 종료점 제한
                    const min = clampDragEnd(
                      dragRef.current.startMin,
                      raw,
                      busy
                    );
                    setDrag((d) => (d ? { ...d, endMin: min } : d));
                  }}
                >
                  {dayEvents.map((event) => (
                    <EventBlock
                      key={event.id}
                      event={event}
                      hourHeight={HOUR_HEIGHT}
                      onClick={onEventClick}
                    />
                  ))}

                  {dragHere && (
                    <div
                      className="pointer-events-none absolute inset-x-0.5 rounded-sm border border-green-80 bg-[#44ce4b1a]"
                      style={{
                        top:
                          (Math.min(drag.startMin, drag.endMin) / 60) *
                          HOUR_HEIGHT,
                        height:
                          (Math.abs(drag.endMin - drag.startMin) / 60) *
                          HOUR_HEIGHT,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
