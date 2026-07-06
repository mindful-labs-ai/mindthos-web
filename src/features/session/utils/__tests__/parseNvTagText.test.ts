import { describe, expect, it } from 'vitest';

import { parseNvTagText } from '../parseNonverbalText';

describe('parseNvTagText — 접두 key → tagType 매핑', () => {
  it('s→침묵(S), e→감정(E), 그 외→액션(A)로 분기하고 라벨을 보존한다', () => {
    // 벤더 STT 포맷: 침묵은 s 접두(⟪nv:sN⟫ + sN:침묵 N초).
    const parts = parseNvTagText('⟪nv:s1⟫가⟪nv:e1⟫나⟪nv:a1⟫다', [
      's1:침묵 3초',
      'e1:웃음',
      'a1:박수',
    ]);
    const nv = parts.filter((p) => p.type === 'nonverbal');
    expect(nv).toEqual([
      { type: 'nonverbal', tagType: 'S', content: '침묵 3초' },
      { type: 'nonverbal', tagType: 'E', content: '웃음' },
      { type: 'nonverbal', tagType: 'A', content: '박수' },
    ]);
  });

  it('마커 사이 텍스트는 순서대로 보존된다', () => {
    const parts = parseNvTagText('안녕⟪nv:s1⟫하세요', ['s1:침묵 5초']);
    expect(parts).toEqual([
      { type: 'text', content: '안녕' },
      { type: 'nonverbal', tagType: 'S', content: '침묵 5초' },
      { type: 'text', content: '하세요' },
    ]);
  });
});
