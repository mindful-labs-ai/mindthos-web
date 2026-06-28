import { describe, expect, it } from 'vitest';

import type { AddEventDraft, CalendarEvent } from '../types';

import { dayjs } from './calendarDate';
import {
  applyOccurrenceDeleteOptimistic,
  buildCalendarEventInput,
  computeEventTimes,
  hasAnchorChanged,
  mergeOccurrenceExceptions,
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

describe('hasAnchorChanged', () => {
  const date = dayjs('2026-06-10T00:00:00');

  it('편집 중이 아니면 false', () => {
    expect(hasAnchorChanged(draft(), date, null)).toBe(false);
  });

  it('시간/종료 변경이 없으면(라운드트립) false', () => {
    const d = draft({ startTime: '09:00', endTime: '10:00' });
    const t = computeEventTimes(d, date);
    const editing = event({
      eventTimeKind: 'TIMED',
      start: t.start.toISOString(),
      end: t.end?.toISOString(),
    });
    expect(hasAnchorChanged(d, date, editing)).toBe(false);
  });

  it('시작 시각이 바뀌면 true', () => {
    const editing = event({
      eventTimeKind: 'TIMED',
      start: computeEventTimes(
        draft({ startTime: '09:00' }),
        date
      ).start.toISOString(),
    });
    expect(hasAnchorChanged(draft({ startTime: '11:00' }), date, editing)).toBe(
      true
    );
  });

  it('외부 연동 올데이(UTC 자정 저장) 제목만 수정은 재앵커 오탐 없음', () => {
    // 회귀 가드: ISO 직접 비교였다면 KST 재구성과 어긋나 true가 됐었다.
    const start = '2026-06-10T00:00:00.000Z';
    const editing = event({ eventTimeKind: 'ALL_DAY', start });
    const sameDate = dayjs(start);
    expect(
      hasAnchorChanged(draft({ eventTimeKind: 'ALL_DAY' }), sameDate, editing)
    ).toBe(false);
  });

  it('올데이 날짜가 바뀌면 true', () => {
    const editing = event({
      eventTimeKind: 'ALL_DAY',
      start: '2026-06-10T00:00:00.000Z',
    });
    expect(
      hasAnchorChanged(
        draft({ eventTimeKind: 'ALL_DAY' }),
        dayjs('2026-06-11T00:00:00.000Z'),
        editing
      )
    ).toBe(true);
  });
});

describe('mergeOccurrenceExceptions', () => {
  it('대상·캐시 인스턴스 예외 + occDate를 합쳐 중복 제거', () => {
    const target = event({
      id: 'm1',
      repeat: {
        cycle: 'weekly',
        interval: 1,
        count: 5,
        until: null,
        exceptions: ['2026-06-01'],
      },
    });
    const cached: CalendarEvent[] = [
      event({
        id: 'm1',
        start: '2026-06-08T00:00:00.000Z',
        repeat: {
          cycle: 'weekly',
          interval: 1,
          count: 5,
          until: null,
          exceptions: ['2026-06-08'],
        },
      }),
      event({ id: 'other' }),
    ];
    expect(
      mergeOccurrenceExceptions(
        target,
        [cached, undefined],
        '2026-06-15'
      ).sort()
    ).toEqual(['2026-06-01', '2026-06-08', '2026-06-15']);
  });
});

describe('applyOccurrenceDeleteOptimistic', () => {
  const repeat = {
    cycle: 'weekly' as const,
    interval: 1,
    count: 5,
    until: null,
    exceptions: null,
  };

  it('단건 삭제는 해당 회차만 제거하고 남은 인스턴스 예외를 갱신', () => {
    const events: CalendarEvent[] = [
      event({ id: 'm1', start: '2026-06-08T00:00:00.000Z', repeat }),
      event({ id: 'm1', start: '2026-06-15T00:00:00.000Z', repeat }),
    ];
    const target = events[0];
    const result = applyOccurrenceDeleteOptimistic(events, target, true, [
      '2026-06-08',
    ]);
    expect(result).toHaveLength(1);
    expect(result?.[0].start).toBe('2026-06-15T00:00:00.000Z');
    expect(result?.[0].repeat?.exceptions).toEqual(['2026-06-08']);
  });

  it('전체 삭제는 같은 id를 모두 제거', () => {
    const events: CalendarEvent[] = [
      event({ id: 'm1', start: '2026-06-08T00:00:00.000Z', repeat }),
      event({ id: 'm1', start: '2026-06-15T00:00:00.000Z', repeat }),
      event({ id: 'keep' }),
    ];
    const result = applyOccurrenceDeleteOptimistic(
      events,
      events[0],
      false,
      []
    );
    expect(result?.map((e) => e.id)).toEqual(['keep']);
  });
});
