import { describe, expect, it } from 'vitest';

import type { TranscribeSegment } from '../../types';
import {
  countMatchesInSegments,
  findReplaceAllSegments,
  listMatchesInSegments,
  replaceInStoredText,
  replaceNthInStoredText,
} from '../contentsEditor';

const seg = (id: number, text: string): TranscribeSegment => ({
  id,
  start: id,
  end: id + 1,
  text,
  speaker: 0,
});

describe('replaceInStoredText (태그 안전 치환)', () => {
  it('일반 텍스트를 치환하고 횟수를 센다', () => {
    expect(replaceInStoredText('정민아 정민이', '정민', '경민')).toEqual({
      text: '경민아 경민이',
      count: 2,
    });
  });

  it('신규 nv 태그(⟪nv:...⟫) 안은 건드리지 않는다', () => {
    const input = '정민 ⟪nv:s1⟫ 정민';
    const { text, count } = replaceInStoredText(input, '정민', '경민');
    expect(count).toBe(2);
    expect(text).toBe('경민 ⟪nv:s1⟫ 경민');
    expect(text).toContain('⟪nv:s1⟫');
  });

  it('deid 원문(⟪deid:key|원문⟫)은 보호한다', () => {
    const input = '⟪deid:d1|정민수⟫ 정민';
    const { text, count } = replaceInStoredText(input, '정민', '경민');
    // 토큰 밖의 "정민"만 치환, deid 원문의 "정민수"는 보존
    expect(count).toBe(1);
    expect(text).toBe('⟪deid:d1|정민수⟫ 경민');
    expect(text).toContain('⟪deid:d1|정민수⟫');
  });

  it('레거시 비언어 토큰은 보호한다', () => {
    expect(replaceInStoredText('정민 {%S%} 정민', '정민', '경민')).toEqual({
      text: '경민 {%S%} 경민',
      count: 2,
    });
    // 토큰 내부 텍스트는 치환 대상 아님
    expect(replaceInStoredText('{%A%정민%}', '정민', '경민')).toEqual({
      text: '{%A%정민%}',
      count: 0,
    });
  });

  it('기본은 대소문자 무시, 옵션으로 구분 가능', () => {
    expect(replaceInStoredText('ABC abc', 'abc', 'x').count).toBe(2);
    expect(
      replaceInStoredText('ABC abc', 'abc', 'x', { caseSensitive: true }).count
    ).toBe(1);
  });

  it('빈 검색어는 원본을 그대로 둔다', () => {
    expect(replaceInStoredText('정민', '', '경민')).toEqual({
      text: '정민',
      count: 0,
    });
  });

  it('정규식 특수문자를 리터럴로 처리한다', () => {
    expect(replaceInStoredText('a.b a.b', 'a.b', 'X')).toEqual({
      text: 'X X',
      count: 2,
    });
    expect(replaceInStoredText('axb', 'a.b', 'X').count).toBe(0);
  });
});

describe('findReplaceAllSegments', () => {
  const segments = [seg(1, '정민이 왔다'), seg(2, '아무개'), seg(3, '정민 정민')];

  it('매치된 세그먼트만 edits에 담고 총 횟수를 반환한다', () => {
    const { edits, totalCount } = findReplaceAllSegments(
      segments,
      '정민',
      '경민'
    );
    expect(totalCount).toBe(3);
    expect(edits).toEqual({ 1: '경민이 왔다', 3: '경민 경민' });
    expect(edits[2]).toBeUndefined();
  });
});

describe('countMatchesInSegments', () => {
  it('치환 없이 매치 개수만 센다', () => {
    const segments = [seg(1, '정민 정민'), seg(2, '⟪nv:s1⟫정민')];
    expect(countMatchesInSegments(segments, '정민')).toBe(3);
  });
});

describe('replaceNthInStoredText (하나씩 치환)', () => {
  it('n번째 매치 하나만 치환한다', () => {
    expect(replaceNthInStoredText('정민 정민 정민', '정민', '경민', 1)).toEqual({
      text: '정민 경민 정민',
      replaced: true,
    });
    expect(replaceNthInStoredText('정민 정민 정민', '정민', '경민', 0).text).toBe(
      '경민 정민 정민'
    );
  });

  it('태그 밖 기준으로 카운트하며 토큰은 보호한다', () => {
    const input = '정민 ⟪nv:s1⟫ 정민';
    expect(replaceNthInStoredText(input, '정민', '경민', 1)).toEqual({
      text: '정민 ⟪nv:s1⟫ 경민',
      replaced: true,
    });
  });

  it('범위를 벗어난 n은 치환하지 않는다', () => {
    expect(replaceNthInStoredText('정민', '정민', '경민', 5)).toEqual({
      text: '정민',
      replaced: false,
    });
  });
});

describe('listMatchesInSegments', () => {
  it('세그먼트별 occ를 순서대로 나열한다', () => {
    const segments = [seg(1, '정민 정민'), seg(2, '없음'), seg(3, '정민')];
    expect(listMatchesInSegments(segments, '정민')).toEqual([
      { segmentId: 1, occ: 0 },
      { segmentId: 1, occ: 1 },
      { segmentId: 3, occ: 0 },
    ]);
  });
});
