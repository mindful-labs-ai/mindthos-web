/**
 * 튜토리얼 분기 키
 *
 * Tutorial·CRM에서 사용하는 도메인 분기 값.
 * 랜딩에서 전달하는 cohort query 값과 내부 계약을 동일하게 유지한다.
 */
export const COHORT_BRANCH = {
  GENOGRAM: 'GENOGRAM',
  CBT: 'CBT',
  PSYCHODYNAMIC: 'PSYCHODYNAMIC',
  HUMANISTIC: 'HUMANISTIC',
  GENERIC: 'GENERIC',
} as const;

export type CohortBranch = (typeof COHORT_BRANCH)[keyof typeof COHORT_BRANCH];

/**
 * landing의 cohort query를 튜토리얼 분기로 변환한다.
 * 알 수 없는 값은 임의의 분기로 보내지 않고 null을 반환한다.
 */
export function resolveCohortBranch(
  search: string | URLSearchParams
): CohortBranch | null {
  const params =
    typeof search === 'string' ? new URLSearchParams(search) : search;
  const value = params.get('cohort');

  return Object.values(COHORT_BRANCH).includes(value as CohortBranch)
    ? (value as CohortBranch)
    : null;
}
