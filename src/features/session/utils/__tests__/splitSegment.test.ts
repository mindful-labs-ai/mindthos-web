import { describe, expect, it } from 'vitest';

import type { Contents } from '../contentsEditor';
import { getSegments, splitSegmentByBoundaries } from '../contentsEditor';

const seg = (
  id: number,
  text: string,
  speaker: number,
  extra: Record<string, unknown> = {}
) => ({ id, start: null, end: null, text, speaker, ...extra });

const make = (segments: unknown[]): Contents =>
  ({ segments }) as unknown as Contents;

describe('splitSegmentByBoundaries', () => {
  it('3분할 (화자 전환): 선택=B, 앞·뒤=A', () => {
    // "AAA BBB CCC" — BBB(4..7)를 화자1로
    const c = make([seg(1, 'AAA BBB CCC', 0)]);
    const out = getSegments(splitSegmentByBoundaries(c, 1, [4, 7], [0, 1, 0]));
    expect(out.map((s) => [s.id, s.text, s.speaker])).toEqual([
      [1, 'AAA', 0],
      [2, 'BBB', 1],
      [3, 'CCC', 0],
    ]);
    // 새 세그먼트는 타임 없음
    expect(out[1].start).toBeNull();
  });

  it('2분할 (세그먼트 분리, 같은 화자)', () => {
    const c = make([seg(1, 'AAA BBB', 0)]);
    const out = getSegments(splitSegmentByBoundaries(c, 1, [4], [0, 0]));
    expect(out.map((s) => [s.id, s.text, s.speaker])).toEqual([
      [1, 'AAA', 0],
      [2, 'BBB', 0],
    ]);
  });

  it('2분할 (캐럿 화자 전환): 뒷부분만 다른 화자', () => {
    const c = make([seg(1, 'AAA BBB', 0)]);
    const out = getSegments(splitSegmentByBoundaries(c, 1, [4], [0, 1]));
    expect(out.map((s) => [s.text, s.speaker])).toEqual([
      ['AAA', 0],
      ['BBB', 1],
    ]);
  });

  it('nv 태그는 속한 조각으로 파티션', () => {
    // "AAA ⟪nv:s1⟫"(0..11) | " BBB"
    const c = make([seg(1, 'AAA ⟪nv:s1⟫ BBB', 0, { nv: ['s1:침묵'] })]);
    const out = getSegments(splitSegmentByBoundaries(c, 1, [11], [0, 1]));
    expect(out[0].nv).toEqual(['s1:침묵']);
    expect(out[1].nv).toBeUndefined();
  });

  it('키 충돌 없음: a1 vs a11', () => {
    // "⟪nv:a1⟫ mid ⟪nv:a11⟫" — a1(0..7) | ... | a11
    const text = '⟪nv:a1⟫ mid ⟪nv:a11⟫';
    const cut = text.indexOf(' mid') + 4; // 앞조각에 a1, 뒷조각에 a11
    const c = make([seg(1, text, 0, { nv: ['a1:x', 'a11:y'] })]);
    const out = getSegments(splitSegmentByBoundaries(c, 1, [cut], [0, 1]));
    expect(out[0].nv).toEqual(['a1:x']);
    expect(out[1].nv).toEqual(['a11:y']);
  });

  it('유효 조각이 1개뿐이면 no-op', () => {
    const c = make([seg(1, 'AAA', 0)]);
    const out = getSegments(splitSegmentByBoundaries(c, 1, [0], [0, 0]));
    expect(out).toHaveLength(1);
    expect(out[0].text).toBe('AAA');
  });

  it('맨앞 선택(before 비어있음): 원본 id가 B를 가짐', () => {
    // "BBB CCC" — BBB(0..3) 선택=화자1, 뒤=화자0
    const c = make([seg(1, 'BBB CCC', 0)]);
    const out = getSegments(splitSegmentByBoundaries(c, 1, [0, 3], [0, 1, 0]));
    expect(out.map((s) => [s.id, s.text, s.speaker])).toEqual([
      [1, 'BBB', 1],
      [2, 'CCC', 0],
    ]);
  });
});
