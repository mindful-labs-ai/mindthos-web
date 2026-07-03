/**
 * 외부 캘린더 마이그레이션(import) 어댑터 경계.
 *
 * 서버 매개 OAuth 플로우:
 *  1. authorize(provider) → 서버가 동의 URL + 서명 state 발급 → 브라우저를 동의 URL로 리다이렉트.
 *  2. provider가 우리 콜백 페이지로 ?code=&state= 리다이렉트.
 *  3. 콜백 페이지가 finalize(provider, { code, state }) 호출 → 서버가 토큰 교환 + import.
 *
 * 새 provider 추가 = enabled에 추가. apple은 서버 501 예약(비활성).
 */
export type CalendarProvider = 'google' | 'naver' | 'apple';

/**
 * authorize 시 보관해 둔 provider를 콜백 페이지가 읽기 위한 sessionStorage 키.
 * (provider 콜백 URL에 provider가 안 실릴 수 있어 프론트에서 브릿지)
 */
export const IMPORT_PROVIDER_KEY = 'calendar.import.provider';

/** provider 콜백에서 받은 인가 코드 + 서명 state */
export interface CalendarImportFinalizeInput {
  code: string;
  state: string;
}

/** finalize 결과 — 서버가 만든/갱신한 연동 카테고리 */
export interface CalendarImportResult {
  categoryId: string;
  categoryName: string;
}

export interface CalendarImportAdapter {
  /** import 가능 provider (apple=false: 서버 501 예약) */
  isEnabled(provider: CalendarProvider): boolean;
  /** OAuth 1단계: 동의 URL로 브라우저 리다이렉트(이 함수는 반환하지 않음 — location 변경) */
  authorize(provider: CalendarProvider): Promise<void>;
  /** OAuth 2단계: 콜백에서 받은 code/state로 import 마무리 */
  finalize(
    provider: CalendarProvider,
    input: CalendarImportFinalizeInput
  ): Promise<CalendarImportResult>;
}
