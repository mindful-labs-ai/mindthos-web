const PLAN_LABELS: Record<string, string> = {
  free: '무료 플랜',
  plus: '플러스 플랜',
  pro: '프로 플랜',
  plus_year: '플러스 연간 플랜',
  pro_year: '프로 연간 플랜',
};

export const getPlanLabel = (planType: string): string => {
  return PLAN_LABELS[planType.toLowerCase()] || planType;
};

/**
 * 프로 플랜 여부 확인 (pro, pro_year)
 */
export const isProPlan = (planType: string | undefined): boolean => {
  if (!planType) return false;
  const type = planType.toLowerCase();
  return type === 'pro' || type === 'pro_year';
};

/**
 * 플러스 플랜 이상 여부 확인 (plus, plus_year, pro, pro_year)
 */
export const isPlusOrAbove = (planType: string | undefined): boolean => {
  if (!planType) return false;
  const type = planType.toLowerCase();
  return (
    type === 'plus' ||
    type === 'plus_year' ||
    type === 'pro' ||
    type === 'pro_year'
  );
};

/**
 * 무료 플랜 여부 확인
 */
export const isFreePlan = (planType: string | undefined): boolean => {
  if (!planType) return true;
  return planType.toLowerCase() === 'free';
};

/**
 * 유료 플랜 여부 확인 (free가 아닌 모든 플랜)
 */
export const isPaidPlan = (planType: string | undefined): boolean => {
  return !isFreePlan(planType);
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
