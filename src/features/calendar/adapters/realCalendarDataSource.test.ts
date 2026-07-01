import { beforeEach, describe, expect, it, vi } from 'vitest';

import { serverRequest } from '@/shared/api/server/serverClient';

import type { CalendarEventInput } from '../types';

import { realCalendarDataSource } from './realCalendarDataSource';

vi.mock('@/shared/api/server/serverClient', () => ({
  serverRequest: vi.fn(),
}));

const req = serverRequest as unknown as ReturnType<typeof vi.fn>;

/** 서버 CalendarEventDto 한 건(부분 지정 + 기본값). */
function eventDto(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'm1',
    kind: 'PERSONAL',
    title: '주간',
    colorKey: 'BLUE', // 서버 enum은 대문자 — 어댑터가 소문자로 변환

    clientId: null,
    categoryId: null,
    startsAt: '2026-01-01T09:00:00.000Z',
    endsAt: null,
    eventTimeKind: 'TIMED',
    counselMethod: null,
    repeatCycle: null,
    repeatCount: null,
    repeatInterval: 1,
    repeatUntil: null,
    seriesId: null,
    occurrenceDate: null,
    recurrenceOriginalDate: null,
    ...over,
  };
}

function input(over: Partial<CalendarEventInput> = {}): CalendarEventInput {
  return {
    title: '일정',
    kind: 'personal',
    colorKey: 'red',
    start: '2026-01-01T09:00:00.000Z',
    eventTimeKind: 'TIMED',
    clientId: null,
    counselMethod: null,
    repeat: null,
    ...over,
  };
}

beforeEach(() => {
  req.mockReset();
});

describe('realCalendarDataSource.listEvents — DTO 매핑', () => {
  it('마스터 인스턴스/override/단일을 seriesId·occurrenceDate·repeat로 매핑.', async () => {
    req.mockResolvedValue({
      event: [
        eventDto({
          id: 'm1',
          repeatCycle: 'WEEKLY',
          repeatCount: 10,
          repeatInterval: 1,
          seriesId: 's1',
          occurrenceDate: '2026-01-01',
        }),
        eventDto({
          id: 'o1',
          startsAt: '2026-01-08T14:00:00.000Z',
          seriesId: 's1',
          occurrenceDate: '2026-01-08',
          recurrenceOriginalDate: '2026-01-08',
        }),
        eventDto({
          id: 'sg',
          startsAt: '2026-01-05T10:00:00.000Z',
          colorKey: 'ORANGE',
        }),
      ],
      holiday: [],
      category: [],
    });

    const events = await realCalendarDataSource.listEvents({
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-01-31T23:59:59.000Z',
    });

    const instance = events.find((e) => e.id === 'm1');
    expect(instance?.seriesId).toBe('s1');
    expect(instance?.occurrenceDate).toBe('2026-01-01');
    // 색은 이벤트 DTO가 직접 보관 — 서버 대문자(BLUE)를 소문자(blue)로 변환해 읽는다.
    expect(instance?.colorKey).toBe('blue');
    expect(instance?.repeat).toEqual({
      cycle: 'weekly',
      interval: 1,
      count: 10,
      until: null,
    });

    const override = events.find((e) => e.id === 'o1');
    expect(override?.seriesId).toBe('s1');
    expect(override?.occurrenceDate).toBe('2026-01-08');
    expect(override?.repeat).toBeNull();

    const single = events.find((e) => e.id === 'sg');
    expect(single?.seriesId).toBeNull();
    expect(single?.occurrenceDate).toBeNull();
    expect(single?.repeat).toBeNull();
    expect(single?.colorKey).toBe('orange');
  });

  it('미확인/누락 colorKey는 grey로 폴백하고 throw하지 않는다.', async () => {
    req.mockResolvedValue({
      event: [
        // 8종에 없는 값(대소문자 무관) → grey
        eventDto({ id: 'unknown', colorKey: 'MAGENTA' }),
        // 누락(null/undefined) → grey (.toLowerCase() 크래시 방지)
        eventDto({ id: 'missing', colorKey: undefined }),
      ],
      holiday: [],
      category: [],
    });

    const events = await realCalendarDataSource.listEvents({
      start: '2026-01-01T00:00:00.000Z',
      end: '2026-01-31T23:59:59.000Z',
    });

    expect(events.find((e) => e.id === 'unknown')?.colorKey).toBe('grey');
    expect(events.find((e) => e.id === 'missing')?.colorKey).toBe('grey');
  });
});

describe('realCalendarDataSource.createEvent', () => {
  it('반복 규칙을 body로 전송.', async () => {
    req.mockResolvedValue(eventDto({ repeatCycle: 'WEEKLY', seriesId: 's1' }));
    await realCalendarDataSource.createEvent?.(
      input({
        repeat: { cycle: 'weekly', interval: 2, count: 5, until: null },
      })
    );
    const [, opts] = req.mock.calls[0];
    expect(opts.method).toBe('POST');
    expect(opts.body).toMatchObject({
      colorKey: 'RED', // 프론트 소문자 red → 서버 대문자 RED로 변환 전송
      repeatCycle: 'WEEKLY',
      repeatInterval: 2,
      repeatCount: 5,
      repeatUntil: null,
    });
  });
});

describe('realCalendarDataSource.updateEvent — scope/occurrenceDate 쿼리', () => {
  it('this + occurrenceDate를 쿼리로 전송.', async () => {
    req.mockResolvedValue(eventDto());
    await realCalendarDataSource.updateEvent?.('m1', input(), {
      scope: 'this',
      occurrenceDate: '2026-01-15',
    });
    const [url, opts] = req.mock.calls[0];
    expect(url).toContain('/calendar/events/m1?');
    expect(url).toContain('scope=this');
    expect(url).toContain('occurrenceDate=2026-01-15');
    expect(opts.method).toBe('PATCH');
  });

  it('occurrenceDate 없으면 scope만 전송.', async () => {
    req.mockResolvedValue(eventDto());
    await realCalendarDataSource.updateEvent?.('m1', input(), { scope: 'all' });
    const [url] = req.mock.calls[0];
    expect(url).toContain('scope=all');
    expect(url).not.toContain('occurrenceDate');
  });
});

describe('realCalendarDataSource.deleteEvent — scope/occurrenceDate 쿼리', () => {
  it('following + occurrenceDate를 쿼리로 전송.', async () => {
    req.mockResolvedValue(undefined);
    await realCalendarDataSource.deleteEvent?.('m1', 'following', '2026-01-15');
    const [url, opts] = req.mock.calls[0];
    expect(url).toContain('scope=following');
    expect(url).toContain('occurrenceDate=2026-01-15');
    expect(opts.method).toBe('DELETE');
  });

  it('기본 scope=this.', async () => {
    req.mockResolvedValue(undefined);
    await realCalendarDataSource.deleteEvent?.('m1');
    const [url] = req.mock.calls[0];
    expect(url).toContain('scope=this');
  });
});
