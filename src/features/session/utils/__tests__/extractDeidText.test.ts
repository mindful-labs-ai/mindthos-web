import { describe, expect, it } from 'vitest';

import { extractDeidText } from '../extractDeidText';

describe('extractDeidText', () => {
  const deid = { d1: '인물1', d2: '금액' };
  const text = '⟪deid:d1|정미연⟫ 씨가 ⟪deid:d2|40만 원⟫을 보냈어요.';

  it('showDeid=false: 원본 텍스트로 복원한다', () => {
    expect(extractDeidText(text, deid, false)).toBe(
      '정미연 씨가 40만 원을 보냈어요.'
    );
  });

  it('showDeid=true: [라벨] 형식으로 치환한다', () => {
    expect(extractDeidText(text, deid, true)).toBe(
      '[인물1] 씨가 [금액]을 보냈어요.'
    );
  });

  it('라벨 맵에 없는 키는 키 자체를 라벨로 쓴다', () => {
    expect(extractDeidText('⟪deid:dx|홍길동⟫', deid, true)).toBe('[dx]');
  });

  it('deid 맵이 없거나 비어 있으면 텍스트를 그대로 반환한다', () => {
    expect(extractDeidText(text, undefined, true)).toBe(text);
    expect(extractDeidText(text, {}, true)).toBe(text);
  });

  it('태그가 없는 평문은 그대로 반환한다', () => {
    expect(extractDeidText('평문입니다.', deid, true)).toBe('평문입니다.');
  });
});
