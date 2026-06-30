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
 * 일정 반복 규칙 — 생성 시에만 사용하는 입력(서버는 이 규칙으로 회차 row를 materialize). 저장 후에는
 * 규칙을 보관하지 않으므로 GET 응답엔 없다(반복 여부는 CalendarEvent.seriesId로 판별).
 * 격주는 별도 cycle 없이 { cycle: 'weekly', interval: 2 }로 표현한다. 종료조건(count·until)은 필수.
 */
export interface CalendarRepeatRule {
  cycle: CalendarRepeatCycle;
  /** 간격(N주기마다). 매주=1, 격주=2. 기본 1 */
  interval: number;
  /** 반복 횟수(시작 포함 n회). null = 종료일로만 제한 */
  count: number | null;
  /** 반복 종료일(YYYY-MM-DD, inclusive). null = 횟수로만 제한 */
  until: string | null;
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

/** 반복 일정 수정/삭제 적용 범위. this=이 회차 / following=이후 / all=전체 */
export type CalendarEventScope = 'this' | 'following' | 'all';

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
  /**
   * 반복(시리즈) 묶음 id. null/없음 = 단일 일정. 같은 값 = 한 반복의 회차들.
   * 반복 여부·편집/삭제 scope 노출은 이 값으로 판단한다.
   */
  seriesId?: string | null;
  /**
   * 이 행이 차지하는 회차 날짜(YYYY-MM-DD, UTC). 마스터 인스턴스=그 회차, override=대체 회차, 단일=없음.
   * "이 회차/이후" scope 수정·삭제 시 서버로 보내는 키.
   */
  occurrenceDate?: string | null;
  /**
   * 반복 규칙(마스터 인스턴스만 — 편집 시 규칙 표시/수정용). override/단일은 없음.
   * scope=all/following 수정에 사용. seriesId로 반복 여부를 판단하므로 표시는 seriesId 우선.
   */
  repeat?: CalendarRepeatRule | null;
  /** 임시 미리보기(작성 중) 더미 일정 — 저장 전 어디에 추가될지 표시용. 비클릭. */
  isDraft?: boolean;
}

/** '나의 캘린더' 카테고리 — 색 없음(표시 on/off 그룹핑 전용). 색은 일정 단위로 보관. */
export interface CalendarCategory {
  id: string;
  name: string;
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
  /** 표시 색상 — 기본은 kind 기본색, 사용자가 색상 선택기로 변경 가능 */
  colorKey: CalendarColorKey;
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

/** 카테고리 생성 입력 (후속 Phase) — 색 없음(이름만). */
export interface CalendarCategoryInput {
  name: string;
}
