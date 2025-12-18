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
