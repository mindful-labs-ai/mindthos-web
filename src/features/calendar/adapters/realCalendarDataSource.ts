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
 *  - 색은 이벤트가 보관한다(서버 event.colorKey). 카테고리는 색이 없다(표시 그룹핑 전용).
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
type ServerRepeatCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
type ServerCounselMethod = 'IN_PERSON' | 'ONLINE';
/** 서버 색상 enum은 대문자(GREEN/RED…), 프론트 CalendarColorKey는 소문자(green/red…). */
type ServerColorKey = Uppercase<CalendarColorKey>;

/** GET /calendar event[] 원소 (마스터 인스턴스 / override / 단일) */
interface CalendarEventDto {
  id: string;
  kind: ServerEventKind;
  title: string;
  /** 표시 색상 — 이벤트가 직접 보관(서버 contract). 서버 enum은 대문자. */
  colorKey: ServerColorKey;
  clientId: string | null;
  categoryId: string | null;
  startsAt: string;
  endsAt: string | null;
  eventTimeKind: CalendarEventTimeKind;
  counselMethod: ServerCounselMethod | null;
  /** 마스터 인스턴스의 반복 규칙(편집 시 표시용). override/단일은 cycle null. */
  repeatCycle: ServerRepeatCycle | null;
  repeatCount: number | null;
  repeatInterval: number;
  repeatUntil: string | null;
  /** 같은 반복(시리즈) 묶음 id. null = 단일 일정. */
  seriesId: string | null;
  /** 이 행이 차지하는 회차 날짜(YYYY-MM-DD UTC). 단일은 null. scope 키. */
  occurrenceDate: string | null;
  /** override가 대체하는 원본 회차 날짜. 그 외 null. */
  recurrenceOriginalDate: string | null;
}

/** GET /calendar holiday[] 원소 (public.holiday, date-only) */
interface HolidayDto {
  id: string;
  name: string;
  date: string;
}

/** GET /calendar category[] 원소 — 색 없음(표시 그룹핑 전용). */
interface CalendarCategoryDto {
  id: string;
  name: string;
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
  /** 표시 색상 — 이벤트가 직접 보관. 서버 enum은 대문자. */
  colorKey: ServerColorKey;
  clientId?: string | null;
  categoryId?: string | null;
  // 시간 앵커 — 생성·수정 모두 전송(수정은 scope에 따라 서버가 회차 시간대로 적용).
  startsAt?: string;
  endsAt?: string | null;
  eventTimeKind?: CalendarEventTimeKind;
  counselMethod?: ServerCounselMethod | null;
  // 반복 규칙 — 생성/수정 모두 전송(하이브리드 모델: 마스터 규칙 + EXDATE + override).
  // PATCH scope=all/following에서 규칙 변경에 쓰이고, 명시적 null은 반복 해제(this/단일은 서버가 무시).
  repeatCycle?: ServerRepeatCycle | null;
  repeatCount?: number | null;
  repeatInterval?: number | null;
  repeatUntil?: string | null;
}

/** POST/PATCH /calendar/categories 요청 body — 색 없음(이름만). */
interface CategoryRequestBody {
  name: string;
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

/**
 * 알려진 8종 색상 키. 서버 colorKey가 이 중 하나가 아니거나 누락/대소문자 불일치면
 * 'grey'로 폴백해 렌더 크래시(예: 미확인 키로 CALENDAR_COLOR_STYLES 접근)를 막는다.
 */
const KNOWN_COLOR_KEYS: ReadonlySet<CalendarColorKey> = new Set([
  'green',
  'red',
  'blue',
  'grey',
  'orange',
  'yellow',
  'purple',
  'pink',
]);

/** 서버 colorKey → 소문자 정규화 + 미확인/누락은 'grey' 폴백. */
function normalizeColorKey(
  raw: ServerColorKey | null | undefined
): CalendarColorKey {
  const lower = ((raw as string | null | undefined) ?? '').toLowerCase();
  return KNOWN_COLOR_KEYS.has(lower as CalendarColorKey)
    ? (lower as CalendarColorKey)
    : 'grey';
}

/** CalendarEventDto → 프론트 CalendarEvent (색은 이벤트가 직접 보관). */
function toCalendarEvent(dto: CalendarEventDto): CalendarEvent {
  return {
    id: dto.id,
    title: dto.title,
    kind: KIND_FROM_SERVER[dto.kind],
    colorKey: normalizeColorKey(dto.colorKey),
    start: dto.startsAt,
    end: dto.endsAt ?? undefined,
    eventTimeKind: dto.eventTimeKind,
    categoryId: dto.categoryId ?? undefined,
    clientId: dto.clientId ?? null,
    counselMethod: dto.counselMethod
      ? COUNSEL_METHOD_FROM_SERVER[dto.counselMethod]
      : null,
    seriesId: dto.seriesId ?? null,
    occurrenceDate: dto.occurrenceDate ?? null,
    // 마스터 인스턴스만 규칙 보유(편집 시 표시용). override/단일은 null.
    repeat: dto.repeatCycle
      ? {
          cycle: REPEAT_FROM_SERVER[dto.repeatCycle],
          interval: dto.repeatInterval ?? 1,
          count: dto.repeatCount,
          until: dto.repeatUntil,
        }
      : null,
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

/** CalendarCategoryDto → 프론트 CalendarCategory (색 없음) */
function toCalendarCategory(dto: CalendarCategoryDto): CalendarCategory {
  return {
    id: dto.id,
    name: dto.name,
    sourceProvider: dto.sourceProvider
      ? (dto.sourceProvider.toLowerCase() as 'google' | 'naver' | 'apple')
      : null,
  };
}

/**
 * 프론트 입력 → 서버 event body. 시간 앵커(startsAt/endsAt/eventTimeKind)는 항상 전송한다.
 * 반복 네 필드(repeatCycle/Interval/Count/Until)도 항상 전송 — 생성은 마스터 규칙, 수정은
 * scope=all/following에서 규칙 변경에 사용. 반복 없음/해제는 네 필드를 명시적 null로 보내
 * 서버가 "해제"와 "미변경"을 구분하게 한다(this/단일은 서버가 규칙 무시).
 * 적용 범위는 ?scope=, 회차는 ?occurrenceDate= 쿼리로.
 */
function toEventRequestBody(input: CalendarEventInput): EventRequestBody {
  // holiday는 서버 이벤트 종류가 아니다(public.holiday). 사용자는 counseling/personal만 생성.
  const kind: ServerEventKind =
    input.kind === 'holiday' ? 'PERSONAL' : KIND_TO_SERVER[input.kind];
  const body: EventRequestBody = {
    kind,
    title: input.title,
    colorKey: input.colorKey.toUpperCase() as ServerColorKey,
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
  const repeat = input.repeat ?? null;
  if (repeat) {
    body.repeatCycle = REPEAT_TO_SERVER[repeat.cycle];
    body.repeatInterval = repeat.interval;
    body.repeatCount = repeat.count;
    body.repeatUntil = repeat.until;
  } else {
    // 반복 없음/해제 — 네 필드를 명시적 null로 보내 서버가 "해제"와 "미변경"을 구분한다.
    body.repeatCycle = null;
    body.repeatInterval = null;
    body.repeatCount = null;
    body.repeatUntil = null;
  }
  return body;
}

/** scope(+occurrenceDate) 쿼리스트링. */
function scopeQuery(
  scope: CalendarEventScope,
  occurrenceDate?: string | null
): string {
  const qs = new URLSearchParams({ scope });
  if (occurrenceDate) {
    qs.set('occurrenceDate', occurrenceDate);
  }
  return qs.toString();
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

    return [
      ...data.event.map(toCalendarEvent),
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
    return toCalendarEvent(dto);
  },

  async updateEvent(
    id: string,
    input: CalendarEventInput,
    options?: UpdateEventOptions
  ): Promise<CalendarEvent> {
    const scope = options?.scope ?? 'this';
    const dto = await serverRequest<CalendarEventDto>(
      `${CALENDAR_ROUTES.event(id)}?${scopeQuery(scope, options?.occurrenceDate)}`,
      {
        method: 'PATCH',
        body: toEventRequestBody(input),
      }
    );
    return toCalendarEvent(dto);
  },

  async deleteEvent(
    id: string,
    scope: CalendarEventScope = 'this',
    occurrenceDate?: string | null
  ): Promise<void> {
    await serverRequest<void>(
      `${CALENDAR_ROUTES.event(id)}?${scopeQuery(scope, occurrenceDate)}`,
      { method: 'DELETE' }
    );
  },

  async createCategory(
    input: CalendarCategoryInput
  ): Promise<CalendarCategory> {
    const body: CategoryRequestBody = {
      name: input.name,
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
