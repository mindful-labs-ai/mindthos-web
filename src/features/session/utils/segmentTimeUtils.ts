/**
 * 세그먼트 타임스탬프 편집 유틸
 * 추가된 세그먼트 등의 시간을 이웃 세그먼트 사이로 제한해 지정
 */

import type { TranscribeSegment } from '../types';

export interface SegmentTimeBounds {
  min: number;
  max: number;
}

/** 이웃이 없을 때 기본 여유 구간(초) */
const DEFAULT_GAP = 5;
/** 시간 지정 시 부여할 기본 세그먼트 길이(초) */
const DEFAULT_SEGMENT_DURATION = 3;

/**
 * 세그먼트에 지정 가능한 시간 범위 [min, max] 계산
 * min = 가장 가까운 앞쪽 non-null 이웃의 end(없으면 start), 없으면 0
 * max = 가장 가까운 뒤쪽 non-null 이웃의 start, 없으면 audioDuration
 */
export function getSegmentTimeBounds(
  segments: TranscribeSegment[],
  segmentId: number,
  audioDuration: number
): SegmentTimeBounds {
  const idx = segments.findIndex((s) => s.id === segmentId);
  const fallbackMax = audioDuration > 0 ? audioDuration : DEFAULT_GAP;
  if (idx === -1) return { min: 0, max: fallbackMax };

  let min = 0;
  for (let i = idx - 1; i >= 0; i -= 1) {
    const s = segments[i];
    if (s.start != null) {
      // start가 있으면 WhisperSegment → end도 number 보장
      min = s.end;
      break;
    }
  }

  let max = fallbackMax;
  for (let i = idx + 1; i < segments.length; i += 1) {
    const s = segments[i];
    if (s.start != null) {
      max = s.start;
      break;
    }
  }

  if (max < min) max = min;
  return { min, max };
}

/**
 * "MM:SS" / "SS" / "S.ss" 입력을 초로 파싱 후 [min,max]로 clamp
 * @returns 파싱 불가 시 null
 */
export function parseTimeInput(
  raw: string,
  bounds: SegmentTimeBounds
): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let seconds: number;
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length !== 2) return null;
    const m = Number(parts[0]);
    const s = Number(parts[1]);
    if (!Number.isFinite(m) || !Number.isFinite(s) || s < 0 || s >= 60) {
      return null;
    }
    seconds = m * 60 + s;
  } else {
    seconds = Number(trimmed);
    if (!Number.isFinite(seconds)) return null;
  }

  if (seconds < 0) return null;
  return Math.min(Math.max(seconds, bounds.min), bounds.max);
}

/**
 * 지정한 start와 범위로 유효한 end 도출 (start < end <= max 보장 시도)
 */
export function deriveSegmentEnd(
  start: number,
  bounds: SegmentTimeBounds
): number {
  const end = Math.min(start + DEFAULT_SEGMENT_DURATION, bounds.max);
  return end > start ? end : start;
}
