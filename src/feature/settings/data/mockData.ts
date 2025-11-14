import { type SettingsData } from '../types';

export const freePlan = {
  type: 'FREE',
  description: '무료 플랜',
  price: 0,
  audio_credit: 60,
  summary_credit: 15,
};

export const plusPlan = {
  type: 'PLUS',
  description: `마음토스의 기본 유료 플랜입니다.\n효율적으로 축어록을 쓰시는 분들에게\n가장 합리적인 플랜입니다.`,
  price: 29900,
  audio_credit: 2000,
  summary_credit: 200,
};

export const proPlan = {
  type: 'PRO',
  description: `플러스 플랜 사용량이 부족하다면,\n상담량이 많은 상담사 분들을 위한\n대용량 프로 플랜입니다.`,
  price: 59900,
  audio_credit: 5000,
  summary_credit: 1000,
};

export const yearPlusPlan = {
  type: 'PLUS_YEAR',
  description: `마음토스의 기본 유료 플랜입니다.\n효율적으로 축어록을 쓰시는 분들에게\n가장 합리적인 플랜입니다.`,
  price: 274000,
  audio_credit: 2000,
  summary_credit: 200,
};

export const yearProPlan = {
  type: 'PRO_YEAR',
  description: `플러스 플랜 사용량이 부족하다면,\n상담량이 많은 상담사 분들을 위한\n대용량 프로 플랜입니다.`,
  price: 430000,
  audio_credit: 5000,
  summary_credit: 1000,
};

export const mockSettingsData: SettingsData = {
  counselor: {
    name: '김경민',
    email: 'gyeongmin.kim@mindfullabs.ai',
    organization: '개인상담사',
  },
  plan: freePlan,
  usage: {
    voice_transcription: {
      credit: 25,
    },
    summary_generation: {
      credit: 0,
    },
  },
};
