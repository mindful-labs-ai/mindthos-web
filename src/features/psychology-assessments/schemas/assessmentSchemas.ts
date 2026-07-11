import type { AssessmentKind } from '../upload/assessmentUploadGateway';

import type { JsonSchema } from './jsonSchema.types';
import mmpiSchema from './mmpi.schema.json';
import tciSchema from './tci.schema.json';

/**
 * OCR 머신의 지원 스키마와 구조를 맞춘 프론트 검수용 스키마.
 * 표시용 title/description은 사용자 친화적 문구를 유지한다.
 */
export const ASSESSMENT_SCHEMAS: Record<AssessmentKind, JsonSchema> = {
  mmpi: mmpiSchema as JsonSchema,
  tci: tciSchema as JsonSchema,
};
