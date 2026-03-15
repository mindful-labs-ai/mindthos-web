/**
 * Segment Range Utilities
 * speaker 편집 시 적용할 세그먼트 범위 계산
 */

import type { Speaker, TranscribeSegment } from '../types';

export type SpeakerRangeOption = 'single' | 'onwards' | 'all';

/**
 * speaker 변경을 적용할 세그먼트 ID 목록 계산
 *
 * @param currentSegmentId - 현재 선택된 세그먼트 ID
 * @param currentSpeakerId - 현재 speaker ID
 * @param range - 적용 범위 ('single' | 'onwards' | 'all')
 * @param allSegments - 전체 세그먼트 배열
 * @returns 영향받을 세그먼트 ID 배열
 */
export const calculateAffectedSegments = (
  currentSegmentId: number,
  currentSpeakerId: number,
  range: SpeakerRangeOption,
  allSegments: TranscribeSegment[]
): number[] => {
  const currentIndex = allSegments.findIndex(
    (seg) => seg.id === currentSegmentId
  );

  if (currentIndex === -1) {
    return [];
  }

  switch (range) {
    case 'single':
      // 현재 세그먼트만 반환
      return [currentSegmentId];

    case 'onwards':
      // 현재 세그먼트부터 동일 speaker ID의 모든 후속 세그먼트
      return allSegments
        .slice(currentIndex)
        .filter((seg) => seg.speaker === currentSpeakerId)
        .map((seg) => seg.id);

    case 'all':
      // 전체 세그먼트에서 동일 speaker ID를 가진 모든 세그먼트
      return allSegments
        .filter((seg) => seg.speaker === currentSpeakerId)
        .map((seg) => seg.id);

    default:
      return [];
  }
};

/**
 * 세그먼트에서 사용되지 않는 speaker 제거
 *
 * @param speakers - 현재 speaker 배열
 * @param segments - 전체 세그먼트 배열
 * @returns 정리된 speaker 배열 (사용 중인 speaker만 포함)
 */
export function cleanupUnusedSpeakers(
  speakers: Speaker[],
  segments: TranscribeSegment[]
): Speaker[] {
  // 실제로 사용 중인 speaker ID 수집
  const usedSpeakerIds = new Set<number>();
  segments.forEach((seg) => {
    usedSpeakerIds.add(seg.speaker);
  });

  // 사용 중인 speaker만 유지
  return speakers.filter((speaker) => usedSpeakerIds.has(speaker.id));
}
