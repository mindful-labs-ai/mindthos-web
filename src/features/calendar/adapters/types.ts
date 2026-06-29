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
   * 일정 수정. 반복 일정이면 `options.scope`(this/following/all)로 적용 범위를 정한다 —
   * 회차가 실제 row라 this는 그 회차만, following/이후·all/전체는 시리즈 일괄 적용.
   */
  updateEvent?(
    id: string,
    input: CalendarEventInput,
    options?: UpdateEventOptions
  ): Promise<CalendarEvent>;
  /** 일정 삭제. 반복 일정이면 scope로 적용 범위(this/following/all). 기본 this */
  deleteEvent?(id: string, scope?: CalendarEventScope): Promise<void>;
  createCategory?(input: CalendarCategoryInput): Promise<CalendarCategory>;
  updateCategory?(
    id: string,
    input: CalendarCategoryInput
  ): Promise<CalendarCategory>;
  deleteCategory?(id: string): Promise<void>;
}
