import React from 'react';

import { cn } from '@/lib/cn';

export interface AudioPlayerProps {
  /**
   * Audio source URL
   */
  src: string;
  /**
   * Audio title
   */
  title?: string;
  /**
   * Show timecode
   */
  timecode?: boolean;
  /**
   * Play handler
   */
  onPlay?: () => void;
  /**
   * Pause handler
   */
  onPause?: () => void;
  /**
   * Seek handler
   */
  onSeek?: (time: number) => void;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * AudioPlayer component
 *
 * Minimal audio player with native controls wrapper.
 * Baseline implementation using native <audio> element.
 *
 * @example
 * ```tsx
 * <AudioPlayer
 *   src="/audio.mp3"
 *   title="Episode 1"
 *   timecode
 *   onPlay={() => console.log('playing')}
 * />
 * ```
 */
export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  timecode = false,
  onPlay,
  onPause,
  onSeek,
  className,
}) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        onPause?.();
      } else {
        audioRef.current.play();
        onPlay?.();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      onSeek?.(time);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-4',
        'rounded-[var(--radius-lg)] border-2 border-border bg-surface',
        className
      )}
    >
      {title && <div className="text-sm font-medium text-fg">{title}</div>}

      <div className="flex items-center gap-3">
        <button
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className={cn(
            'flex items-center justify-center',
            'h-10 w-10 rounded-full',
            'bg-primary text-surface',
            'transition-opacity duration-200 hover:opacity-90',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
        >
          {isPlaying ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg
              className="ml-0.5 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex flex-1 flex-col gap-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className={cn(
              'h-1 w-full cursor-pointer appearance-none rounded-full',
              'bg-surface-contrast',
              '[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary',
              '[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3',
              '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary'
            )}
          />
          {timecode && (
            <div className="flex justify-between text-xs text-fg-muted">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          )}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      >
        <track kind="captions" />
      </audio>
    </div>
  );
};

AudioPlayer.displayName = 'AudioPlayer';
