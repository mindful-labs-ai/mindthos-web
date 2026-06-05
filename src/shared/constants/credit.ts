/**
 * 기능별 크레딧 비용 중앙 정의.
 *
 * 화면 표기(크레딧 칩·안내 문구)와 사전 크레딧 가드(useCreditGuard) 양쪽이 이 값을
 * 참조한다. 비용 정책이 바뀌면 이 파일만 고치면 전 기능에 일관되게 반영된다.
 *
 * ⚠️ 실제 차감은 백엔드(edge function / 서버)에서 일어난다. 여기 값은 "사전 가드 +
 *    화면 표기"용이므로 백엔드 정책과 항상 동일하게 유지해야 한다.
 */
export const CREDIT_COST = {
  /** 심리검사 결과지 분석 시작(등록 → 분석) */
  PSYCH_ANALYSIS: 50,
  /** 심리검사 해석 채팅 1회(첫 질문·답변 재생성 포함) */
  PSYCH_CHAT: 5,
  /** 내담자 다회기 분석 */
  CLIENT_ANALYSIS: 50,
  /**
   * 상담노트(progress note) 생성·재생성 비용.
   * 단, 세션 자동 생성 시 노트와 "첫 재생성"은 무료(0) — 정책상 의도된 분기다.
   *   - 세션 자동 생성 포함 노트: SESSION_CREATE_NOTE_CREDIT(=0)
   *   - 첫 재생성 무료: 호출부의 isFirstRegenerate 분기로 0 처리(이 상수는 이후 재생성 비용)
   */
  PROGRESS_NOTE: 10,
  /** 직접 입력(수기) 세션 생성 */
  HANDWRITTEN_SESSION: 30,
  /** 축어록 비식별화 */
  DEIDENTIFICATION: 20,
  /** 가계도 생성 */
  GENOGRAM: 50,
  /** 가계도 분석 보고서 생성 */
  GENOGRAM_REPORT: 100,
} as const;

export type CreditCostKey = keyof typeof CREDIT_COST;

/**
 * STT(음성 전사) 크레딧 계산 파라미터.
 * 계산식은 features/session/utils/creditCalculator.ts 의 calculateSTTCredit 참고.
 *  - basic:    max(분, MIN_MINUTES)
 *  - advanced: max(floor(분 * ADVANCED_MULTIPLIER), floor(MIN_MINUTES * ADVANCED_MULTIPLIER))
 */
export const STT_CREDIT = {
  /** 최소 과금 시간(분). 이 시간 이하 녹음은 동일한 최소 요금. */
  MIN_MINUTES: 30,
  /** advanced 등급 분당 가중치 */
  ADVANCED_MULTIPLIER: 1.5,
} as const;

/**
 * 세션 자동 생성 흐름의 총 비용 계산에 포함되는 상담노트 크레딧.
 * 정책상 세션 자동 생성 시 노트는 무료라 0이다(의도된 값).
 * 단독 상담노트 생성·재생성 비용은 CREDIT_COST.PROGRESS_NOTE(=10)로 다른 것이 정상이다.
 */
export const SESSION_CREATE_NOTE_CREDIT = 0;
