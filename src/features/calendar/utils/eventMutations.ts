/**
 * 일정 생성/수정/삭제의 '순수' 도메인 로직 — 컨테이너(상태·API·캐시)에서 분리해 단위 테스트한다.
 * 반복 일정 anchor 판정·EXDATE 병합 등 회귀가 잦은 부분을 여기로 모은다.
 */
import type {
  AddEventDraft,
  CalendarColorKey,
  CalendarEvent,
  CalendarEventInput,
} from '../types';

import { dayjs, type Dayjs } from './calendarDate';

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
 * 시간/날짜(앵커) 변경 여부 — '로컬 프레임 분 단위'로 판정. ISO 문자열 직접 비교는 UTC 자정으로
 * 저장된 외부 연동 올데이 이벤트가 round-trip되지 않아 제목만 바꿔도 오탐을 낸다. 올데이는
 * 날짜만, 시간 일정은 날짜+시작/종료 시각을 비교한다.
 */
export function hasAnchorChanged(
  draft: AddEventDraft,
  date: Dayjs,
  editingEvent: CalendarEvent | null
): boolean {
  if (!editingEvent) return false;
  const { start, end, isAllDay } = computeEventTimes(draft, date);
  const wasAllDay = editingEvent.eventTimeKind === 'ALL_DAY';
  if (isAllDay !== wasAllDay) return true;
  const origStart = dayjs(editingEvent.start);
  if (isAllDay) return !date.isSame(origStart, 'day');
  if (
    start.format('YYYY-MM-DD HH:mm') !== origStart.format('YYYY-MM-DD HH:mm')
  ) {
    return true;
  }
  const newEndKey = end ? end.format('YYYY-MM-DD HH:mm') : null;
  const origEndKey = editingEvent.end
    ? dayjs(editingEvent.end).format('YYYY-MM-DD HH:mm')
    : null;
  return newEndKey !== origEndKey;
}

/**
 * 같은 마스터의 캐시 인스턴스들에서 예외(EXDATE)를 모아 occDate를 더한다 — 연속 단건삭제 시
 * 직전 삭제가 추가한 예외를 놓쳐 서버 배열을 덮어쓰고 회차가 되살아나는 레이스를 방지한다.
 */
export function mergeOccurrenceExceptions(
  target: CalendarEvent,
  cachedEventArrays: (CalendarEvent[] | undefined)[],
  occDate: string
): string[] {
  const set = new Set<string>(target.repeat?.exceptions ?? []);
  cachedEventArrays.forEach((data) =>
    data?.forEach((e) => {
      if (e.id === target.id) {
        e.repeat?.exceptions?.forEach((d) => set.add(d));
      }
    })
  );
  set.add(occDate);
  return Array.from(set);
}

/**
 * 삭제 낙관적 업데이트 — 대상을 캐시에서 제거하고, 단건(EXDATE) 삭제면 같은 마스터의 남은
 * 인스턴스 예외 목록도 갱신해 다음 단건삭제가 최신값을 읽게 한다.
 */
export function applyOccurrenceDeleteOptimistic(
  events: CalendarEvent[] | undefined,
  target: CalendarEvent,
  isOccurrence: boolean,
  mergedExceptions: string[]
): CalendarEvent[] | undefined {
  return events
    ?.filter((e) =>
      isOccurrence
        ? !(e.id === target.id && e.start === target.start)
        : e.id !== target.id
    )
    .map((e) =>
      isOccurrence && e.id === target.id && e.repeat
        ? { ...e, repeat: { ...e.repeat, exceptions: mergedExceptions } }
        : e
    );
}
