const PLAN_LABELS: Record<string, string> = {
  free: '무료 플랜',
  starter: '스타터 플랜',
  plus: '플러스 플랜',
  'plus (event)': '플러스 플랜 (이벤트)',
  pro: '프로 플랜',
  plus_year: '플러스 연간 플랜',
  pro_year: '프로 연간 플랜',
};

export const getPlanLabel = (planType: string): string => {
  return PLAN_LABELS[planType.toLowerCase()] || planType;
};

/**
 * 플랜 등급 (tier) 매핑
 * free(0) < starter(1) < plus(2) < pro(3)
 * 연간 플랜은 동일 등급으로 취급
 */
const PLAN_TIER: Record<string, number> = {
  free: 0,
  starter: 1,
  plus: 2,
  plus_year: 2,
  'plus (event)': 2,
  pro: 3,
  pro_year: 3,
};

export const getPlanTier = (planType: string | undefined): number => {
  if (!planType) return 0;
  return PLAN_TIER[planType.toLowerCase()] ?? 0;
};

/**
 * 특정 플랜 등급 이상인지 확인
 * @example isAtLeast(userPlan, 'plus') // plus, plus_year, pro, pro_year → true
 */
export const isAtLeast = (
  planType: string | undefined,
  minPlan: string
): boolean => {
  return getPlanTier(planType) >= getPlanTier(minPlan);
};

/**
 * 프로 플랜 여부 확인 (pro, pro_year)
 */
export const isProPlan = (planType: string | undefined): boolean => {
  return getPlanTier(planType) >= getPlanTier('pro');
};

/**
 * 플러스 플랜 이상 여부 확인 (plus, plus_year, pro, pro_year)
 */
export const isPlusOrAbove = (planType: string | undefined): boolean => {
  return isAtLeast(planType, 'plus');
};

/**
 * 무료 플랜 여부 확인
 */
export const isFreePlan = (planType: string | undefined): boolean => {
  return getPlanTier(planType) === 0;
};

/**
 * 유료 플랜 여부 확인 (free가 아닌 모든 플랜)
 */
export const isPaidPlan = (planType: string | undefined): boolean => {
  return getPlanTier(planType) > 0;
};

export const calculateDaysUntilReset = (
  resetAt: string | null
): number | undefined => {
  if (!resetAt) return undefined;

  const now = new Date();
  const reset = new Date(resetAt);
  const diffTime = reset.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};

export const formatRenewalDate = (endAt: string | null): string => {
  if (!endAt) return '';

  const date = new Date(endAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}.${month}.${day}`;
};

/** ISO 날짜 → "2026년 3월 23일까지 이용" */
export const formatUsageDate = (dateStr: string | null): string => {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일까지 이용`;
};
