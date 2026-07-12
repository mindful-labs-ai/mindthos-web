import { describe, expect, it } from 'vitest';

import {
  extractTextOnly,
  parseNonverbalText,
  parseNvTagText,
} from '../parseNonverbalText';

describe('parseNonverbalText — legacy {%...%} 파싱', () => {
  it('내용 있는 태그를 유형·라벨과 함께 분리한다', () => {
    expect(parseNonverbalText('네 {%A%한숨%} 그래요')).toEqual([
      { type: 'text', content: '네 ' },
      { type: 'nonverbal', tagType: 'A', content: '한숨' },
      { type: 'text', content: ' 그래요' },
    ]);
  });

  it('내용 없는 태그({%S%}, {%O%})는 빈 content로 분리한다', () => {
    expect(parseNonverbalText('{%S%}네')).toEqual([
      { type: 'nonverbal', tagType: 'S', content: '' },
      { type: 'text', content: '네' },
    ]);
    expect(parseNonverbalText('{%O%}')).toEqual([
      { type: 'nonverbal', tagType: 'O', content: '' },
    ]);
  });

  it('태그가 없으면 텍스트 단일 파트를 반환한다', () => {
    expect(parseNonverbalText('평문')).toEqual([
      { type: 'text', content: '평문' },
    ]);
  });
});

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

describe('parseNvTagText — 엣지 케이스', () => {
  it('nv가 빈 배열이면 텍스트 단일 파트를 반환한다', () => {
    const parts = parseNvTagText('안녕하세요', []);
    expect(parts).toEqual([{ type: 'text', content: '안녕하세요' }]);
  });

  it('nv가 undefined이면 텍스트 단일 파트를 반환한다', () => {
    const parts = parseNvTagText('안녕하세요', undefined);
    expect(parts).toEqual([{ type: 'text', content: '안녕하세요' }]);
  });

  it('콜론 없는 nv 항목은 무시된다', () => {
    // 's1:침묵 3초' 정상 + 'BAD_ENTRY' 이상 항목 혼합
    const parts = parseNvTagText('⟪nv:s1⟫텍스트', ['BAD_ENTRY', 's1:침묵 3초']);
    // BAD_ENTRY는 nvMap에 등록되지 않아야 함
    const nv = parts.filter((p) => p.type === 'nonverbal');
    expect(nv).toHaveLength(1);
    expect(nv[0]).toMatchObject({ tagType: 'S', content: '침묵 3초' });
  });

  it('nv 맵에 없는 마커 키는 조용히 드롭된다', () => {
    // ⟪nv:unknown⟫ 키가 nv 배열에 없으면 해당 마커만 제거하고 나머지 텍스트 보존
    const parts = parseNvTagText('앞⟪nv:unknown⟫뒤', ['s1:침묵 3초']);
    expect(parts).toEqual([
      { type: 'text', content: '앞' },
      { type: 'text', content: '뒤' },
    ]);
  });
});

describe('extractTextOnly', () => {
  it('⟪nv:KEY⟫ 태그를 제거하고 순수 텍스트만 반환한다', () => {
    const result = extractTextOnly('안녕⟪nv:s1⟫하세요', ['s1:침묵 3초']);
    expect(result).toBe('안녕하세요');
  });

  it('⟪deid:key|원본⟫을 원본 텍스트로 치환한다', () => {
    const result = extractTextOnly('이름: ⟪deid:name1|김철수⟫입니다.');
    expect(result).toBe('이름: 김철수입니다.');
  });

  it('⟪nv:...⟫와 ⟪deid:...⟫가 혼합된 경우 모두 처리된다', () => {
    const result = extractTextOnly('⟪nv:s1⟫⟪deid:n1|박영희⟫에게 전화했다.', [
      's1:침묵 1초',
    ]);
    expect(result).toBe('박영희에게 전화했다.');
  });
});
