import type { CalendarEvent } from '../../types';

/**
 * 외부 캘린더 마이그레이션 어댑터 경계.
 *
 * 세션 룰: 구글/네이버/애플 등 provider별 인증·데이터 포맷이 다르므로
 * provider마다 별도 어댑터로 추상화한다. 새 provider 추가 = 어댑터 추가.
 * 현재는 스텁(미구현). 후속 Phase에서 실제 연동.
 */
export type CalendarProvider = 'google' | 'naver' | 'apple';

export interface CalendarImportAdapter {
  readonly provider: CalendarProvider;
  /** OAuth 등 연결 시작 */
  connect(): Promise<void>;
  /** 연결된 외부 캘린더의 일정을 우리 도메인 타입으로 가져오기 */
  importEvents(): Promise<CalendarEvent[]>;
}
