/**
 * 코호트 질문 화면 계약.
 * 화면의 선택 순서와 서버에 저장할 중앙 값을 한 곳에서 관리한다.
 */
export const COHORT_SURVEY_OPTIONS = {
  clientType: [
    { choice: 1, value: 'ADULT', label: '일반 성인' },
    { choice: 2, value: 'COUPLE_FAMILY', label: '부부·가족' },
    { choice: 3, value: 'CHILD_YOUTH', label: '아동·청소년' },
    { choice: 4, value: 'MIDDLE_OLDER', label: '중장년·노인' },
  ],
  therapyTheory: [
    {
      choice: 1,
      value: 'CBT',
      label: '인지행동 기반(CBT/ACT/DBT/심리도식 등)',
    },
    { choice: 2, value: 'PSYCHODYNAMIC', label: '정신역동·대상관계' },
    {
      choice: 3,
      value: 'HUMANISTIC',
      label: '인본·경험(인간중심/정서중심/게슈탈트 등)',
    },
    {
      choice: 4,
      value: 'FAMILY_SYSTEMIC',
      label: '가족·체계(보웬/미누친/사티어 등)',
    },
    { choice: 5, value: 'OTHER', label: '그 외' },
  ],
  hasRecord: [
    { choice: 1, value: 'TRUE', label: '있다' },
    { choice: 2, value: 'FALSE', label: '없다' },
  ],
} as const;

export type CohortSurveyChoices = {
  clientType: number;
  therapyTheory: number;
  hasRecord: number;
};

export interface CohortSurveyPayload {
  client_type: 'ADULT' | 'COUPLE_FAMILY' | 'CHILD_YOUTH' | 'MIDDLE_OLDER';
  therapy_theory:
    | 'CBT'
    | 'PSYCHODYNAMIC'
    | 'HUMANISTIC'
    | 'FAMILY_SYSTEMIC'
    | 'OTHER';
  has_record: 'TRUE' | 'FALSE';
}

function adaptChoice<T extends string>(
  choice: number,
  options: readonly { choice: number; value: T }[],
  question: string
): T {
  const option = options.find((item) => item.choice === choice);
  if (!option) {
    throw new Error(`${question} 선택지가 올바르지 않습니다.`);
  }
  return option.value;
}

/** 선택지 번호를 API 중앙 값으로 변환한다. 번호는 서버에 저장하지 않는다. */
export function adaptCohortSurveyChoices(
  choices: CohortSurveyChoices
): CohortSurveyPayload {
  return {
    client_type: adaptChoice(
      choices.clientType,
      COHORT_SURVEY_OPTIONS.clientType,
      'Q1'
    ),
    therapy_theory: adaptChoice(
      choices.therapyTheory,
      COHORT_SURVEY_OPTIONS.therapyTheory,
      'Q2'
    ),
    has_record: adaptChoice(
      choices.hasRecord,
      COHORT_SURVEY_OPTIONS.hasRecord,
      'Q3'
    ),
  };
}
