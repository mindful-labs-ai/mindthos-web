import React from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import { Tab } from '@/components/ui/atoms/Tab';
import type { TabItem } from '@/components/ui/atoms/Tab';
import { useSessionStore } from '@/stores/sessionStore';

import { AudioPlayer } from '../components/AudioPlayer';
import { ProgressNoteView } from '../components/ProgressNoteView';
import { SessionHeader } from '../components/SessionHeader';
import { TranscriptControls } from '../components/TranscriptControls';
import { TranscriptSegment } from '../components/TranscriptSegment';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useTranscriptSync } from '../hooks/useTranscriptSync';
import { getSpeakerDisplayName } from '../utils/speakerUtils';

export const SessionDetailPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<string>('transcript');
  const [speakerFilter, setSpeakerFilter] = React.useState<number | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const sessions = useSessionStore((state) => state.sessions);
  const transcribes = useSessionStore((state) => state.transcribes);
  const progressNotes = useSessionStore((state) => state.progressNotes);
  const updateSegmentText = useSessionStore((state) => state.updateSegmentText);
  const updateSegmentSpeaker = useSessionStore(
    (state) => state.updateSegmentSpeaker
  );

  const session = sessions.find((s) => s.id === sessionId);
  const transcribe = sessionId ? transcribes[sessionId] : null;

  const sessionProgressNotes = React.useMemo(
    () => (sessionId ? progressNotes[sessionId] || [] : []),
    [sessionId, progressNotes]
  );

  // 탭 아이템 동적 생성
  const tabItems: TabItem[] = React.useMemo(() => {
    const items: TabItem[] = [
      { value: 'transcript', label: '축어록' },
      ...sessionProgressNotes.map((note) => ({
        value: note.id,
        label: note.title || '상담 노트',
      })),
      { value: 'add', label: '+' },
    ];
    return items;
  }, [sessionProgressNotes]);

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

      <div className="flex flex-shrink-0 justify-start border-b border-border bg-bg px-8 pt-2">
        <Tab
          items={tabItems}
          value={activeTab}
          onValueChange={(value) => {
            if (value === 'add') {
              // TODO: 새 탭 추가 기능 구현
              return;
            }
            setActiveTab(value);
          }}
          size="md"
          variant="underline"
        />
      </div>

      {activeTab === 'transcript' && (
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
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        {activeTab === 'transcript' ? (
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
        ) : (
          (() => {
            const selectedNote = sessionProgressNotes.find(
              (note) => note.id === activeTab
            );
            return selectedNote ? (
              <ProgressNoteView
                note={selectedNote}
                onCopy={() => {
                  // TODO: 복사 기능 구현
                }}
                onDelete={() => {
                  // TODO: 삭제 기능 구현
                }}
              />
            ) : (
              <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-fg-muted">상담 노트를 선택해주세요.</p>
              </div>
            );
          })()
        )}
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
