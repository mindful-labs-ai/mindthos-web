import { PlanInfo } from '@/feature/settings/types';

export const FREE_PLAN: PlanInfo = {
  type: 'FREE',
  description: '무료 플랜',
  price: 0,
  audio_credit: 60,
  summary_credit: 15,
};

export const PLUS_PLAN: PlanInfo = {
  type: 'PLUS',
  description: `마음토스의 기본 유료 플랜입니다.\n효율적으로 축어록을 쓰시는 분들에게\n가장 합리적인 플랜입니다.`,
  price: 29900,
  audio_credit: 2000,
  summary_credit: 200,
};

export const PRO_PLAN: PlanInfo = {
  type: 'PRO',
  description: `플러스 플랜 사용량이 부족하다면,\n상담량이 많은 상담사 분들을 위한\n대용량 프로 플랜입니다.`,
  price: 59900,
  audio_credit: 5000,
  summary_credit: 1000,
};

export const YEAR_PLUS_PLAN: PlanInfo = {
  type: 'PLUS_YEAR',
  description: `마음토스의 기본 유료 플랜입니다.\n효율적으로 축어록을 쓰시는 분들에게\n가장 합리적인 플랜입니다.`,
  price: 274000,
  audio_credit: 2000,
  summary_credit: 200,
};

export const YEAR_PRO_PLAN: PlanInfo = {
  type: 'PRO_YEAR',
  description: `플러스 플랜 사용량이 부족하다면,\n상담량이 많은 상담사 분들을 위한\n대용량 프로 플랜입니다.`,
  price: 430000,
  audio_credit: 5000,
  summary_credit: 1000,
};

export const PLANS = {
  FREE: FREE_PLAN,
  PLUS: PLUS_PLAN,
  PRO: PRO_PLAN,
  YEAR_PLUS: YEAR_PLUS_PLAN,
  YEAR_PRO: YEAR_PRO_PLAN,
} as const;
