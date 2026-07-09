import { describe, expect, it } from 'vitest';

import { generateNvKey } from '../contentsEditor';

describe('generateNvKey', () => {
  it('빈 목록에서 타입별 첫 키를 만든다', () => {
    expect(generateNvKey([], 'S')).toBe('s1');
    expect(generateNvKey(undefined, 'E')).toBe('e1');
    expect(generateNvKey([], 'A')).toBe('a1');
  });

  it('같은 접두의 최대 번호 다음을 사용한다', () => {
    expect(generateNvKey(['s1:침묵', 's3:침묵', 'a1:한숨'], 'S')).toBe('s4');
    expect(generateNvKey(['a1:한숨', 'a2:웃음'], 'A')).toBe('a3');
  });

  it('다른 접두는 무시한다', () => {
    expect(generateNvKey(['e1:슬픔', 'a1:한숨'], 'S')).toBe('s1');
  });
});
