import { describe, expect, it } from 'vitest';

import type { FieldAnswer } from '@/features/document/types';

import { findLegacyFieldSignature } from './SentDocumentView';

/**
 * D1 이전 제출 동의서는 서명을 문서 레벨이 아니라 제거된 'signature' 필드의 답변
 * (`{ signatureDataUrl }`)에 저장했다. 헬퍼는 답변들 중 그 URL을 복원한다.
 */
describe('findLegacyFieldSignature', () => {
  it('필드 답변에 담긴 signatureDataUrl을 반환한다.', () => {
    const answers = {
      q1: { text: '응답' },
      signature: { signatureDataUrl: 'data:image/png;base64,AAA' },
    } as unknown as Record<string, FieldAnswer>;

    expect(findLegacyFieldSignature(answers)).toBe('data:image/png;base64,AAA');
  });

  it('필드 서명이 없으면 undefined (문서 레벨 서명이 우선하도록).', () => {
    const answers = {
      q1: { text: '응답' },
      q2: { score: 3 },
    } as unknown as Record<string, FieldAnswer>;

    expect(findLegacyFieldSignature(answers)).toBeUndefined();
  });

  it('빈 답변맵이면 undefined.', () => {
    expect(findLegacyFieldSignature({})).toBeUndefined();
  });
});
