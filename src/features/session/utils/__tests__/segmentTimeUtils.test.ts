import { describe, expect, it } from 'vitest';

import type { TranscribeSegment } from '../../types';
import {
  deriveSegmentEnd,
  getSegmentTimeBounds,
  parseTimeInput,
} from '../segmentTimeUtils';

const seg = (id: number, start: number, end: number): TranscribeSegment => ({
  id,
  start,
  end,
  text: '',
  speaker: 0,
});
const nullSeg = (id: number): TranscribeSegment => ({
  id,
  start: null,
  end: null,
  text: '',
  speaker: 0,
});

describe('getSegmentTimeBounds', () => {
  const segments = [seg(1, 0, 5), seg(2, 5, 10), seg(3, 10, 15)];

  it('중간 세그먼트는 앞 end ~ 뒤 start 범위', () => {
    expect(getSegmentTimeBounds(segments, 2, 100)).toEqual({ min: 5, max: 10 });
  });

  it('첫 세그먼트는 min=0', () => {
    expect(getSegmentTimeBounds(segments, 1, 100)).toEqual({ min: 0, max: 5 });
  });

  it('마지막 세그먼트는 max=audioDuration', () => {
    expect(getSegmentTimeBounds(segments, 3, 100)).toEqual({
      min: 10,
      max: 100,
    });
  });

  it('null 세그먼트는 가장 가까운 non-null 이웃까지 탐색', () => {
    const withNull = [seg(1, 0, 5), nullSeg(2), nullSeg(3), seg(4, 20, 25)];
    expect(getSegmentTimeBounds(withNull, 2, 100)).toEqual({ min: 5, max: 20 });
    expect(getSegmentTimeBounds(withNull, 3, 100)).toEqual({ min: 5, max: 20 });
  });
});

describe('parseTimeInput', () => {
  const bounds = { min: 0, max: 200 };

  it('MM:SS와 초 입력을 파싱한다', () => {
    expect(parseTimeInput('01:30', bounds)).toBe(90);
    expect(parseTimeInput('90', bounds)).toBe(90);
  });

  it('범위로 clamp한다', () => {
    expect(parseTimeInput('01:30', { min: 100, max: 200 })).toBe(100);
    expect(parseTimeInput('300', bounds)).toBe(200);
  });

  it('잘못된 입력은 null', () => {
    expect(parseTimeInput('abc', bounds)).toBeNull();
    expect(parseTimeInput('1:70', bounds)).toBeNull();
    expect(parseTimeInput('', bounds)).toBeNull();
  });
});

describe('deriveSegmentEnd', () => {
  it('start + 기본길이, max로 clamp', () => {
    expect(deriveSegmentEnd(10, { min: 5, max: 20 })).toBe(13);
    expect(deriveSegmentEnd(10, { min: 5, max: 11 })).toBe(11);
  });

  it('여유가 없으면 start와 동일', () => {
    expect(deriveSegmentEnd(10, { min: 5, max: 10 })).toBe(10);
  });
});
