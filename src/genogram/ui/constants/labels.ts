import { ClinicStatus, Gender, SubjectType } from '@/genogram/core/types/enums';

// 성별 라벨
export const GENDER_LABELS: Record<string, string> = {
  [Gender.남성]: '남성',
  [Gender.여성]: '여성',
  [Gender.게이]: '게이',
  [Gender.레즈비언]: '레즈비언',
  [Gender.트랜스젠더_남성]: '트랜스젠더 남성',
  [Gender.트랜스젠더_여성]: '트랜스젠더 여성',
  [Gender.논바이너리]: '논바이너리',
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

// 임상 상태 라벨
export const CLINIC_STATUS_LABELS: Record<string, string> = {
  [ClinicStatus.없음]: '해당 없음',
  [ClinicStatus.심리적_신체적_문제]: '심리적 / 신체적 문제',
  [ClinicStatus.알코올_약물_남용]: '알코올 / 약물 남용',
  [ClinicStatus.알코올_약물_남용_의심]: '알코올 / 약물 남용 의심',
  [ClinicStatus.완화된_심리적_신체적_문제]: '완화된 심리적 / 신체적 문제',
  [ClinicStatus.완화된_알코올_약물_문제와_심리적_신체적_문제]:
    '완화된 알코올 / 약물 문제와 심리적 / 신체적 문제',
  [ClinicStatus.알코올_약물_문제_회복_중]: '알코올 / 약물 문제 회복 중',
  [ClinicStatus.심각한_심리적_신체적_질환과_심각한_알코올_약물_문제]:
    '심각한 심리적 / 신체적 질환과 심각한 알코올 / 약물 문제',
  [ClinicStatus.심리적_신체적_질환과_심각한_알코올_약물_문제_회복_중]:
    '심리적 / 신체적 질환과 심각한 알코올 / 약물 문제에서 회복 중',
};

export const CLINIC_STATUS_ITEMS = Object.entries(CLINIC_STATUS_LABELS).map(
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
