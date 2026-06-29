/**
 * 일정 생성/수정/삭제의 '순수' 도메인 로직 — 컨테이너(상태·API·캐시)에서 분리해 단위 테스트한다.
 * 반복은 회차별 row + series_id로 저장되므로, 삭제 낙관적 업데이트도 scope(이 회차/이후/전체) 기준이다.
 */
import type {
  AddEventDraft,
  CalendarColorKey,
  CalendarEvent,
  CalendarEventInput,
  CalendarEventScope,
} from '../types';

import { type Dayjs } from './calendarDate';

export interface EventTimes {
  start: Dayjs;
  end: Dayjs | undefined;
  isAllDay: boolean;
}

/** draft + 기준 날짜 → 시작/종료 Dayjs. 하루종일이면 그 날 00:00 시작·종료 없음. */
export function computeEventTimes(
  draft: AddEventDraft,
  date: Dayjs
): EventTimes {
  const [sh, sm] = draft.startTime.split(':').map(Number);
  const [eh, em] = draft.endTime.split(':').map(Number);
  const isAllDay = draft.eventTimeKind === 'ALL_DAY';
  const start = isAllDay
    ? date.hour(0).minute(0).second(0).millisecond(0)
    : date
        .hour(sh || 0)
        .minute(sm || 0)
        .second(0);
  const end = isAllDay
    ? undefined
    : date
        .hour(eh || 0)
        .minute(em || 0)
        .second(0);
  return { start, end, isAllDay };
}

/** draft + 기준 날짜 (+ 편집 중 이벤트) → 서버 전송용 CalendarEventInput. */
export function buildCalendarEventInput(
  draft: AddEventDraft,
  date: Dayjs,
  editingEvent: CalendarEvent | null
): CalendarEventInput {
  const { start, end } = computeEventTimes(draft, date);
  // 종류가 그대로면 기존 색 유지, 바뀌면 kind 기본값으로(색은 카테고리에서도 재파생됨).
  const colorKey: CalendarColorKey =
    editingEvent && editingEvent.kind === draft.kind
      ? editingEvent.colorKey
      : draft.kind === 'counseling'
        ? 'green'
        : 'red';
  return {
    title: draft.title.trim() || '제목 없음',
    kind: draft.kind,
    colorKey,
    start: start.toISOString(),
    end: end?.toISOString(),
    eventTimeKind: draft.eventTimeKind,
    categoryId: draft.categoryId ?? undefined,
    clientId: draft.clientId,
    counselMethod: draft.counselMethod,
    repeat: draft.repeat,
  };
}

/**
 * 삭제 낙관적 업데이트 — scope에 맞춰 캐시에서 대상 row들을 제거한다.
 *  - this(또는 단일): 그 회차 row 1건(id 일치)만.
 *  - following: 같은 series의 기준 시작 이후 회차들(start는 서버 UTC ISO라 문자열 비교 = 시간순).
 *  - all: 같은 series 전체.
 */
export function applyScopedDeleteOptimistic(
  events: CalendarEvent[] | undefined,
  target: CalendarEvent,
  scope: CalendarEventScope
): CalendarEvent[] | undefined {
  if (!events) return events;
  const seriesId = target.seriesId ?? null;
  const matches = (e: CalendarEvent): boolean => {
    if (scope === 'this' || !seriesId) {
      return e.id === target.id;
    }
    if (scope === 'following') {
      return e.seriesId === seriesId && e.start >= target.start;
    }
    return e.seriesId === seriesId; // all
  };
  return events.filter((e) => !matches(e));
}
