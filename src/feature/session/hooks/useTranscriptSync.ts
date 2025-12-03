import { useEffect, useRef } from 'react';

import type { TranscribeSegment } from '../types';

interface UseTranscriptSyncProps {
  segments: TranscribeSegment[];
  currentTime: number;
  enableSync?: boolean; // 동기화 활성화 여부
}

interface UseTranscriptSyncReturn {
  currentSegmentIndex: number;
  activeSegmentRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 전사 세그먼트와 오디오 재생 동기화
 * gemini-3처럼 타임스탬프가 없는 경우 동기화 비활성화 가능
 */
export const useTranscriptSync = ({
  segments,
  currentTime,
  enableSync = true,
}: UseTranscriptSyncProps): UseTranscriptSyncReturn => {
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // 현재 재생 중인 세그먼트 찾기
  let currentSegmentIndex = -1;

  // 동기화가 활성화되고 세그먼트가 있으면 찾기
  if (enableSync && segments.length > 0 && segments[0].start !== null) {
    currentSegmentIndex = segments.findIndex(
      (segment) =>
        segment.start !== null &&
        segment.end !== null &&
        currentTime >= segment.start &&
        currentTime < segment.end
    );
  }

  // 활성 세그먼트로 자동 스크롤
  useEffect(() => {
    if (!enableSync || currentSegmentIndex < 0) return;
    if (!activeSegmentRef.current) return;

    const element = activeSegmentRef.current;
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }, [currentSegmentIndex, enableSync]);

  return {
    currentSegmentIndex,
    activeSegmentRef,
  };
};
