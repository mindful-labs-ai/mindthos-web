import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import type { CalendarDateRange } from '../types';

/**
 * 캘린더 날짜 계산 유틸 (dayjs 래퍼)
 * 주(week) 시작은 일요일 — dayjs 기본값. Figma 디자인이 일요일 시작.
 */

/** 월간 6주(42칸) 매트릭스. 해당 월을 포함하는 일요일~토요일 6행. */
export function getMonthMatrix(monthDate: Dayjs): Dayjs[][] {
  const firstVisible = monthDate.startOf('month').startOf('week');
  const weeks: Dayjs[][] = [];
  let cursor = firstVisible;
  for (let w = 0; w < 6; w += 1) {
    const week: Dayjs[] = [];
    for (let d = 0; d < 7; d += 1) {
      week.push(cursor);
      cursor = cursor.add(1, 'day');
    }
    weeks.push(week);
  }
  return weeks;
}

/** 월간 그리드가 표시하는 전체 가시 범위(데이터 조회용). */
export function getMonthVisibleRange(monthDate: Dayjs): CalendarDateRange {
  const start = monthDate.startOf('month').startOf('week');
  const end = start.add(42, 'day');
  return { start: start.toISOString(), end: end.toISOString() };
}

/** 주간 뷰의 7일(일~토). */
export function getWeekDays(date: Dayjs): Dayjs[] {
  const start = date.startOf('week');
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
}

/** 주간 뷰 조회 범위. */
export function getWeekVisibleRange(date: Dayjs): CalendarDateRange {
  const start = date.startOf('week');
  return { start: start.toISOString(), end: start.add(7, 'day').toISOString() };
}

/** "2:00 PM" 형식 시간. */
export function formatEventTime(iso: string): string {
  return dayjs(iso).format('h:mm A');
}

/** 같은 날짜인지. */
export function isSameDay(a: Dayjs, b: Dayjs): boolean {
  return a.isSame(b, 'day');
}

/** 자정 기준 경과 분(주간 뷰 배치용). */
export function minutesFromMidnight(iso: string): number {
  const d = dayjs(iso);
  return d.hour() * 60 + d.minute();
}

/** 자정 기준 분 → "HH:mm" (주간 드래그 선택 시간 변환용). */
export function minutesToHHmm(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export { dayjs };
export type { Dayjs };
