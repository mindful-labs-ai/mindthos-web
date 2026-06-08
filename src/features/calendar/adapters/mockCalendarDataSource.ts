import dayjs from 'dayjs';

import type {
  CalendarCategory,
  CalendarDateRange,
  CalendarEvent,
  CalendarEventInput,
} from '../types';

import type { CalendarDataSource } from './types';

/**
 * Mock 데이터 소스 — 백엔드 미구현 단계의 임시 구현.
 *
 * listEvents는 조회 범위의 "해당 월"에 Figma 샘플 일정을 생성해 반환한다.
 * → 어느 달로 이동해도 캘린더가 동작하는 모습을 보여줌(목 데이터).
 * 추후 실제 백엔드 어댑터로 교체. (adapters/index.ts)
 */

const CATEGORIES: CalendarCategory[] = [
  { id: 'cat-mindthos', name: '마음토스 캘린더', colorKey: 'green' },
];

/** 사용자가 추가한 일정 (인메모리). 추후 백엔드 어댑터에서는 서버가 보관. */
const createdEvents: CalendarEvent[] = [];
let createdSeq = 0;

/** 일정 수정 오버라이드 (id → 변경 필드). 생성/샘플 일정 모두 적용. */
const eventOverrides: Record<string, Partial<CalendarEvent>> = {};

/** (year-month 기준) day/hour/minute로 ISO 생성 */
function at(monthStart: dayjs.Dayjs, day: number, hour: number, min = 0) {
  return monthStart.date(day).hour(hour).minute(min).second(0).toISOString();
}

/** 조회 범위의 중앙이 속한 달에 샘플 일정 생성 */
function buildMonthEvents(monthStart: dayjs.Dayjs): CalendarEvent[] {
  const ym = monthStart.format('YYYYMM');
  return [
    {
      id: `${ym}-hong`,
      title: '홍길동',
      kind: 'counseling',
      colorKey: 'green',
      start: at(monthStart, 10, 14),
      end: at(monthStart, 10, 15),
      categoryId: 'cat-mindthos',
    },
    {
      id: `${ym}-conf`,
      title: '학회 참석',
      kind: 'personal',
      colorKey: 'red',
      start: at(monthStart, 12, 14),
      end: at(monthStart, 12, 18),
    },
    {
      id: `${ym}-kim`,
      title: '김성곤',
      kind: 'counseling',
      colorKey: 'green',
      start: at(monthStart, 12, 18),
      end: at(monthStart, 12, 19),
      categoryId: 'cat-mindthos',
    },
    ...[17, 18, 19].map((d) => ({
      id: `${ym}-seol-${d}`,
      title: '설 연휴',
      kind: 'holiday' as const,
      colorKey: 'grey' as const,
      start: at(monthStart, d, 0),
      allDay: true,
    })),
    {
      id: `${ym}-family`,
      title: '가족 모임',
      kind: 'personal',
      colorKey: 'blue',
      start: at(monthStart, 21, 14),
      end: at(monthStart, 21, 16),
    },
  ];
}

export const mockCalendarDataSource: CalendarDataSource = {
  async listEvents(range: CalendarDateRange): Promise<CalendarEvent[]> {
    const start = dayjs(range.start);
    const end = dayjs(range.end);
    const mid = start.add(end.diff(start) / 2, 'millisecond');
    const monthStart = mid.startOf('month');

    const inRange = (e: CalendarEvent) => {
      const t = dayjs(e.start);
      return !t.isBefore(start) && t.isBefore(end);
    };
    const applyOverride = (e: CalendarEvent): CalendarEvent =>
      eventOverrides[e.id] ? { ...e, ...eventOverrides[e.id] } : e;
    return [...buildMonthEvents(monthStart), ...createdEvents]
      .map(applyOverride)
      .filter(inRange);
  },

  async createEvent(input: CalendarEventInput): Promise<CalendarEvent> {
    createdSeq += 1;
    const event: CalendarEvent = { ...input, id: `created-${createdSeq}` };
    createdEvents.push(event);
    return event;
  },

  async updateEvent(
    id: string,
    input: CalendarEventInput
  ): Promise<CalendarEvent> {
    eventOverrides[id] = { ...input };
    return { ...input, id };
  },

  async listCategories(): Promise<CalendarCategory[]> {
    return CATEGORIES;
  },
};
