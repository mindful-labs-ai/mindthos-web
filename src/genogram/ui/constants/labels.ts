import { ClinicStatus, Gender, SubjectType } from '@/genogram/core/types/enums';

// 성별 라벨
export const GENDER_LABELS: Record<string, string> = {
  [Gender.Male]: '남성',
  [Gender.Female]: '여성',
  [Gender.Gay]: '게이',
  [Gender.Lesbian]: '레즈비언',
  [Gender.TransMale]: '트랜스남성',
  [Gender.TransFemale]: '트랜스여성',
  [Gender.NonBinary]: '논바이너리',
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
  [ClinicStatus.None]: '해당 없음',
  [ClinicStatus.PsychPhysicalProblem]: '심리/신체 문제',
  [ClinicStatus.SubstanceAbuse]: '약물 남용',
  [ClinicStatus.SuspectedSubstanceAbuse]: '약물 남용 의심',
  [ClinicStatus.RemissionPsychPhysical]: '심리/신체 완화',
  [ClinicStatus.SubstanceRemissionWithProblem]: '약물 완화 (문제 동반)',
  [ClinicStatus.RecoveringSubstanceAbuse]: '약물 남용 회복 중',
  [ClinicStatus.SevereMultipleProblems]: '심각한 복합 문제',
  [ClinicStatus.RecoveringMultipleProblems]: '복합 문제 회복 중',
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
