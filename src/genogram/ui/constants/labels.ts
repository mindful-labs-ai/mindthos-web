import {
  ConnectionType,
  FetusStatus,
  Gender,
  Illness,
  InfluenceStatus,
  ParentChildStatus,
  PartnerStatus,
  RelationStatus,
  SubjectType,
} from '@/genogram/core/types/enums';

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

// Subject 타입 라벨 (Gender 외)
export const SUBJECT_TYPE_LABELS: Record<string, string> = {
  [SubjectType.Animal]: '반려동물',
};

// 툴바 전용 라벨
export const TOOLBAR_LABELS = {
  FAMILY: '가족',
} as const;

// 태아 상태 라벨
export const FETUS_STATUS_LABELS: Record<string, string> = {
  [FetusStatus.Miscarriage]: '유산',
  [FetusStatus.Abortion]: '낙태',
  [FetusStatus.Pregnancy]: '임신',
};

/** 성별 + 반려동물 통합 드롭다운 아이템 (반려동물은 SubjectType 변경) */
export const GENDER_TYPE_ITEMS = [
  ...Object.entries(GENDER_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
  { value: SubjectType.Animal, label: SUBJECT_TYPE_LABELS[SubjectType.Animal] },
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

// Connection 타입 라벨
export const CONNECTION_TYPE_LABELS: Record<string, string> = {
  [ConnectionType.Partner_Line]: '파트너선',
  [ConnectionType.Relation_Line]: '관계선',
  [ConnectionType.Influence_Line]: '영향선',
  [ConnectionType.Children_Parents_Line]: '부모-자녀선',
  [ConnectionType.Group_Line]: '그룹선',
};

export const CONNECTION_TYPE_ITEMS = Object.entries(CONNECTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

// 파트너 상태 라벨
export const PARTNER_STATUS_LABELS: Record<string, string> = {
  [PartnerStatus.Marriage]: '결혼',
  [PartnerStatus.Marital_Separation]: '별거',
  [PartnerStatus.Divorce]: '이혼',
  [PartnerStatus.Remarriage]: '재결합',
  [PartnerStatus.Couple_Relationship]: '연애',
  [PartnerStatus.Secret_Affair]: '비밀 연애',
};

export const PARTNER_STATUS_ITEMS = Object.entries(PARTNER_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

// 관계 상태 라벨
export const RELATION_STATUS_LABELS: Record<string, string> = {
  [RelationStatus.Connected]: '연결',
  [RelationStatus.Close]: '친밀',
  [RelationStatus.Fused]: '융합',
  [RelationStatus.Distant]: '소원',
  [RelationStatus.Hostile]: '적대',
  [RelationStatus.Close_Hostile]: '친밀-적대',
  [RelationStatus.Cutoff]: '단절됨',
};

export const RELATION_STATUS_ITEMS = Object.entries(RELATION_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

// 영향 상태 라벨
export const INFLUENCE_STATUS_LABELS: Record<string, string> = {
  [InfluenceStatus.Physical_Abuse]: '신체적 학대',
  [InfluenceStatus.Emotional_Abuse]: '정신적 학대',
  [InfluenceStatus.Sexual_Abuse]: '성적 학대',
  [InfluenceStatus.Focused_On]: '집중됨',
  [InfluenceStatus.Focused_On_Negatively]: '부정적 집중됨',
};

export const INFLUENCE_STATUS_ITEMS = Object.entries(
  INFLUENCE_STATUS_LABELS
).map(([value, label]) => ({ value, label }));

// 부모-자녀 상태 라벨
export const PARENT_CHILD_STATUS_LABELS: Record<string, string> = {
  [ParentChildStatus.Biological_Child]: '친자녀',
  [ParentChildStatus.Miscarriage]: '유산',
  [ParentChildStatus.Abortion]: '낙태',
  [ParentChildStatus.Pregnancy]: '임신',
  [ParentChildStatus.Twins]: '쌍둥이',
  [ParentChildStatus.Identical_Twins]: '일란성 쌍둥이',
  [ParentChildStatus.Adopted_Child]: '입양자녀',
  [ParentChildStatus.Foster_Child]: '위탁자녀',
};

export const PARENT_CHILD_STATUS_ITEMS = Object.entries(
  PARENT_CHILD_STATUS_LABELS
).map(([value, label]) => ({ value, label }));

// 선 두께 라벨
export const STROKE_WIDTH_LABELS: Record<string, string> = {
  THIN: '얇음',
  DEFAULT: '기본',
  THICK: '굵음',
};

export const STROKE_WIDTH_ITEMS = Object.entries(STROKE_WIDTH_LABELS).map(
  ([value, label]) => ({ value, label })
);
