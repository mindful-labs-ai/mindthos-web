import React from 'react';

import { WEEKDAYS_KO, weekdayColorClass } from '../constants';
import type { CalendarEvent } from '../types';
import {
  dayjs,
  getWeekDays,
  isSameDay,
  minutesFromMidnight,
} from '../utils/calendarDate';
import type { Dayjs } from '../utils/calendarDate';

import { EventBlock } from './EventBlock';
import { EventChip } from './EventChip';

interface WeekGridProps {
  current: Dayjs;
  events: CalendarEvent[];
  /** 드래그로 시간 범위 선택 → 일정 추가 (day + 시작/종료 분) */
  onCreateRange?: (
    day: Dayjs,
    startMinutes: number,
    endMinutes: number
  ) => void;
  /** 일정 블록 클릭 — 일정 변경 패널 오픈 */
  onEventClick?: (event: CalendarEvent) => void;
  /** 일정 추가 패널이 가리키는 날짜(선택 박스를 그릴 컬럼) */
  selectedDate?: Dayjs | null;
  /** 일정 추가 패널의 시작/종료 시각(HH:mm) — 선택 박스 위치 */
  addEventTime?: { start: string; end: string };
  /** 새 일정 추가(편집 아님) 패널이 열려 있을 때만 선택 박스 유지 */
  showAddSelection?: boolean;
  /** 편집 중 일정 — 블록/칩 색 반전 강조 */
  selectedEvent?: CalendarEvent | null;
}

/** 'HH:mm' → 자정 기준 분 */
function hhmmToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

const HOUR_HEIGHT = 48;
const TOP_PAD = 12; // 12 AM 라벨/선 잘림 방지 여백
const BOTTOM_PAD = 12; // 마지막 시간 라벨/선 잘림 방지 여백
const GUTTER_PX = 66; // 시간 거터 너비
const LINE_LEFT_PX = 61; // 수평선이 거터로 약 5px 침범 → 시간 라벨과 밀접
const CELL_MIN = 60; // 한 칸(시간 셀) = 1시간. 클릭=한 칸, 드래그=셀 단위 확장.
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const GRID_HEIGHT = HOURS.length * HOUR_HEIGHT;
// 12 AM(0) ~ 24:00 까지 선 (HOURS + 1개)
const HOUR_LINES = Array.from({ length: HOURS.length + 1 }, (_, i) => i);

/** 컬럼 내 y좌표(px) → 가리키는 시간 셀의 시작 분(정시, 0~23시 = 0~1380). */
function yToCellStartMin(clientY: number, columnTop: number): number {
  const hour = Math.floor((clientY - columnTop) / HOUR_HEIGHT);
  return Math.max(0, Math.min(23, hour)) * 60;
}

/** 종일·더미(작성 중) 제외, 해당 날짜 일정의 [시작분, 종료분) 구간 목록 */
function busyIntervals(events: CalendarEvent[]): [number, number][] {
  return events
    .filter((e) => e.eventTimeKind !== 'ALL_DAY' && !e.isDraft)
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
  /** 드래그 시작(앵커) 셀의 시작 분(정시). 위/아래 확장 기준. */
  anchorMin: number;
  startMin: number;
  endMin: number;
  /** 시작 시점 해당 날짜의 일정 구간 — 종료점 clamp용 */
  busy: [number, number][];
}

/** 마우스가 올라간 빈 시간 셀(영역 하이라이트용). */
interface HoverCell {
  dayKey: string;
  startMin: number;
}

/**
 * 주간 뷰: 시간 거터 + 7 요일 컬럼 + 시간선 + 시간 블록.
 *
 * - 헤더와 본문을 같은 스크롤 컨테이너에 넣고 헤더를 sticky로 고정 → 컬럼 경계선 정렬.
 * - 수평 시간선은 절대 배치로 12 AM ~ 24:00, 거터로 약간 침범시켜 라벨과 밀접.
 * - 컬럼을 클릭하면 기본 한 칸이, 세로로 드래그하면 그 범위가 선택되며 일정 추가 패널이 열림.
 */
export function WeekGrid({
  current,
  events,
  onCreateRange,
  onEventClick,
  selectedDate,
  addEventTime,
  showAddSelection,
  selectedEvent,
}: WeekGridProps) {
  const days = getWeekDays(current);
  const today = dayjs();

  // 활동 시간대부터 보이도록 마운트 시 스크롤을 8시(오전)로 핀(구글 캘린더식)
  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 8 * HOUR_HEIGHT;
  }, []);

  // 일정 추가 패널 시간 → 선택 박스(분). 드래그 release 후에도 패널이 열려 있는 동안 유지된다.
  const selStart = addEventTime ? hhmmToMin(addEventTime.start) : 0;
  const selEnd = addEventTime ? hhmmToMin(addEventTime.end) : 0;

  const [drag, setDrag] = React.useState<DragState | null>(null);
  const dragRef = React.useRef<DragState | null>(null);
  // 마우스가 올라간 빈 시간 셀 — 어느 영역을 누르게 되는지 하이라이트.
  const [hoverCell, setHoverCell] = React.useState<HoverCell | null>(null);

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
      // 클릭=한 칸 / 드래그=여러 칸. 두 경우 모두 셀 범위가 그대로 선택된다.
      if (end > start) onCreateRange?.(d.day, start, end);
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [onCreateRange]);

  // 헤더 높이 측정 — 종일 플로팅 칩을 헤더 바로 아래에 sticky 고정(스크롤 따라옴)
  const headerRef = React.useRef<HTMLDivElement>(null);
  const [headerH, setHeaderH] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-grey-40 bg-white">
      <div ref={scrollRef} className="max-h-[760px] overflow-y-auto">
        {/* 헤더: 요일 + 날짜 (스크롤 시 상단 고정) */}
        <div
          ref={headerRef}
          className="sticky top-0 z-10 flex border-b border-grey-40 bg-[#fcfcfe]"
        >
          <div className="shrink-0" style={{ width: GUTTER_PX }} />
          {days.map((day, i) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                className="flex flex-1 flex-col items-center gap-1 py-2"
              >
                <span
                  className={`text-m font-medium ${weekdayColorClass(i, 'text-grey-60')}`}
                >
                  {WEEKDAYS_KO[i]}
                </span>
                {isToday ? (
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-green-80 text-m font-emphasize text-white">
                    {day.date()}
                  </span>
                ) : (
                  <span
                    className={`flex h-[30px] items-center text-m font-medium ${weekdayColorClass(day.day())}`}
                  >
                    {day.date()}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 종일 일정 오버레이 — 스크롤 컨테이너 직속(헤더 바로 뒤)이라 sticky가 확실히 동작.
            h-0 + overflow-visible로 그리드를 밀지 않고 위에 떠 있고, top=headerH로 헤더 바로 아래에 핀.
            z는 헤더(z-10)보다 낮아 일 표시띠를 가리지 않음. 컨테이너는 클릭 통과, 칩만 클릭. */}
        <div
          className="pointer-events-none sticky z-[5] h-0 overflow-visible"
          style={{ top: headerH }}
        >
          <div className="flex">
            <div className="shrink-0" style={{ width: GUTTER_PX }} />
            {days.map((day) => {
              // 다일(multi-day) 종일 일정 — [start, end] 구간에 걸치는 모든 날에 칩 표시.
              // end가 없으면 시작일 하루만.
              const allDayEvents = events.filter((e) => {
                if (e.eventTimeKind !== 'ALL_DAY') return false;
                const start = dayjs(e.start);
                if (!e.end) return isSameDay(start, day);
                const end = dayjs(e.end);
                return (
                  (day.isSame(start, 'day') || day.isAfter(start, 'day')) &&
                  (day.isSame(end, 'day') || day.isBefore(end, 'day'))
                );
              });
              return (
                <div
                  key={day.toISOString()}
                  className="flex flex-1 flex-col gap-0.5 px-0.5 pt-1"
                >
                  {allDayEvents.map((event) => (
                    <div key={event.id} className="pointer-events-auto">
                      <EventChip
                        event={event}
                        onClick={onEventClick}
                        selected={
                          !!selectedEvent &&
                          event.id === selectedEvent.id &&
                          event.start === selectedEvent.start
                        }
                        className="border border-grey-40"
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
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

            {/* 요일 컬럼 (클릭=기본 한 칸 / 드래그=범위 선택) */}
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
                    const cellStart = yToCellStartMin(e.clientY, top);
                    // 기존 일정 위 셀에서는 드래그/클릭 시작하지 않음
                    if (isInsideBusy(cellStart, busy)) return;
                    // 클릭한 한 칸 — 종료점은 다음 일정에 닿지 않게 clamp
                    const cellEnd = clampDragEnd(
                      cellStart,
                      cellStart + CELL_MIN,
                      busy
                    );
                    setHoverCell(null);
                    setDrag({
                      day,
                      anchorMin: cellStart,
                      startMin: cellStart,
                      endMin: cellEnd,
                      busy,
                    });
                  }}
                  onMouseMove={(e) => {
                    const top = e.currentTarget.getBoundingClientRect().top;
                    const cellStart = yToCellStartMin(e.clientY, top);
                    // 드래그 중 — 앵커 셀 기준 위/아래로 셀 단위 확장
                    if (
                      dragRef.current &&
                      isSameDay(dragRef.current.day, day)
                    ) {
                      const anchor = dragRef.current.anchorMin;
                      const next =
                        cellStart >= anchor
                          ? {
                              startMin: anchor,
                              endMin: clampDragEnd(
                                anchor,
                                cellStart + CELL_MIN,
                                busy
                              ),
                            }
                          : {
                              startMin: clampDragEnd(anchor, cellStart, busy),
                              endMin: anchor + CELL_MIN,
                            };
                      setDrag((d) => (d ? { ...d, ...next } : d));
                      return;
                    }
                    // 비드래그 — 빈 셀이면 영역 하이라이트
                    const key = day.toISOString();
                    if (isInsideBusy(cellStart, busy)) {
                      setHoverCell((h) => (h?.dayKey === key ? null : h));
                    } else {
                      setHoverCell((h) =>
                        h?.dayKey === key && h.startMin === cellStart
                          ? h
                          : { dayKey: key, startMin: cellStart }
                      );
                    }
                  }}
                  onMouseLeave={() => {
                    const key = day.toISOString();
                    setHoverCell((h) => (h?.dayKey === key ? null : h));
                  }}
                >
                  {dayEvents
                    .filter((event) => event.eventTimeKind !== 'ALL_DAY')
                    .map((event) => (
                      <EventBlock
                        key={event.id}
                        event={event}
                        hourHeight={HOUR_HEIGHT}
                        onClick={onEventClick}
                        selected={
                          !!selectedEvent &&
                          event.id === selectedEvent.id &&
                          event.start === selectedEvent.start
                        }
                      />
                    ))}

                  {/* 호버 셀 하이라이트 — 누르면 선택될 시간 영역(드래그 중엔 선택 박스가 우선) */}
                  {!dragHere && hoverCell?.dayKey === day.toISOString() && (
                    <div
                      className="pointer-events-none absolute inset-x-0.5 rounded-sm bg-[#44ce4b14]"
                      style={{
                        top: (hoverCell.startMin / 60) * HOUR_HEIGHT,
                        height: HOUR_HEIGHT,
                      }}
                    />
                  )}

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

                  {/* 일정 추가 패널이 열려 있는 동안 선택 박스 유지(드래그 종료 후에도).
                      활성 드래그/더미 블록이 있으면 그쪽이 우선(박스 숨김). addEventTime과 동기화. */}
                  {!dragHere &&
                    !events.some((e) => e.isDraft) &&
                    showAddSelection &&
                    selectedDate &&
                    isSameDay(selectedDate, day) &&
                    selEnd > selStart && (
                      <div
                        className="pointer-events-none absolute inset-x-0.5 rounded-sm border border-green-80 bg-[#44ce4b1a]"
                        style={{
                          top: (selStart / 60) * HOUR_HEIGHT,
                          height: ((selEnd - selStart) / 60) * HOUR_HEIGHT,
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
