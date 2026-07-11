import { describe, expect, it } from 'vitest';

import type { AddEventDraft } from '../types';

import { dayjs } from './calendarDate';
import { buildCalendarEventInput, computeEventTimes } from './eventMutations';

function draft(overrides: Partial<AddEventDraft> = {}): AddEventDraft {
  return {
    kind: 'counseling',
    colorKey: 'green',
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

  it('draft.colorKey가 이벤트 색을 결정', () => {
    expect(
      buildCalendarEventInput(draft({ colorKey: 'purple' }), date).colorKey
    ).toBe('purple');
    expect(
      buildCalendarEventInput(
        draft({ kind: 'personal', colorKey: 'pink' }),
        date
      ).colorKey
    ).toBe('pink');
  });

  it('colorKey 없으면 kind 기본색으로 방어', () => {
    expect(
      buildCalendarEventInput(draft({ colorKey: undefined }), date).colorKey
    ).toBe('green');
    expect(
      buildCalendarEventInput(
        draft({ kind: 'personal', colorKey: undefined }),
        date
      ).colorKey
    ).toBe('red');
  });

  it('빈 제목은 "제목 없음"으로 대체', () => {
    expect(buildCalendarEventInput(draft({ title: '   ' }), date).title).toBe(
      '제목 없음'
    );
  });
});
