import { useEffect, useRef } from 'react';

import type { TranscribeSegment } from '../types';

interface UseTranscriptSyncReturn {
  currentSegmentIndex: number;
  activeSegmentRef: React.RefObject<HTMLDivElement | null>;
}

export const useTranscriptSync = (
  segments: TranscribeSegment[],
  currentTime: number
): UseTranscriptSyncReturn => {
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  const currentSegmentIndex = segments.findIndex(
    (segment) => currentTime >= segment.start && currentTime < segment.end
  );

  useEffect(() => {
    if (!activeSegmentRef.current || currentSegmentIndex < 0) {
      return;
    }

    const element = activeSegmentRef.current;
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }, [currentSegmentIndex]);

  return {
    currentSegmentIndex,
    activeSegmentRef,
  };
};
