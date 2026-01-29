import { Gender, Illness, SubjectType } from '@/genogram/core/types/enums';

// 성별 라벨
export const GENDER_LABELS: Record<string, string> = {
  [Gender.Male]: '남성',
  [Gender.Female]: '여성',
  [Gender.Gay]: '게이',
  [Gender.Lesbian]: '레즈비언',
  [Gender.Transgender_Male]: '트랜스젠더 남성',
  [Gender.Transgender_Female]: '트랜스젠더 여성',
  [Gender.Nonbinary]: '논바이너리',
};

/** 성별 + 반려동물 통합 드롭다운 아이템 (반려동물은 SubjectType 변경) */
export const GENDER_TYPE_ITEMS = [
  ...Object.entries(GENDER_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
  { value: SubjectType.Animal, label: '반려동물' },
];

export const GENDER_ITEMS = Object.entries(GENDER_LABELS).map(
  ([value, label]) => ({ value, label })
);

// 질환 상태 라벨
export const ILLNESS_LABELS: Record<string, string> = {
  [Illness.None]: '해당 없음',
  [Illness.Psychological_Or_Physical_Problem]: '심리적 / 신체적 문제',
  [Illness.Alcohol_Or_Drug_Abuse]: '알코올 / 약물 남용',
  [Illness.Suspected_Alcohol_Or_Drug_Abuse]: '알코올 / 약물 남용 의심',
  [Illness.Psychological_Or_Physical_Illness_In_Remission]:
    '완화된 심리적 / 신체적 문제',
  [Illness.In_Recovery_From_Substance_Abuse_But_Having_Physical_Or_Mental_Problems]:
    '완화된 알코올 / 약물 문제와 심리적 / 신체적 문제',
  [Illness.In_Recovery_From_Substance_Abuse]: '알코올 / 약물 문제 회복 중',
  [Illness.Serious_Mental_Or_Physical_Problems_And_Substance_Abuse]:
    '심각한 심리적 / 신체적 질환과 심각한 알코올 / 약물 문제',
  [Illness.In_Recovery_From_Substance_Abuse_And_Physical_Or_Mental_Problems]:
    '심리적 / 신체적 질환과 심각한 알코올 / 약물 문제에서 회복 중',
};

export const ILLNESS_ITEMS = Object.entries(ILLNESS_LABELS).map(
  ([value, label]) => ({ value, label })
);

// 도형 크기 라벨
export const NODE_SIZE_LABELS: Record<string, string> = {
  SMALL: '작음',
  DEFAULT: '기본',
  LARGE: '큼',
};

export const NODE_SIZE_ITEMS = Object.entries(NODE_SIZE_LABELS).map(
  ([value, label]) => ({ value, label })
);
