import { describe, expect, it } from 'vitest';

import type { AddEventDraft, CalendarEvent } from '../types';

import { dayjs } from './calendarDate';
import {
  applyScopedDeleteOptimistic,
  buildCalendarEventInput,
  computeEventTimes,
} from './eventMutations';

function draft(overrides: Partial<AddEventDraft> = {}): AddEventDraft {
  return {
    kind: 'counseling',
    title: '상담',
    eventTimeKind: 'TIMED',
    startTime: '09:00',
    endTime: '10:00',
    clientId: null,
    counselMethod: null,
    categoryId: null,
    repeat: null,
    ...overrides,
  };
}

function event(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'e1',
    title: '상담',
    kind: 'counseling',
    colorKey: 'blue',
    start: '2026-06-10T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeEventTimes', () => {
  it('시간 일정은 선택 시각, 하루종일은 00:00 시작·종료 없음', () => {
    const date = dayjs('2026-06-10T00:00:00');
    const timed = computeEventTimes(draft({ startTime: '13:30' }), date);
    expect(timed.isAllDay).toBe(false);
    expect(timed.start.format('HH:mm')).toBe('13:30');
    expect(timed.end?.format('HH:mm')).toBe('10:00');

    const allDay = computeEventTimes(draft({ eventTimeKind: 'ALL_DAY' }), date);
    expect(allDay.isAllDay).toBe(true);
    expect(allDay.start.format('HH:mm')).toBe('00:00');
    expect(allDay.end).toBeUndefined();
  });
});

describe('buildCalendarEventInput', () => {
  const date = dayjs('2026-06-10T00:00:00');

  it('종류가 그대로면 기존 색 유지, 바뀌면 kind 기본값', () => {
    const editing = event({ kind: 'counseling', colorKey: 'purple' });
    expect(
      buildCalendarEventInput(draft({ kind: 'counseling' }), date, editing)
        .colorKey
    ).toBe('purple');
    expect(
      buildCalendarEventInput(draft({ kind: 'personal' }), date, editing)
        .colorKey
    ).toBe('red');
    expect(
      buildCalendarEventInput(draft({ kind: 'counseling' }), date, null)
        .colorKey
    ).toBe('green');
  });

  it('빈 제목은 "제목 없음"으로 대체', () => {
    expect(
      buildCalendarEventInput(draft({ title: '   ' }), date, null).title
    ).toBe('제목 없음');
  });
});

describe('applyScopedDeleteOptimistic', () => {
  // 한 시리즈의 회차 3개(각각 고유 id) + 무관 단일 일정 1개.
  const series = (): CalendarEvent[] => [
    event({ id: 'a', seriesId: 's1', start: '2026-06-01T00:00:00.000Z' }),
    event({ id: 'b', seriesId: 's1', start: '2026-06-08T00:00:00.000Z' }),
    event({ id: 'c', seriesId: 's1', start: '2026-06-15T00:00:00.000Z' }),
    event({ id: 'x', seriesId: null, start: '2026-06-09T00:00:00.000Z' }),
  ];

  it('this는 그 회차(id)만 제거', () => {
    const events = series();
    const result = applyScopedDeleteOptimistic(events, events[1], 'this');
    expect(result?.map((e) => e.id)).toEqual(['a', 'c', 'x']);
  });

  it('following은 같은 시리즈의 기준 시작 이후 회차들만 제거', () => {
    const events = series();
    const result = applyScopedDeleteOptimistic(events, events[1], 'following');
    // b(기준)·c 제거, a(이전)·x(무관) 유지.
    expect(result?.map((e) => e.id)).toEqual(['a', 'x']);
  });

  it('all은 같은 시리즈 전체 제거(무관 일정 유지)', () => {
    const events = series();
    const result = applyScopedDeleteOptimistic(events, events[1], 'all');
    expect(result?.map((e) => e.id)).toEqual(['x']);
  });

  it('단일 일정(seriesId 없음)은 scope와 무관하게 그 id만 제거', () => {
    const events = series();
    const result = applyScopedDeleteOptimistic(events, events[3], 'all');
    expect(result?.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });
});
