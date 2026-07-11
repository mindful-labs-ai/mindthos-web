import { describe, expect, it } from 'vitest';

import {
  ASSESSMENT_KIND_LABEL,
  formatAssessmentSchemaLabel,
} from '../assessmentDisplay';

describe('assessment display labels', () => {
  it('uses Korean names for assessment kinds', () => {
    expect(ASSESSMENT_KIND_LABEL.mmpi).toBe('다면적 인성검사');
    expect(ASSESSMENT_KIND_LABEL.tci).toBe('기질 검사');
  });

  it('replaces assessment acronyms only for schema labels', () => {
    expect(formatAssessmentSchemaLabel('MMPI-2_프로파일')).toBe(
      '다면적 인성검사_프로파일'
    );
    expect(formatAssessmentSchemaLabel('TCI_RS_프로파일')).toBe(
      '기질 검사_프로파일'
    );
  });
});
