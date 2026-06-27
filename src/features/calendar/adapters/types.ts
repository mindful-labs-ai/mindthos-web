import type {
  CalendarCategory,
  CalendarCategoryInput,
  CalendarDateRange,
  CalendarEvent,
  CalendarEventInput,
} from '../types';

/** updateEvent 옵션 */
export interface UpdateEventOptions {
  /** 시간 앵커(startsAt/endsAt/eventTimeKind)를 전송하지 않고 서버 기존값을 유지 */
  preserveAnchor?: boolean;
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
   * 일정 수정. `preserveAnchor`면 시간 앵커(startsAt/endsAt/eventTimeKind)를
   * 전송하지 않아 서버가 마스터 기존값을 유지한다 — 반복 일정의 한 회차를 편집할 때
   * 마스터가 그 회차로 재앵커되어 앞 회차가 사라지는 데이터 손실을 막는다.
   */
  updateEvent?(
    id: string,
    input: CalendarEventInput,
    options?: UpdateEventOptions
  ): Promise<CalendarEvent>;
  deleteEvent?(id: string): Promise<void>;
  /**
   * 반복 일정의 단건(occurrence) 삭제 — 마스터 anchor·기타 필드는 보존하고
   * 예외 날짜(EXDATE) 목록만 부분 PATCH한다. exceptions는 기존 + 신규를 합친 전체 목록.
   */
  updateEventExceptions?(id: string, exceptions: string[]): Promise<void>;
  createCategory?(input: CalendarCategoryInput): Promise<CalendarCategory>;
  updateCategory?(
    id: string,
    input: CalendarCategoryInput
  ): Promise<CalendarCategory>;
  deleteCategory?(id: string): Promise<void>;
}
