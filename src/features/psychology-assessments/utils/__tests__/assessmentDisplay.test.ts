import { describe, expect, it } from 'vitest';

import {
  ASSESSMENT_KIND_LABEL,
  formatAssessmentDisplayText,
} from '../assessmentDisplay';

describe('assessment display labels', () => {
  it('uses Korean names for assessment kinds', () => {
    expect(ASSESSMENT_KIND_LABEL.mmpi).toBe('다면적 인성검사');
    expect(ASSESSMENT_KIND_LABEL.tci).toBe('기질 검사');
  });

  it('replaces assessment acronyms in user-visible text', () => {
    expect(formatAssessmentDisplayText('MMPI-2_홍길동_결과지.pdf')).toBe(
      '다면적 인성검사_홍길동_결과지.pdf'
    );
    expect(formatAssessmentDisplayText('TCI_RS_프로파일')).toBe(
      '기질 검사_프로파일'
    );
  });
});
