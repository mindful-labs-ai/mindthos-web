import type { SelectItem } from '@/components/ui/composites/Select';

// 성별 옵션
export const GENDER_OPTIONS: SelectItem[] = [
  { value: 'Male', label: '남성' },
  { value: 'Female', label: '여성' },
  { value: 'Gay', label: '게이' },
  { value: 'Lesbian', label: '레즈비언' },
  { value: 'Transgender_Male', label: '트랜스젠더 남성' },
  { value: 'Transgender_Female', label: '트랜스젠더 여성' },
  { value: 'Nonbinary', label: '논바이너리' },
];

export const GENDER_LABELS: Record<string, string> = {
  Male: '남성',
  Female: '여성',
  Gay: '게이',
  Lesbian: '레즈비언',
  Transgender_Male: '트랜스젠더 남성',
  Transgender_Female: '트랜스젠더 여성',
  Nonbinary: '논바이너리',
};

// 상태 (illness) 옵션
export const ILLNESS_OPTIONS: SelectItem[] = [
  { value: 'None', label: '없음' },
  { value: 'Psychological_Or_Physical_Problem', label: '심리적/신체적 문제' },
  { value: 'Alcohol_Or_Drug_Abuse', label: '알코올/약물 남용' },
  { value: 'Suspected_Alcohol_Or_Drug_Abuse', label: '알코올/약물 남용 의심' },
  {
    value: 'Psychological_Or_Physical_Illness_In_Remission',
    label: '질병 관해',
  },
  { value: 'In_Recovery_From_Substance_Abuse', label: '물질 남용 회복 중' },
  {
    value: 'Serious_Mental_Or_Physical_Problems_And_Substance_Abuse',
    label: '심각한 문제 + 물질 남용',
  },
];

export const ILLNESS_LABELS: Record<string, string> = {
  None: '없음',
  Psychological_Or_Physical_Problem: '심리적/신체적 문제',
  Alcohol_Or_Drug_Abuse: '알코올/약물 남용',
  Suspected_Alcohol_Or_Drug_Abuse: '알코올/약물 남용 의심',
  Psychological_Or_Physical_Illness_In_Remission: '질병 관해',
  In_Recovery_From_Substance_Abuse_But_Having_Physical_Or_Mental_Problems:
    '물질 남용 회복 + 문제',
  In_Recovery_From_Substance_Abuse: '물질 남용 회복 중',
  Serious_Mental_Or_Physical_Problems_And_Substance_Abuse:
    '심각한 문제 + 물질 남용',
  In_Recovery_From_Substance_Abuse_And_Physical_Or_Mental_Problems:
    '물질 남용 회복 + 문제',
};

// 관계 타입 라벨
export const RELATION_TYPE_LABELS: Record<string, string> = {
  spouse: '배우자',
  parent: '부모',
  child: '자녀',
  sibling: '형제자매',
};

// Influence 유형 옵션
export const INFLUENCE_OPTIONS: SelectItem[] = [
  { value: 'physical_abuse', label: '신체적 학대' },
  { value: 'emotional_abuse', label: '정서적 학대' },
  { value: 'sexual_abuse', label: '성적 학대' },
  { value: 'focused_on', label: '과잉관심' },
  { value: 'focused_on_negatively', label: '부정적 과잉관심' },
];

export const INFLUENCE_LABELS: Record<string, string> = {
  physical_abuse: '신체적 학대',
  emotional_abuse: '정서적 학대',
  sexual_abuse: '성적 학대',
  focused_on: '과잉관심',
  focused_on_negatively: '부정적 과잉관심',
};
