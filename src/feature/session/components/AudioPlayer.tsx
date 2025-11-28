import React from 'react';

import { PLAYBACK_RATES } from '../constants/audioPlayer';
import { useAudioPlayerKeyboard } from '../hooks/useAudioPlayerKeyboard';
import { formatTime } from '../utils/formatTime';

interface AudioPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isLoading?: boolean;
  onPlayPause: () => void;
  onBackward: () => void;
  onForward: () => void;
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onPlaybackRateChange: (rate: number) => void;
  onSeek?: (time: number) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioRef,
  isPlaying,
  currentTime,
  duration,
  playbackRate,
  isLoading = false,
  onPlayPause,
  onBackward,
  onForward,
  onProgressClick,
  onPlaybackRateChange,
  onSeek,
}) => {
  const { handleProgressKeyDown } = useAudioPlayerKeyboard({
    audioRef,
    currentTime,
    duration,
    onSeek,
  });

  const handlePlaybackRateClick = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    onPlaybackRateChange(PLAYBACK_RATES[nextIndex]);
  };

  return (
    <div className="border-t border-border bg-bg px-8 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-4">
        <span className="min-w-[48px] text-sm font-medium text-fg">
          {formatTime(currentTime)}
        </span>
        <div
          role="slider"
          tabIndex={0}
          aria-label="오디오 진행 상태"
          aria-valuenow={Math.floor(currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
          className="group relative flex-1 cursor-pointer py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onClick={onProgressClick}
          onKeyDown={handleProgressKeyDown}
        >
          <div className="h-1.5 rounded-full bg-surface transition-all group-hover:h-2 group-focus:h-2">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
        <span className="min-w-[48px] text-right text-sm font-medium text-fg-muted">
          {formatTime(duration)}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-full p-2.5 text-fg transition-all hover:bg-surface hover:text-primary active:scale-95"
            aria-label="5초 뒤로"
            onClick={onBackward}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <button
            type="button"
            className="rounded-full bg-primary p-4 text-white shadow-lg transition-all hover:bg-primary-600 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isLoading ? '로딩 중' : isPlaying ? '일시정지' : '재생'}
            onClick={onPlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="animate-spin"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  opacity="0.25"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  opacity="0.75"
                />
              </svg>
            ) : isPlaying ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="rounded-full p-2.5 text-fg transition-all hover:bg-surface hover:text-primary active:scale-95"
            aria-label="5초 앞으로"
            onClick={onForward}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 items-center justify-end">
          <button
            type="button"
            className="min-w-[64px] rounded-lg px-3 py-2 text-sm font-medium text-fg transition-all hover:bg-surface hover:text-primary active:scale-95"
            aria-label="재생 속도 변경"
            onClick={handlePlaybackRateClick}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
