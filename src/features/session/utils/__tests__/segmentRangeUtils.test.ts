import { describe, expect, it } from 'vitest';

import type { TranscribeSegment } from '../../types';
import { calculateAffectedSegments } from '../segmentRangeUtils';

const seg = (id: number, speaker: number): TranscribeSegment => ({
  id,
  start: id,
  end: id + 1,
  text: `seg${id}`,
  speaker,
});

// index: 0    1    2    3    4
// id:    10   11   12   13   14
// spk:    0    1    0    1    0
const segments: TranscribeSegment[] = [
  seg(10, 0),
  seg(11, 1),
  seg(12, 0),
  seg(13, 1),
  seg(14, 0),
];

describe('calculateAffectedSegments', () => {
  it('single: 현재 세그먼트만 반환한다', () => {
    expect(calculateAffectedSegments(12, 0, 'single', segments)).toEqual([12]);
  });

  it('onwards: 현재부터 동일 화자의 이후 세그먼트만 반환한다', () => {
    expect(calculateAffectedSegments(10, 0, 'onwards', segments)).toEqual([
      10, 12, 14,
    ]);
  });

  it('all: 동일 화자의 전체 세그먼트를 반환한다', () => {
    expect(calculateAffectedSegments(11, 1, 'all', segments)).toEqual([11, 13]);
  });

  it('존재하지 않는 세그먼트 ID는 빈 배열을 반환한다', () => {
    expect(calculateAffectedSegments(999, 0, 'all', segments)).toEqual([]);
  });

  describe('range (구간 지정 — 화자 무관)', () => {
    it('현재부터 끝 세그먼트까지 구간 전체를 화자 무관하게 반환한다', () => {
      expect(calculateAffectedSegments(11, 1, 'range', segments, 13)).toEqual([
        11, 12, 13,
      ]);
    });

    it('endSegmentId가 없으면 현재 세그먼트만 반환한다', () => {
      expect(calculateAffectedSegments(11, 1, 'range', segments)).toEqual([11]);
    });

    it('endSegmentId를 찾을 수 없으면 현재 세그먼트만 반환한다', () => {
      expect(
        calculateAffectedSegments(11, 1, 'range', segments, 999)
      ).toEqual([11]);
    });

    it('끝이 시작보다 앞이면 구간을 정규화(swap)해 반환한다', () => {
      expect(calculateAffectedSegments(13, 1, 'range', segments, 11)).toEqual([
        11, 12, 13,
      ]);
    });
  });
});
