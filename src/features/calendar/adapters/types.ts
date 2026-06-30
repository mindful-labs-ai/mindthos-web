import type {
  CalendarCategory,
  CalendarCategoryInput,
  CalendarDateRange,
  CalendarEvent,
  CalendarEventInput,
  CalendarEventScope,
} from '../types';

export type { CalendarEventScope };

/** updateEvent 옵션 */
export interface UpdateEventOptions {
  /** 반복 일정일 때 적용 범위(단일 일정은 무시). 기본 this */
  scope?: CalendarEventScope;
  /** this/following scope에서 대상 회차 날짜(YYYY-MM-DD UTC). 마스터 인스턴스 수정 시 필요. */
  occurrenceDate?: string | null;
}

/**
 * CalendarDataSource — 캘린더 데이터 접근의 어댑터 경계.
 *
 * 세션 룰: UI/훅은 이 인터페이스에만 의존하고, 실데이터/목 전환은
 * `adapters/index.ts`의 구현만 교체한다(real ↔ mock).
 *
 * 쓰기(create/update/delete)는 어댑터마다 선택(optional) — mock은 일부만 구현한다.
 */
export interface CalendarDataSource {
  listEvents(range: CalendarDateRange): Promise<CalendarEvent[]>;
  listCategories(): Promise<CalendarCategory[]>;
  createEvent?(input: CalendarEventInput): Promise<CalendarEvent>;
  /**
   * 일정 수정(구글식 하이브리드). 반복 일정이면 `options.scope`(this/following/all)로 적용 범위를 정한다 —
   * this=이 회차(EXDATE+override), following=이후(시리즈 분할), all=전체(마스터 규칙). this/following은
   * `options.occurrenceDate`(회차 날짜)가 필요하다.
   */
  updateEvent?(
    id: string,
    input: CalendarEventInput,
    options?: UpdateEventOptions
  ): Promise<CalendarEvent>;
  /** 일정 삭제. 반복이면 scope(this/following/all) + this/following은 occurrenceDate 필요. 기본 this */
  deleteEvent?(
    id: string,
    scope?: CalendarEventScope,
    occurrenceDate?: string | null
  ): Promise<void>;
  createCategory?(input: CalendarCategoryInput): Promise<CalendarCategory>;
  updateCategory?(
    id: string,
    input: CalendarCategoryInput
  ): Promise<CalendarCategory>;
  deleteCategory?(id: string): Promise<void>;
}
