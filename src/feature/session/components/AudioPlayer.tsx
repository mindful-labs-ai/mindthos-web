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
    <div className="px-8 pb-2">
      <div className="flex items-center gap-4">
        <div
          role="slider"
          tabIndex={0}
          aria-label="오디오 진행 상태"
          aria-valuenow={Math.floor(currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.floor(duration)}
          aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
          className="group relative flex-1 cursor-pointer py-2 focus:outline-none"
          onClick={onProgressClick}
          onKeyDown={handleProgressKeyDown}
        >
          <div className="h-1.5 bg-surface-strong transition-all">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <div className="flex flex-1 items-start justify-start">
          <span className="min-w-[48px] text-sm font-medium text-fg">
            {formatTime(currentTime)}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            className="rounded-full p-2.5 text-fg transition-transform active:scale-95"
            aria-label="5초 뒤로"
            onClick={onBackward}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_3066_23883)">
                <path
                  d="M12 0C9.0455 0.00210637 6.19613 1.09662 4 3.073V1C4 0.734784 3.89464 0.48043 3.70711 0.292893C3.51957 0.105357 3.26522 0 3 0C2.73478 0 2.48043 0.105357 2.29289 0.292893C2.10536 0.48043 2 0.734784 2 1V4C2 4.79565 2.31607 5.55871 2.87868 6.12132C3.44129 6.68393 4.20435 7 5 7H8C8.26522 7 8.51957 6.89464 8.70711 6.70711C8.89464 6.51957 9 6.26522 9 6C9 5.73478 8.89464 5.48043 8.70711 5.29289C8.51957 5.10536 8.26522 5 8 5H5C4.96628 4.995 4.93289 4.98799 4.9 4.979C6.52952 3.33783 8.67813 2.31308 10.9791 2.07967C13.28 1.84626 15.5906 2.41866 17.5165 3.69916C19.4424 4.97967 20.8642 6.88889 21.5392 9.10095C22.2142 11.313 22.1005 13.6908 21.2176 15.8283C20.3347 17.9659 18.7372 19.7308 16.698 20.8218C14.6587 21.9127 12.304 22.2621 10.0358 21.8102C7.76764 21.3584 5.72659 20.1333 4.26106 18.3442C2.79553 16.5551 1.99637 14.3127 2 12C2 11.7348 1.89464 11.4804 1.70711 11.2929C1.51957 11.1054 1.26522 11 1 11C0.734784 11 0.48043 11.1054 0.292893 11.2929C0.105357 11.4804 0 11.7348 0 12C0 14.3734 0.703788 16.6935 2.02236 18.6668C3.34094 20.6402 5.21509 22.1783 7.4078 23.0866C9.60051 23.9948 12.0133 24.2324 14.3411 23.7694C16.6689 23.3064 18.8071 22.1635 20.4853 20.4853C22.1635 18.8071 23.3064 16.6689 23.7694 14.3411C24.2324 12.0133 23.9948 9.60051 23.0866 7.4078C22.1783 5.21509 20.6402 3.34094 18.6668 2.02236C16.6935 0.703788 14.3734 0 12 0V0Z"
                  fill="#3C3C3C"
                />
                <path
                  d="M9.60352 8.92969V16H8.12891V10.3262H8.08984L6.46875 11.3418V10.043L8.2168 8.92969H9.60352ZM13.9883 16.0977C12.2158 16.0977 11.1465 14.7793 11.1465 12.4648C11.1465 10.1553 12.2256 8.83203 13.9883 8.83203C15.751 8.83203 16.8301 10.1553 16.8301 12.4648C16.8301 14.7891 15.7559 16.0977 13.9883 16.0977ZM12.6504 12.4648C12.6406 14.0957 13.168 14.8867 13.9883 14.8867C14.8086 14.8867 15.3311 14.0957 15.3262 12.4648C15.3311 10.8486 14.8037 10.0381 13.9883 10.0332C13.1729 10.0381 12.6504 10.8486 12.6504 12.4648Z"
                  fill="#3C3C3C"
                />
              </g>
              <defs>
                <clipPath id="clip0_3066_23883">
                  <rect width="24" height="24" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </button>

          <button
            type="button"
            className="rounded-full p-2.5 text-fg transition-transform active:scale-75 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isLoading ? '로딩 중' : isPlaying ? '일시정지' : '재생'}
            onClick={onPlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="animate-spin"
              >
                <circle cx="12" cy="12" r="10" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75" />
              </svg>
            ) : isPlaying ? (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className="rounded-full p-2.5 text-fg transition-transform active:scale-95"
            aria-label="5초 앞으로"
            onClick={onForward}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_3066_23886)">
                <path
                  d="M22.9997 11C22.7345 11 22.4802 11.1054 22.2926 11.2929C22.1051 11.4804 21.9997 11.7348 21.9997 12C22.0079 14.3253 21.2081 16.5812 19.7372 18.3822C18.2664 20.1831 16.2157 21.4173 13.9356 21.8738C11.6556 22.3303 9.28777 21.9807 7.23691 20.8849C5.18605 19.789 3.57946 18.0148 2.69176 15.8657C1.80405 13.7165 1.69033 11.3257 2.37004 9.10201C3.04975 6.87828 4.48069 4.95966 6.41827 3.67407C8.35586 2.38849 10.6798 1.81575 12.9929 2.05377C15.3059 2.29179 17.4645 3.32578 19.0997 4.979C19.0668 4.98797 19.0334 4.99498 18.9997 5H15.9997C15.7345 5 15.4802 5.10536 15.2926 5.29289C15.1051 5.48043 14.9997 5.73478 14.9997 6C14.9997 6.26522 15.1051 6.51957 15.2926 6.70711C15.4802 6.89464 15.7345 7 15.9997 7H18.9997C19.7954 7 20.5584 6.68393 21.121 6.12132C21.6837 5.55871 21.9997 4.79565 21.9997 4V1C21.9997 0.734784 21.8944 0.48043 21.7068 0.292893C21.5193 0.105357 21.2649 0 20.9997 0C20.7345 0 20.4802 0.105357 20.2926 0.292893C20.1051 0.48043 19.9997 0.734784 19.9997 1V3.065C17.9523 1.23453 15.3386 0.162166 12.5956 0.0271026C9.8525 -0.107961 7.14617 0.702457 4.9288 2.32293C2.71143 3.94341 1.11736 6.27578 0.412948 8.9303C-0.291461 11.5848 -0.0635329 14.4007 1.05865 16.9074C2.18083 19.414 4.12928 21.4596 6.57841 22.7024C9.02754 23.9451 11.829 24.3097 14.5146 23.7353C17.2003 23.1608 19.6074 21.682 21.3338 19.5461C23.0602 17.4101 24.0012 14.7464 23.9997 12C23.9997 11.7348 23.8944 11.4804 23.7068 11.2929C23.5193 11.1054 23.2649 11 22.9997 11Z"
                  fill="#3C3C3C"
                />
                <path
                  d="M9.60352 8.92969V16H8.12891V10.3262H8.08984L6.46875 11.3418V10.043L8.2168 8.92969H9.60352ZM13.9883 16.0977C12.2158 16.0977 11.1465 14.7793 11.1465 12.4648C11.1465 10.1553 12.2256 8.83203 13.9883 8.83203C15.751 8.83203 16.8301 10.1553 16.8301 12.4648C16.8301 14.7891 15.7559 16.0977 13.9883 16.0977ZM12.6504 12.4648C12.6406 14.0957 13.168 14.8867 13.9883 14.8867C14.8086 14.8867 15.3311 14.0957 15.3262 12.4648C15.3311 10.8486 14.8037 10.0381 13.9883 10.0332C13.1729 10.0381 12.6504 10.8486 12.6504 12.4648Z"
                  fill="#3C3C3C"
                />
              </g>
              <defs>
                <clipPath id="clip0_3066_23886">
                  <rect width="24" height="24" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col items-end justify-end">
          <span className="min-w-[48px] text-right text-sm font-medium text-fg-muted">
            {formatTime(duration)}
          </span>
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
