import { useEffect, useRef } from 'react';

import { useSessionStore } from '@/stores/sessionStore';

import type { TranscribeSegment } from '../types';

interface UseTranscriptSyncProps {
  segments: TranscribeSegment[];
  currentTime: number;
  enableSync?: boolean; // 동기화 활성화 여부
  hasUserInteracted?: boolean; // 사용자가 재생/클릭 등 상호작용을 했는지 여부
}

interface UseTranscriptSyncReturn {
  currentSegmentIndex: number;
  activeSegmentRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 전사 세그먼트와 오디오 재생 동기화
 * gemini-3처럼 타임스탬프가 없는 경우 동기화 비활성화 가능
 * autoScrollEnabled 상태에 따라 자동 스크롤 on/off
 * hasUserInteracted가 false이면 active 상태 비활성화 (첫 진입 시 하이라이트 방지)
 */
export const useTranscriptSync = ({
  segments,
  currentTime,
  enableSync = true,
  hasUserInteracted = false,
}: UseTranscriptSyncProps): UseTranscriptSyncReturn => {
  const activeSegmentRef = useRef<HTMLDivElement>(null);
  const autoScrollEnabled = useSessionStore((state) => state.autoScrollEnabled);

  // 현재 재생 중인 세그먼트 찾기
  let currentSegmentIndex = -1;

  // 동기화가 활성화되고, 사용자가 상호작용했고, 세그먼트가 있으면 찾기
  if (
    enableSync &&
    hasUserInteracted &&
    segments.length > 0 &&
    segments[0].start !== null
  ) {
    currentSegmentIndex = segments.findIndex(
      (segment) =>
        segment.start !== null &&
        segment.end !== null &&
        currentTime >= segment.start &&
        currentTime < segment.end
    );
  }

  // 활성 세그먼트로 자동 스크롤 (autoScrollEnabled가 true일 때만)
  useEffect(() => {
    if (!enableSync || !autoScrollEnabled || currentSegmentIndex < 0) return;
    if (!activeSegmentRef.current) return;

    const element = activeSegmentRef.current;
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }, [currentSegmentIndex, enableSync, autoScrollEnabled]);

  return {
    currentSegmentIndex,
    activeSegmentRef,
  };
};
