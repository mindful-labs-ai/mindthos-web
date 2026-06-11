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
 * 세션 룰: 백엔드 미구현. UI/훅은 이 인터페이스에만 의존하고,
 * 추후 서버가 붙으면 `adapters/index.ts`의 구현만 교체한다(mock → supabase/server).
 *
 * 쓰기(create*)는 후속 Phase. 지금은 선택(optional)으로 둔다.
 */
export interface CalendarDataSource {
  listEvents(range: CalendarDateRange): Promise<CalendarEvent[]>;
  listCategories(): Promise<CalendarCategory[]>;
  createEvent?(input: CalendarEventInput): Promise<CalendarEvent>;
  updateEvent?(id: string, input: CalendarEventInput): Promise<CalendarEvent>;
  createCategory?(input: CalendarCategoryInput): Promise<CalendarCategory>;
}
