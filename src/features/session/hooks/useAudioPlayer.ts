import { useEffect, useRef, useState } from 'react';

import { SEEK_STEP_SMALL } from '../constants/audioPlayer';

interface UseAudioPlayerReturn {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  isLoadingAudio: boolean;
  handlePlayPause: () => void;
  handleBackward: () => void;
  handleForward: () => void;
  handleProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSeekTo: (time: number) => void;
  handlePlaybackRateChange: (rate: number) => void;
  handleTimeUpdate: (time: number) => void;
}

interface UseAudioPlayerOptions {
  /** 오디오 재생 비활성화 여부 (가이드 모드 등) */
  disabled?: boolean;
}

export const useAudioPlayer = (
  audioUrl: string | null,
  options: UseAudioPlayerOptions = {}
): UseAudioPlayerReturn => {
  const { disabled = false } = options;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  // presigned URL을 직접 사용하고 브라우저의 자동 버퍼링 활용
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleLoadStart = () => {
      setIsLoadingAudio(true);
    };

    const handleLoadedMetadata = () => {
      setIsLoadingAudio(false);
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('[useAudioPlayer] Audio error:', e);
      setIsLoadingAudio(false);
    };

    // 이벤트 리스너 등록
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // 오디오 소스 설정
    audio.src = audioUrl;
    audio.preload = 'auto';
    audio.load();

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    // 비활성화 상태에서는 재생 불가
    if (disabled && !isPlaying) return;

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  };

  const handleBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - SEEK_STEP_SMALL);
  };

  const handleForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(
      audio.duration,
      audio.currentTime + SEEK_STEP_SMALL
    );
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isLoadingAudio) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audio.currentTime = percentage * audio.duration;
  };

  const handleSeekTo = async (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    // 비활성화 상태에서는 seek 후 자동 재생 불가
    if (disabled) return;

    audio.currentTime = time;
    if (!isPlaying) {
      try {
        await audio.play();
      } catch (error) {
        console.error('Audio playback failed:', error);
      }
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = rate;
    setPlaybackRate(rate);
  };

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    isLoadingAudio,
    handlePlayPause,
    handleBackward,
    handleForward,
    handleProgressClick,
    handleSeekTo,
    handlePlaybackRateChange,
    handleTimeUpdate: setCurrentTime,
  };
};
