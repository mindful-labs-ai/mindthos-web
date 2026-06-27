import { serverRequest } from '@/shared/api/server/serverClient';

import type {
  CalendarCategory,
  CalendarCategoryInput,
  CalendarColorKey,
  CalendarDateRange,
  CalendarEvent,
  CalendarEventInput,
  CalendarEventKind,
  CalendarEventTimeKind,
  CalendarRepeatCycle,
  CalendarRepeatRule,
  CounselMethod,
} from '../types';

import type { CalendarDataSource, UpdateEventOptions } from './types';

/**
 * mindthos-server 실제 캘린더 API 어댑터.
 *
 * 서버 계약 (모두 /v1, Bearer):
 *  - GET    /calendar?from=&to=  → { event, holiday, category } (반복 펼쳐진 인스턴스)
 *  - POST   /calendar/events
 *  - PATCH  /calendar/events/:id
 *  - DELETE /calendar/events/:id
 *  - POST   /calendar/categories
 *  - PATCH  /calendar/categories/:id
 *  - DELETE /calendar/categories/:id
 *
 * serverRequest가 `/v1` prefix·Bearer·envelope(data) 처리를 담당하므로
 * 여기서는 path와 DTO↔UI 모델 매핑만 신경 쓴다.
 *
 * 매핑 메모:
 *  - 서버 event.kind = COUNSELING | PERSONAL (공휴일은 별도 holiday[]).
 *    프론트 kind = counseling | personal | holiday → holiday는 holiday[]에서 파생.
 *  - 이벤트엔 색이 없다(서버). colorKey는 categoryId→category.colorKey, 없으면 kind 기본값.
 *  - 서버 시각 필드 startsAt/endsAt ↔ 프론트 start/end.
 */

const CALENDAR_ROUTES = {
  base: '/calendar',
  events: '/calendar/events',
  event: (id: string) => `/calendar/events/${id}`,
  categories: '/calendar/categories',
  category: (id: string) => `/calendar/categories/${id}`,
} as const;

/** 서버 enum(대문자) */
type ServerEventKind = 'COUNSELING' | 'PERSONAL';
type ServerColorKey =
  | 'GREEN'
  | 'RED'
  | 'BLUE'
  | 'GREY'
  | 'ORANGE'
  | 'YELLOW'
  | 'PURPLE'
  | 'PINK';
type ServerRepeatCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type ServerCounselMethod = 'IN_PERSON' | 'ONLINE';

/** GET /calendar event[] 원소 (반복 펼쳐진 인스턴스) */
interface CalendarEventDto {
  id: string;
  kind: ServerEventKind;
  title: string;
  clientId: string | null;
  categoryId: string | null;
  startsAt: string;
  endsAt: string | null;
  eventTimeKind: CalendarEventTimeKind;
  counselMethod: ServerCounselMethod | null;
  repeatCycle: ServerRepeatCycle | null;
  repeatCount: number | null;
  repeatInterval: number;
  repeatUntil: string | null;
  repeatExceptions: string[] | null;
}

/** GET /calendar holiday[] 원소 (public.holiday, date-only) */
interface HolidayDto {
  id: string;
  name: string;
  date: string;
}

/** GET /calendar category[] 원소 */
interface CalendarCategoryDto {
  id: string;
  name: string;
  colorKey: ServerColorKey;
  sourceProvider: 'GOOGLE' | 'NAVER' | 'APPLE' | null;
}

/** GET /calendar 응답 data */
interface GetCalendarResponse {
  event: CalendarEventDto[];
  holiday: HolidayDto[];
  category: CalendarCategoryDto[];
}

/** POST/PATCH /calendar/events 요청 body */
interface EventRequestBody {
  kind: ServerEventKind;
  title: string;
  clientId?: string | null;
  categoryId?: string | null;
  // startsAt/endsAt/eventTimeKind는 앵커 보존 PATCH에선 생략 가능(서버가 기존값 유지).
  startsAt?: string;
  endsAt?: string | null;
  eventTimeKind?: CalendarEventTimeKind;
  counselMethod?: ServerCounselMethod | null;
  repeatCycle?: ServerRepeatCycle | null;
  repeatCount?: number | null;
  repeatInterval?: number | null;
  repeatUntil?: string | null;
  repeatExceptions?: string[] | null;
}

/** POST/PATCH /calendar/categories 요청 body */
interface CategoryRequestBody {
  name: string;
  colorKey: ServerColorKey;
}

const KIND_TO_SERVER: Record<
  Exclude<CalendarEventKind, 'holiday'>,
  ServerEventKind
> = {
  counseling: 'COUNSELING',
  personal: 'PERSONAL',
};

const KIND_FROM_SERVER: Record<ServerEventKind, CalendarEventKind> = {
  COUNSELING: 'counseling',
  PERSONAL: 'personal',
};

const COLOR_TO_SERVER: Record<CalendarColorKey, ServerColorKey> = {
  green: 'GREEN',
  red: 'RED',
  blue: 'BLUE',
  grey: 'GREY',
  orange: 'ORANGE',
  yellow: 'YELLOW',
  purple: 'PURPLE',
  pink: 'PINK',
};

const COLOR_FROM_SERVER: Record<ServerColorKey, CalendarColorKey> = {
  GREEN: 'green',
  RED: 'red',
  BLUE: 'blue',
  GREY: 'grey',
  ORANGE: 'orange',
  YELLOW: 'yellow',
  PURPLE: 'purple',
  PINK: 'pink',
};

const REPEAT_TO_SERVER: Record<CalendarRepeatCycle, ServerRepeatCycle> = {
  daily: 'DAILY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  yearly: 'YEARLY',
};

const REPEAT_FROM_SERVER: Record<ServerRepeatCycle, CalendarRepeatCycle> = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
};

const COUNSEL_METHOD_TO_SERVER: Record<CounselMethod, ServerCounselMethod> = {
  in_person: 'IN_PERSON',
  online: 'ONLINE',
};

const COUNSEL_METHOD_FROM_SERVER: Record<ServerCounselMethod, CounselMethod> = {
  IN_PERSON: 'in_person',
  ONLINE: 'online',
};

/** 서버 이벤트 DTO의 repeat_* → 프론트 반복 규칙. repeatCycle 없으면 단일 일정(null). */
function toRepeatRule(dto: CalendarEventDto): CalendarRepeatRule | null {
  if (!dto.repeatCycle) return null;
  return {
    cycle: REPEAT_FROM_SERVER[dto.repeatCycle],
    interval: dto.repeatInterval ?? 1,
    count: dto.repeatCount,
    until: dto.repeatUntil,
    exceptions: dto.repeatExceptions,
  };
}

/** kind 기본색 (카테고리 없는 이벤트) */
function defaultColorForKind(kind: CalendarEventKind): CalendarColorKey {
  return kind === 'counseling' ? 'green' : 'red';
}

/** CalendarEventDto → 프론트 CalendarEvent (색은 카테고리/kind에서 파생) */
function toCalendarEvent(
  dto: CalendarEventDto,
  categoryColor: Map<string, CalendarColorKey>
): CalendarEvent {
  const kind = KIND_FROM_SERVER[dto.kind];
  const colorKey =
    (dto.categoryId ? categoryColor.get(dto.categoryId) : undefined) ??
    defaultColorForKind(kind);
  return {
    id: dto.id,
    title: dto.title,
    kind,
    colorKey,
    start: dto.startsAt,
    end: dto.endsAt ?? undefined,
    eventTimeKind: dto.eventTimeKind,
    categoryId: dto.categoryId ?? undefined,
    clientId: dto.clientId ?? null,
    counselMethod: dto.counselMethod
      ? COUNSEL_METHOD_FROM_SERVER[dto.counselMethod]
      : null,
    repeat: toRepeatRule(dto),
  };
}

/** HolidayDto → 프론트 CalendarEvent (kind=holiday, 종일) */
function holidayToCalendarEvent(dto: HolidayDto): CalendarEvent {
  return {
    id: `holiday-${dto.id}`,
    title: dto.name,
    kind: 'holiday',
    colorKey: 'grey',
    // date-only(YYYY-MM-DD) → 그 날 자정. UI는 ALL_DAY로 종일 처리.
    start: `${dto.date}T00:00:00`,
    eventTimeKind: 'ALL_DAY',
  };
}

/** CalendarCategoryDto → 프론트 CalendarCategory */
function toCalendarCategory(dto: CalendarCategoryDto): CalendarCategory {
  return {
    id: dto.id,
    name: dto.name,
    colorKey: COLOR_FROM_SERVER[dto.colorKey] ?? 'grey',
    sourceProvider: dto.sourceProvider
      ? (dto.sourceProvider.toLowerCase() as 'google' | 'naver' | 'apple')
      : null,
  };
}

/** 프론트 입력 → 서버 event body */
function toEventRequestBody(
  input: CalendarEventInput,
  preserveAnchor = false
): EventRequestBody {
  // holiday는 서버 이벤트 종류가 아니다(public.holiday). 사용자는 counseling/personal만 생성.
  const kind: ServerEventKind =
    input.kind === 'holiday' ? 'PERSONAL' : KIND_TO_SERVER[input.kind];
  const repeat = input.repeat ?? null;
  const body: EventRequestBody = {
    kind,
    title: input.title,
    clientId: input.clientId ?? null,
    categoryId: input.categoryId ?? null,
    // 상담 방식: 상담 일정에서만 값, 그 외 null(서버가 개인+방식 조합을 400으로 막음).
    counselMethod: input.counselMethod
      ? COUNSEL_METHOD_TO_SERVER[input.counselMethod]
      : null,
    // 반복 해제(repeat=null)도 명시적으로 null을 보내 서버에서 부수 필드까지 정리되게 한다.
    repeatCycle: repeat ? REPEAT_TO_SERVER[repeat.cycle] : null,
  };
  // 앵커 보존 모드(반복 일정의 단건 편집)에선 시간 앵커를 보내지 않는다 — 서버가 마스터
  // 기존 startsAt/endsAt/eventTimeKind를 유지하므로 occurrence로 재앵커되지 않는다.
  if (!preserveAnchor) {
    body.startsAt = input.start;
    body.endsAt = input.end ?? null;
    body.eventTimeKind = input.eventTimeKind ?? 'TIMED';
  }
  // 반복이 있을 때만 부수 필드 전송(없을 때 보내면 서버가 400). 종료조건 없으면 count/until은 null.
  if (repeat) {
    body.repeatInterval = repeat.interval;
    body.repeatCount = repeat.count;
    body.repeatUntil = repeat.until;
    body.repeatExceptions = repeat.exceptions;
  }
  return body;
}

export const realCalendarDataSource: CalendarDataSource = {
  async listEvents(range: CalendarDateRange): Promise<CalendarEvent[]> {
    const qs = new URLSearchParams({
      from: range.start,
      to: range.end,
    }).toString();

    const data = await serverRequest<GetCalendarResponse>(
      `${CALENDAR_ROUTES.base}?${qs}`
    );

    const categoryColor = new Map<string, CalendarColorKey>(
      data.category.map((c) => [c.id, COLOR_FROM_SERVER[c.colorKey] ?? 'grey'])
    );

    return [
      ...data.event.map((e) => toCalendarEvent(e, categoryColor)),
      ...data.holiday.map(holidayToCalendarEvent),
    ];
  },

  async listCategories(): Promise<CalendarCategory[]> {
    const data = await serverRequest<GetCalendarResponse>(
      `${CALENDAR_ROUTES.base}?${new URLSearchParams({
        // 카테고리만 필요한 경량 호출이지만 GET /calendar가 통합 응답이므로
        // 좁은 범위(오늘 하루)로 카테고리 목록만 취한다.
        from: new Date().toISOString(),
        to: new Date().toISOString(),
      }).toString()}`
    );
    return data.category.map(toCalendarCategory);
  },

  async createEvent(input: CalendarEventInput): Promise<CalendarEvent> {
    const dto = await serverRequest<CalendarEventDto>(CALENDAR_ROUTES.events, {
      method: 'POST',
      body: toEventRequestBody(input),
    });
    return toCalendarEvent(dto, new Map());
  },

  async updateEvent(
    id: string,
    input: CalendarEventInput,
    options?: UpdateEventOptions
  ): Promise<CalendarEvent> {
    const dto = await serverRequest<CalendarEventDto>(
      CALENDAR_ROUTES.event(id),
      {
        method: 'PATCH',
        body: toEventRequestBody(input, options?.preserveAnchor),
      }
    );
    return toCalendarEvent(dto, new Map());
  },

  async deleteEvent(id: string): Promise<void> {
    await serverRequest<void>(CALENDAR_ROUTES.event(id), { method: 'DELETE' });
  },

  async updateEventExceptions(id: string, exceptions: string[]): Promise<void> {
    // 부분 PATCH — startsAt 등 다른 필드는 서버가 기존 값을 보존하므로(미지정 시 유지)
    // 예외 목록만 보낸다. 마스터 anchor가 occurrence로 밀리는 버그를 피한다.
    await serverRequest<CalendarEventDto>(CALENDAR_ROUTES.event(id), {
      method: 'PATCH',
      body: { repeatExceptions: exceptions },
    });
  },

  async createCategory(
    input: CalendarCategoryInput
  ): Promise<CalendarCategory> {
    const body: CategoryRequestBody = {
      name: input.name,
      colorKey: COLOR_TO_SERVER[input.colorKey],
    };
    const dto = await serverRequest<CalendarCategoryDto>(
      CALENDAR_ROUTES.categories,
      { method: 'POST', body }
    );
    return toCalendarCategory(dto);
  },

  async updateCategory(
    id: string,
    input: CalendarCategoryInput
  ): Promise<CalendarCategory> {
    const body: CategoryRequestBody = {
      name: input.name,
      colorKey: COLOR_TO_SERVER[input.colorKey],
    };
    const dto = await serverRequest<CalendarCategoryDto>(
      CALENDAR_ROUTES.category(id),
      { method: 'PATCH', body }
    );
    return toCalendarCategory(dto);
  },

  async deleteCategory(id: string): Promise<void> {
    await serverRequest<void>(CALENDAR_ROUTES.category(id), {
      method: 'DELETE',
    });
  },
};
