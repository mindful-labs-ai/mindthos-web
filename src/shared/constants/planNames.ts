/**
 * 플랜 타입 → 한글 표시명 매핑.
 *
 * 중복 정의되어 있던 `getPlanDisplayName` 을 단일 출처로 통합.
 * 사용처: CancelSubscriptionModal, DowngradeConfirmModal, UpgradeConfirmModal, PaymentResultModal 등.
 */

const PLAN_DISPLAY_NAME: Record<string, string> = {
  Free: '무료',
  Starter: '스타터',
  Plus: '플러스',
  Pro: '프로',
  스타터: '스타터',
  플러스: '플러스',
  프로: '프로',
};

/**
 * 영문 플랜 타입(`Free`·`Plus` 등)을 한글 표시명으로 변환.
 * 매핑이 없으면 입력값을 그대로 반환한다.
 */
export const getPlanDisplayName = (type: string): string =>
  PLAN_DISPLAY_NAME[type] ?? type;
