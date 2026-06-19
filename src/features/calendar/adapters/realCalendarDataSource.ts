import { serverRequest } from '@/shared/api/server/serverClient';

import type {
  CalendarCategory,
  CalendarCategoryInput,
  CalendarColorKey,
  CalendarDateRange,
  CalendarEvent,
  CalendarEventInput,
  CalendarEventKind,
} from '../types';

import type { CalendarDataSource } from './types';

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
type ServerColorKey = 'GREEN' | 'RED' | 'BLUE' | 'GREY';
type ServerRepeatCycle = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/** GET /calendar event[] 원소 (반복 펼쳐진 인스턴스) */
interface CalendarEventDto {
  id: string;
  kind: ServerEventKind;
  title: string;
  clientId: string | null;
  categoryId: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  repeatCycle: ServerRepeatCycle | null;
  repeatCount: number | null;
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
  startsAt: string;
  endsAt?: string | null;
  allDay: boolean;
  repeatCycle?: ServerRepeatCycle | null;
  repeatCount?: number | null;
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
};

const COLOR_FROM_SERVER: Record<ServerColorKey, CalendarColorKey> = {
  GREEN: 'green',
  RED: 'red',
  BLUE: 'blue',
  GREY: 'grey',
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
    allDay: dto.allDay,
    categoryId: dto.categoryId ?? undefined,
  };
}

/** HolidayDto → 프론트 CalendarEvent (kind=holiday, 종일) */
function holidayToCalendarEvent(dto: HolidayDto): CalendarEvent {
  return {
    id: `holiday-${dto.id}`,
    title: dto.name,
    kind: 'holiday',
    colorKey: 'grey',
    // date-only(YYYY-MM-DD) → 그 날 자정. UI는 allDay로 종일 처리.
    start: `${dto.date}T00:00:00`,
    allDay: true,
  };
}

/** CalendarCategoryDto → 프론트 CalendarCategory */
function toCalendarCategory(dto: CalendarCategoryDto): CalendarCategory {
  return {
    id: dto.id,
    name: dto.name,
    colorKey: COLOR_FROM_SERVER[dto.colorKey] ?? 'grey',
  };
}

/** 프론트 입력 → 서버 event body */
function toEventRequestBody(input: CalendarEventInput): EventRequestBody {
  // holiday는 서버 이벤트 종류가 아니다(public.holiday). 사용자는 counseling/personal만 생성.
  const kind: ServerEventKind =
    input.kind === 'holiday'
      ? 'PERSONAL'
      : KIND_TO_SERVER[input.kind];
  return {
    kind,
    title: input.title,
    categoryId: input.categoryId ?? null,
    startsAt: input.start,
    endsAt: input.end ?? null,
    allDay: input.allDay ?? false,
  };
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
    input: CalendarEventInput
  ): Promise<CalendarEvent> {
    const dto = await serverRequest<CalendarEventDto>(
      CALENDAR_ROUTES.event(id),
      {
        method: 'PATCH',
        body: toEventRequestBody(input),
      }
    );
    return toCalendarEvent(dto, new Map());
  },

  async deleteEvent(id: string): Promise<void> {
    await serverRequest<void>(CALENDAR_ROUTES.event(id), { method: 'DELETE' });
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
