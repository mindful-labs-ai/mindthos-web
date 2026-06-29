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
  CounselMethod,
} from '../types';

import type {
  CalendarDataSource,
  CalendarEventScope,
  UpdateEventOptions,
} from './types';

/**
 * mindthos-server 실제 캘린더 API 어댑터.
 *
 * 서버 계약 (모두 /v1, Bearer):
 *  - GET    /calendar?from=&to=  → { event, holiday, category } (회차별 row 그대로)
 *  - POST   /calendar/events
 *  - PATCH  /calendar/events/:id?scope=this|following|all
 *  - DELETE /calendar/events/:id?scope=this|following|all
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

/** GET /calendar event[] 원소 (회차별 row 그대로) */
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
  /** 같은 반복(시리즈) 묶음 id. null = 단일 일정 */
  repeatSeriesId: string | null;
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
  // 시간 앵커 — 생성·수정 모두 전송(수정은 scope에 따라 서버가 회차 시간대로 적용).
  startsAt?: string;
  endsAt?: string | null;
  eventTimeKind?: CalendarEventTimeKind;
  counselMethod?: ServerCounselMethod | null;
  // 반복 규칙은 생성(POST) 시에만 — 서버가 회차 row로 materialize. 수정(PATCH)에선 보내지 않는다.
  repeatCycle?: ServerRepeatCycle | null;
  repeatCount?: number | null;
  repeatInterval?: number | null;
  repeatUntil?: string | null;
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

const COUNSEL_METHOD_TO_SERVER: Record<CounselMethod, ServerCounselMethod> = {
  in_person: 'IN_PERSON',
  online: 'ONLINE',
};

const COUNSEL_METHOD_FROM_SERVER: Record<ServerCounselMethod, CounselMethod> = {
  IN_PERSON: 'in_person',
  ONLINE: 'online',
};

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
    seriesId: dto.repeatSeriesId ?? null,
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

/**
 * 프론트 입력 → 서버 event body. 시간 앵커(startsAt/endsAt/eventTimeKind)는 항상 전송한다.
 * 반복 규칙은 생성 때만(`includeRepeat`) — 서버가 회차 row로 materialize. 수정에선 보내지 않는다
 * (반복주기 변경 미지원, 적용 범위는 ?scope= 쿼리로).
 */
function toEventRequestBody(
  input: CalendarEventInput,
  includeRepeat: boolean
): EventRequestBody {
  // holiday는 서버 이벤트 종류가 아니다(public.holiday). 사용자는 counseling/personal만 생성.
  const kind: ServerEventKind =
    input.kind === 'holiday' ? 'PERSONAL' : KIND_TO_SERVER[input.kind];
  const body: EventRequestBody = {
    kind,
    title: input.title,
    clientId: input.clientId ?? null,
    categoryId: input.categoryId ?? null,
    // 상담 방식: 상담 일정에서만 값, 그 외 null(서버가 개인+방식 조합을 400으로 막음).
    counselMethod: input.counselMethod
      ? COUNSEL_METHOD_TO_SERVER[input.counselMethod]
      : null,
    startsAt: input.start,
    endsAt: input.end ?? null,
    eventTimeKind: input.eventTimeKind ?? 'TIMED',
  };
  // 생성 시 반복이 있으면 규칙 전송(종료조건 없으면 서버가 400). 단일·수정엔 미전송.
  const repeat = includeRepeat ? (input.repeat ?? null) : null;
  if (repeat) {
    body.repeatCycle = REPEAT_TO_SERVER[repeat.cycle];
    body.repeatInterval = repeat.interval;
    body.repeatCount = repeat.count;
    body.repeatUntil = repeat.until;
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
      body: toEventRequestBody(input, true),
    });
    return toCalendarEvent(dto, new Map());
  },

  async updateEvent(
    id: string,
    input: CalendarEventInput,
    options?: UpdateEventOptions
  ): Promise<CalendarEvent> {
    const scope = options?.scope ?? 'this';
    const dto = await serverRequest<CalendarEventDto>(
      `${CALENDAR_ROUTES.event(id)}?scope=${scope}`,
      {
        method: 'PATCH',
        body: toEventRequestBody(input, false),
      }
    );
    return toCalendarEvent(dto, new Map());
  },

  async deleteEvent(
    id: string,
    scope: CalendarEventScope = 'this'
  ): Promise<void> {
    await serverRequest<void>(`${CALENDAR_ROUTES.event(id)}?scope=${scope}`, {
      method: 'DELETE',
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
