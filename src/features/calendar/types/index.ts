/**
 * 캘린더(일정) 도메인 타입
 *
 * 백엔드 미구현 단계. 이 타입들은 어댑터(CalendarDataSource) 경계의 계약이며,
 * 추후 서버 스키마가 확정되면 어댑터 구현만 교체한다. (UI는 이 타입에만 의존)
 */

/** 일정 종류 — '일정 표시' 토글(국가공휴일/상담/개인)의 필터 단위 */
export type CalendarEventKind = 'counseling' | 'personal' | 'holiday';

/** 일정 시간 종류 (서버 eventTimeKind와 1:1). ALL_DAY = 종일(공휴일 등), TIMED = 시간 지정 */
export type CalendarEventTimeKind = 'TIMED' | 'ALL_DAY';

/** 상담 방식 (서버 IN_PERSON/ONLINE과 1:1). null = 선택 안 함. 상담 일정에서만 유효 */
export type CounselMethod = 'in_person' | 'online';

/** 일정 반복 주기 (서버 enum과 1:1; 격주는 weekly + interval 2로 표현) */
export type CalendarRepeatCycle = 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * 일정 반복 규칙 (없으면 단일 일정). 서버 calendar_event의 repeat_* 컬럼과 매핑된다.
 * 격주는 별도 cycle 없이 { cycle: 'weekly', interval: 2 }로 표현한다.
 */
export interface CalendarRepeatRule {
  cycle: CalendarRepeatCycle;
  /** 간격(N주기마다). 매주=1, 격주=2. 기본 1 */
  interval: number;
  /** 반복 횟수(시작 포함 n회). null = 횟수 제한 없음 */
  count: number | null;
  /** 반복 종료일(YYYY-MM-DD, inclusive). null = 종료일 없음 */
  until: string | null;
  /** 예외 날짜(YYYY-MM-DD). 단일 인스턴스 삭제 시 채워짐(후속). null = 없음 */
  exceptions: string[] | null;
}

/** 일정 칩/블록의 표시 색상 키 (카테고리 색 팔레트) */
export type CalendarColorKey =
  | 'green'
  | 'red'
  | 'blue'
  | 'grey'
  | 'orange'
  | 'yellow'
  | 'purple'
  | 'pink';

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
  /** 시간 종류 (ALL_DAY = 종일/공휴일 등, TIMED = 시간 지정) */
  eventTimeKind?: CalendarEventTimeKind;
  /** '나의 캘린더' 카테고리 id (선택) */
  categoryId?: string;
  /** 상담 일정 대상 내담자 id (상담 일정에서만) */
  clientId?: string | null;
  /** 상담 방식 (상담 일정에서만). null/없음 = 선택 안 함 */
  counselMethod?: CounselMethod | null;
  /** 반복 규칙 (없으면 단일 일정). GET 인스턴스는 마스터 규칙을 그대로 싣는다 */
  repeat?: CalendarRepeatRule | null;
}

/** '나의 캘린더' 카테고리 */
export interface CalendarCategory {
  id: string;
  name: string;
  colorKey: CalendarColorKey;
  /** 외부 연동 출처(구글/네이버/애플). null/없음 = 마음토스 자체 카테고리 */
  sourceProvider?: 'google' | 'naver' | 'apple' | null;
}

/** 일정 생성 입력 (후속 Phase에서 사용) */
export interface CalendarEventInput {
  title: string;
  kind: CalendarEventKind;
  colorKey: CalendarColorKey;
  start: string;
  end?: string;
  eventTimeKind?: CalendarEventTimeKind;
  categoryId?: string;
  /** 상담 일정 대상 내담자 id (상담 일정에서만) */
  clientId?: string | null;
  /** 상담 방식 (상담 일정에서만). null = 선택 안 함 */
  counselMethod?: CounselMethod | null;
  /** 반복 규칙 (없으면 단일 일정) */
  repeat?: CalendarRepeatRule | null;
}

/** 일정 추가/편집 패널의 입력 draft — 패널이 onSubmit으로 넘기는 폼 값. */
export interface AddEventDraft {
  kind: CalendarEventKind;
  title: string;
  /** 시간 종류 — ALL_DAY면 시간 대신 그 날 전체. */
  eventTimeKind: CalendarEventTimeKind;
  startTime: string;
  endTime: string;
  /** 상담 일정 대상 내담자 id (상담 일정에서만, 개인은 null) */
  clientId: string | null;
  /** 상담 방식 (상담 일정에서만, 개인은 null) */
  counselMethod: CounselMethod | null;
  /** '나의 캘린더' 카테고리 id (개인 일정에서만, 상담은 null) */
  categoryId: string | null;
  /** 반복 규칙 (없으면 단일 일정) */
  repeat: CalendarRepeatRule | null;
}

/** 카테고리 생성 입력 (후속 Phase) */
export interface CalendarCategoryInput {
  name: string;
  colorKey: CalendarColorKey;
}
