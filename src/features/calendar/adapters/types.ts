import type {
  CalendarCategory,
  CalendarCategoryInput,
  CalendarDateRange,
  CalendarEvent,
  CalendarEventInput,
} from '../types';

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
  updateEvent?(id: string, input: CalendarEventInput): Promise<CalendarEvent>;
  deleteEvent?(id: string): Promise<void>;
  createCategory?(input: CalendarCategoryInput): Promise<CalendarCategory>;
  updateCategory?(
    id: string,
    input: CalendarCategoryInput
  ): Promise<CalendarCategory>;
  deleteCategory?(id: string): Promise<void>;
}
