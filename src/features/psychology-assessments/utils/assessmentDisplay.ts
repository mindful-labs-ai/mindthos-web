import type { AssessmentKind } from '../upload/assessmentUploadGateway';

export const ASSESSMENT_KIND_LABEL: Record<AssessmentKind, string> = {
  mmpi: '다면적 인성검사',
  tci: '기질 검사',
};

export const formatAssessmentSchemaLabel = (value: string): string =>
  value
    .replace(/MMPI(?:[-_\s]?2)?/gi, ASSESSMENT_KIND_LABEL.mmpi)
    .replace(/TCI(?:[-_\s]?RS)?/gi, ASSESSMENT_KIND_LABEL.tci);
