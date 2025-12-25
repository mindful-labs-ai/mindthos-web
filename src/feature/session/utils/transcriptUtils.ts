/**
 * Transcript Utility Functions
 * 타임스탬프 유무 판단 등 전사 관련 유틸리티
 */

import type { TranscribeSegment } from '../types';

/**
 * 세그먼트가 유효한 타임스탬프를 가지고 있는지 확인
 * @param segment - 전사 세그먼트
 * @returns 타임스탬프 유효 여부
 */
export function hasValidTimestamp(segment: TranscribeSegment): boolean {
  return segment.start !== null && segment.end !== null;
}

/**
 * 전사 세그먼트 배열이 타임스탬프를 가지고 있는지 확인 (Whisper 모델)
 * @param segments - 전사 세그먼트 배열
 * @returns 타임스탬프 존재 여부
 */
export function hasTimestamps(segments: TranscribeSegment[]): boolean {
  return segments.length > 0 && hasValidTimestamp(segments[0]);
}

/**
 * 타임스탬프 기반 기능 활성화 여부 결정
 * gemini-3 모델이거나 타임스탬프가 없으면 비활성화
 *
 * @param sttModel - STT 모델 종류
 * @param segments - 전사 세그먼트 배열
 * @returns 타임스탬프 기능 활성화 여부
 */
export function shouldEnableTimestampFeatures(
  sttModel?: string | null,
  segments?: TranscribeSegment[]
): boolean {
  // gemini-3 모델은 타임스탬프 기능 비활성화
  if (sttModel === 'gemini-3') return false;

  // 세그먼트가 없으면 비활성화
  if (!segments || segments.length === 0) return false;

  // 첫 번째 세그먼트에 타임스탬프가 있는지 확인
  return hasTimestamps(segments);
}
