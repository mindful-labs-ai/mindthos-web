import { describe, expect, it } from 'vitest';

import {
  adaptCohortSurveyChoices,
  COHORT_SURVEY_OPTIONS,
} from './cohortSurvey';

describe('cohortSurvey', () => {
  it('화면 선택지 순서를 서버 중앙 값으로 변환한다', () => {
    expect(
      adaptCohortSurveyChoices({
        clientType: 1,
        therapyTheory: 2,
        hasRecord: 1,
      })
    ).toEqual({
      client_type: 'ADULT',
      therapy_theory: 'PSYCHODYNAMIC',
      has_record: 'TRUE',
    });
  });

  it('질문 선택지는 screenshot 순서와 문구를 유지한다', () => {
    expect(COHORT_SURVEY_OPTIONS.clientType.map((item) => item.label)).toEqual([
      '일반 성인',
      '부부·가족',
      '아동·청소년',
      '중장년·노인',
    ]);
    expect(COHORT_SURVEY_OPTIONS.therapyTheory).toHaveLength(5);
    expect(COHORT_SURVEY_OPTIONS.hasRecord.map((item) => item.label)).toEqual([
      '있다',
      '없다',
    ]);
  });

  it('존재하지 않는 선택지 번호는 API payload로 변환하지 않는다', () => {
    expect(() =>
      adaptCohortSurveyChoices({
        clientType: 0,
        therapyTheory: 1,
        hasRecord: 1,
      })
    ).toThrow('Q1 선택지가 올바르지 않습니다.');
  });
});
