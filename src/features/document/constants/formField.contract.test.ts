import { describe, expect, it } from 'vitest';

import { FIELD_TYPE_LABEL } from './formField';

/**
 * 문서 양식 필드 타입 — 웹/서버 공통 계약(드리프트 가드).
 * FIELD_TYPE_LABEL은 Record<FormFieldType, string>이라 새 타입을 추가하면 항목이 강제되고,
 * 아래 목록과 어긋나면 이 테스트가 깨진다. 바꿀 땐 서버 계약도 함께 맞춰야 한다:
 *   server: src/module/sent-document/util/document-response-validator.contract.spec.ts
 * (참고) 타입별 답변 허용 키(서버 answerKeys와 동일해야 함):
 *   short/long→[text], single/multiple→[selected, otherText], score→[score],
 *   consent→[agreed], signature→[signatureDataUrl, signedName, signedAt], section/richtext→[]
 */
const FIELD_TYPES = [
  'consent',
  'long',
  'multiple',
  'richtext',
  'score',
  'section',
  'short',
  'signature',
  'single',
] as const;

describe('FormField 필드 타입 계약(드리프트 가드)', () => {
  it('필드 타입은 정확히 9종이어야 합니다.', () => {
    expect(Object.keys(FIELD_TYPE_LABEL).sort()).toEqual([...FIELD_TYPES]);
  });
});
