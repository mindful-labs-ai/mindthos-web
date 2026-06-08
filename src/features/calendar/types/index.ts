/**
 * 캘린더(일정) 도메인 타입
 *
 * 백엔드 미구현 단계. 이 타입들은 어댑터(CalendarDataSource) 경계의 계약이며,
 * 추후 서버 스키마가 확정되면 어댑터 구현만 교체한다. (UI는 이 타입에만 의존)
 */

/** 일정 종류 — '일정 표시' 토글(국가공휴일/상담/개인)의 필터 단위 */
export type CalendarEventKind = 'counseling' | 'personal' | 'holiday';

/** 일정 칩/블록의 표시 색상 키 (Figma 색상 체계) */
export type CalendarColorKey = 'green' | 'red' | 'blue' | 'grey';

/** 보기 모드 */
export type CalendarViewMode = 'month' | 'week';

/** ISO 문자열 기반 기간 (어댑터 조회 범위) */
export interface CalendarDateRange {
  /** 포함 시작 (ISO) */
  start: string;
  /** 포함 종료 (ISO) */
  end: string;
}

/** 일정 단건 */
export interface CalendarEvent {
  id: string;
  title: string;
  kind: CalendarEventKind;
  /** 표시 색상 — 보통 kind/카테고리에서 파생되지만 Figma 충실성을 위해 명시 */
  colorKey: CalendarColorKey;
  /** 시작 시각 (ISO datetime) */
  start: string;
  /** 종료 시각 (ISO datetime, 선택) */
  end?: string;
  /** 종일 일정 여부 (공휴일 등) */
  allDay?: boolean;
  /** '나의 캘린더' 카테고리 id (선택) */
  categoryId?: string;
}

/** '나의 캘린더' 카테고리 */
export interface CalendarCategory {
  id: string;
  name: string;
  colorKey: CalendarColorKey;
}

/** 일정 생성 입력 (후속 Phase에서 사용) */
export interface CalendarEventInput {
  title: string;
  kind: CalendarEventKind;
  colorKey: CalendarColorKey;
  start: string;
  end?: string;
  allDay?: boolean;
  categoryId?: string;
}

/** 카테고리 생성 입력 (후속 Phase) */
export interface CalendarCategoryInput {
  name: string;
  colorKey: CalendarColorKey;
}
