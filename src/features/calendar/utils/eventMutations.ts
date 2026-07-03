/**
 * 일정 생성/편집 폼 → 도메인 입력 변환의 '순수' 로직 — 컨테이너(상태·API·캐시)에서 분리해 단위 테스트한다.
 */
import { KIND_DEFAULT_COLOR } from '../constants';
import type { AddEventDraft, CalendarEventInput } from '../types';

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

/** draft + 기준 날짜 → 서버 전송용 CalendarEventInput. */
export function buildCalendarEventInput(
  draft: AddEventDraft,
  date: Dayjs
): CalendarEventInput {
  const { start, end } = computeEventTimes(draft, date);
  return {
    title: draft.title.trim() || '제목 없음',
    kind: draft.kind,
    // 색은 draft가 보관(패널 색상 선택기). 방어적으로 kind 기본색으로 폴백.
    colorKey: draft.colorKey ?? KIND_DEFAULT_COLOR[draft.kind],
    start: start.toISOString(),
    end: end?.toISOString(),
    eventTimeKind: draft.eventTimeKind,
    categoryId: draft.categoryId ?? undefined,
    clientId: draft.clientId,
    counselMethod: draft.counselMethod,
    repeat: draft.repeat,
  };
}
