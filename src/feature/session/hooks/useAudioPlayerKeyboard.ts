import React from 'react';

import { SEEK_STEP_LARGE, SEEK_STEP_SMALL } from '../constants/audioPlayer';

interface UseAudioPlayerKeyboardParams {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
}

export const useAudioPlayerKeyboard = ({
  audioRef,
  currentTime,
  duration,
  onSeek,
}: UseAudioPlayerKeyboardParams) => {
  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;

    let newTime = currentTime;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newTime = Math.max(0, currentTime - SEEK_STEP_SMALL);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newTime = Math.min(duration, currentTime + SEEK_STEP_SMALL);
        break;
      case 'Home':
        e.preventDefault();
        newTime = 0;
        break;
      case 'End':
        e.preventDefault();
        newTime = duration;
        break;
      case 'PageDown':
        e.preventDefault();
        newTime = Math.max(0, currentTime - SEEK_STEP_LARGE);
        break;
      case 'PageUp':
        e.preventDefault();
        newTime = Math.min(duration, currentTime + SEEK_STEP_LARGE);
        break;
      default:
        return;
    }

    if (onSeek) {
      onSeek(newTime);
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  return { handleProgressKeyDown };
};
