import React from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import { useSessionStore } from '@/stores/sessionStore';

import { AudioPlayer } from '../components/AudioPlayer';
import { SessionHeader } from '../components/SessionHeader';
import { TranscriptControls } from '../components/TranscriptControls';
import { TranscriptSegment } from '../components/TranscriptSegment';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useTranscriptSync } from '../hooks/useTranscriptSync';
import { getSpeakerDisplayName } from '../utils/speakerUtils';

export const SessionDetailPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [speakerFilter, setSpeakerFilter] = React.useState<number | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const sessions = useSessionStore((state) => state.sessions);
  const transcribes = useSessionStore((state) => state.transcribes);
  const updateSegmentText = useSessionStore((state) => state.updateSegmentText);
  const updateSegmentSpeaker = useSessionStore(
    (state) => state.updateSegmentSpeaker
  );

  const session = sessions.find((s) => s.id === sessionId);
  const transcribe = sessionId ? transcribes[sessionId] : null;

  const allSegments = transcribe?.contents?.result?.segments || [];
  const speakers = transcribe?.contents?.result?.speakers || [];

  const segments =
    speakerFilter !== null
      ? allSegments.filter((seg) => seg.speaker === speakerFilter)
      : allSegments;

  const handleTextEdit = (segmentId: number, newText: string) => {
    if (sessionId) {
      updateSegmentText(sessionId, segmentId, newText);
    }
  };

  const handleSpeakerChange = (segmentId: number, newSpeakerId: number) => {
    if (sessionId) {
      updateSegmentSpeaker(sessionId, segmentId, newSpeakerId);
    }
  };

  const audioMetadata = session?.audio_meta_data as {
    duration?: number;
  } | null;

  const {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    handlePlayPause,
    handleBackward,
    handleForward,
    handleProgressClick,
    handleSeekTo,
    handlePlaybackRateChange,
  } = useAudioPlayer(session?.audio_url || null);

  const { currentSegmentIndex, activeSegmentRef } = useTranscriptSync(
    segments,
    currentTime
  );

  React.useEffect(() => {
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleForward();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleBackward, handleForward]);

  if (!session) {
    return null;
  }

  const audioDuration = audioMetadata?.duration || duration || 0;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-contrast">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="metadata" />

      <div className="flex-shrink-0">
        <SessionHeader
          title={session.title || '제목 없음'}
          createdAt={session.created_at}
        />
      </div>

      <div className="flex-shrink-0 border-b border-border bg-bg px-8">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="border-b-2 border-primary px-4 py-3 text-sm font-medium text-primary"
          >
            축어록
          </button>
          <button
            type="button"
            className="px-4 py-3 text-sm font-medium text-fg-muted hover:text-fg"
          >
            상담 노트
          </button>
          <button
            type="button"
            className="px-4 py-3 text-fg-muted hover:text-fg"
            aria-label="새 탭 추가"
          >
            +
          </button>
        </div>
      </div>

      <TranscriptControls
        speakers={speakers}
        speakerFilter={speakerFilter}
        isEditing={isEditing}
        onSpeakerFilterChange={setSpeakerFilter}
        onEditingToggle={() => setIsEditing(!isEditing)}
        getSpeakerName={(speakerId) =>
          getSpeakerDisplayName(speakerId, speakers)
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-4">
          {segments.length > 0 ? (
            segments.map((segment, index) => (
              <TranscriptSegment
                key={segment.id}
                segment={segment}
                speakers={speakers}
                isActive={index === currentSegmentIndex}
                isEditable={isEditing}
                segmentRef={
                  index === currentSegmentIndex ? activeSegmentRef : undefined
                }
                onClick={handleSeekTo}
                onTextEdit={handleTextEdit}
                onSpeakerChange={handleSpeakerChange}
              />
            ))
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-fg-muted">전사 내용이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        <AudioPlayer
          audioRef={audioRef}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={audioDuration}
          playbackRate={playbackRate}
          onPlayPause={handlePlayPause}
          onBackward={handleBackward}
          onForward={handleForward}
          onProgressClick={handleProgressClick}
          onPlaybackRateChange={handlePlaybackRateChange}
        />
      </div>
    </div>
  );
};

export default SessionDetailPage;
