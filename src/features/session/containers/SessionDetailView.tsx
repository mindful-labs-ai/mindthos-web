import React from 'react';

import { Tab } from '@/shared/ui/atoms/Tab';
import { AudioPlayer } from '@/widgets/session/AudioPlayer';
import { HandwrittenTabContent } from '@/widgets/session/HandwrittenTabContent';
import { HandwrittenToolbar } from '@/widgets/session/HandwrittenToolbar';
import { ProgressNoteTabContent } from '@/widgets/session/ProgressNoteTabContent';
import { SessionHeader } from '@/widgets/session/SessionHeader';
import { TabChangeConfirmModal } from '@/widgets/session/TabChangeConfirmModal';
import { TranscriptEditGuideModal } from '@/widgets/session/TranscriptEditGuideModal';
import { TranscriptTabContent } from '@/widgets/session/TranscriptTabContent';
import { TranscriptToolbar } from '@/widgets/session/TranscriptToolbar';

import type {
  HandwrittenTranscribe,
  ProgressNote,
  Session,
  Speaker,
  TranscribeSegment,
  Transcribe,
} from '../types';

export interface SessionDetailViewProps {
  session: Session;
  transcribe: Transcribe | HandwrittenTranscribe | null;
  isReadOnly: boolean;
  isHandwrittenSession: boolean;
  // Tab
  activeTab: string;
  tabItems: { value: string; label: React.ReactNode }[];
  onTabChange: (tab: string) => void;
  // Tab change modal
  isTabChangeModalOpen: boolean;
  onSetTabChangeModalOpen: (open: boolean) => void;
  onConfirmTabChange: () => void;
  onCancelTabChange: () => void;
  // Header
  onTitleUpdate?: (newTitle: string) => Promise<void>;
  // Transcript
  segments: TranscribeSegment[];
  speakers: Speaker[];
  isEditing: boolean;
  isAnonymized: boolean;
  enableTimestampFeatures: boolean;
  currentSegmentIndex: number;
  activeSegmentRef: React.RefObject<HTMLDivElement | null>;
  contentScrollRef: React.RefObject<HTMLDivElement | null>;
  isMenuOpen: boolean;
  onSetMenuOpen: (open: boolean) => void;
  onToggleAnonymized: () => void;
  onEditStart: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onCopyTranscript: () => void;
  onTextEdit: (index: number, text: string) => void;
  onSpeakerChange: (updates: { speakerChanges: Record<number, number>; speakerDefinitions: Speaker[] }) => Promise<void>;
  onAddSegment: (afterSegmentId: number, speaker: number) => void;
  onDeleteSegment: (segmentId: number) => void;
  onSeekTo: (time: number) => void;
  // Guide
  checkIsGuideLevel: (level: number) => boolean;
  nextGuideLevel: () => void;
  endGuide: () => void;
  onGuideScroll: (e: React.UIEvent<HTMLElement>) => void;
  // Handwritten
  isEditingHandwritten: boolean;
  handwrittenEditContent: string;
  isSavingHandwritten: boolean;
  onEditHandwrittenStart: () => void;
  onSaveHandwrittenEdit: () => void;
  onCancelHandwrittenEdit: () => void;
  onHandwrittenContentChange: (content: string) => void;
  onCopyHandwritten: () => void;
  // Progress notes
  activeCreatingTab: { tabId: string; templateId: number | null; isProcessing: boolean } | null;
  creatingTabs: Record<string, number | null>;
  sessionProgressNotes: ProgressNote[];
  transcribedText: string | null;
  isRegenerating: boolean;
  onCreateProgressNote: () => Promise<void>;
  onRegenerateProgressNote: (templateId: number) => Promise<void>;
  onTemplateSelect: (templateId: number | null) => void;
  onSaveProgressNoteSummary: (noteId: string, summary: string) => Promise<void>;
  // Audio
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
  currentTime: number;
  audioDuration: number;
  playbackRate: number;
  isLoadingAudioBlob: boolean;
  onPlayPause: () => void;
  onBackward: () => void;
  onForward: () => void;
  onProgressClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onPlaybackRateChange: (rate: number) => void;
}

export const SessionDetailView: React.FC<SessionDetailViewProps> = ({
  session,
  transcribe,
  isReadOnly,
  isHandwrittenSession,
  activeTab,
  tabItems,
  onTabChange,
  isTabChangeModalOpen,
  onSetTabChangeModalOpen,
  onConfirmTabChange,
  onCancelTabChange,
  onTitleUpdate,
  segments,
  speakers,
  isEditing,
  isAnonymized,
  enableTimestampFeatures,
  currentSegmentIndex,
  activeSegmentRef,
  contentScrollRef,
  isMenuOpen,
  onSetMenuOpen,
  onToggleAnonymized,
  onEditStart,
  onSaveEdit,
  onCancelEdit,
  onCopyTranscript,
  onTextEdit,
  onSpeakerChange,
  onAddSegment,
  onDeleteSegment,
  onSeekTo,
  checkIsGuideLevel,
  nextGuideLevel,
  endGuide,
  onGuideScroll,
  isEditingHandwritten,
  handwrittenEditContent,
  isSavingHandwritten,
  onEditHandwrittenStart,
  onSaveHandwrittenEdit,
  onCancelHandwrittenEdit,
  onHandwrittenContentChange,
  onCopyHandwritten,
  activeCreatingTab,
  creatingTabs,
  sessionProgressNotes,
  transcribedText,
  isRegenerating,
  onCreateProgressNote,
  onRegenerateProgressNote,
  onTemplateSelect,
  onSaveProgressNoteSummary,
  audioRef,
  isPlaying,
  currentTime,
  audioDuration,
  playbackRate,
  isLoadingAudioBlob,
  onPlayPause,
  onBackward,
  onForward,
  onProgressClick,
  onPlaybackRateChange,
}) => {
  const sessionId = session.id;

  return (
    <div className="mx-auto flex h-full w-full max-w-full flex-col overflow-hidden sm:max-w-[min(100vw-535px,1332px)]">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="metadata" />

      <div className="flex-shrink-0">
        <SessionHeader
          title={session.title || '제목 없음'}
          createdAt={session.created_at}
          duration={session.audio_meta_data?.duration_seconds || 0}
          isHandwritten={isHandwrittenSession}
          onTitleUpdate={isReadOnly ? undefined : onTitleUpdate}
        />
      </div>

      <div className="flex flex-shrink-0 select-none justify-start px-2 pt-2 sm:px-6">
        <Tab
          items={tabItems}
          value={activeTab}
          onValueChange={onTabChange}
          size="sm"
          fullWidth
          className="px-2 sm:px-8"
          variant="underline"
        />
      </div>

      {/* 탭 콘텐츠 */}
      <div
        className={`relative mx-2 mb-2 min-h-0 flex-1 rounded-xl border sm:mx-6 ${(isEditing || isEditingHandwritten) && activeTab === 'transcript' ? 'border-primary-500 bg-[#FDFFFE]' : 'border-surface-strong bg-surface'}`}
      >
        {/* 직접 입력 세션 버튼 영역 */}
        {activeTab === 'transcript' && isHandwrittenSession && (
          <HandwrittenToolbar
            isReadOnly={isReadOnly}
            isEditing={isEditingHandwritten}
            isSaving={isSavingHandwritten}
            onEditStart={onEditHandwrittenStart}
            onSaveEdit={onSaveHandwrittenEdit}
            onCancelEdit={onCancelHandwrittenEdit}
            onCopy={onCopyHandwritten}
          />
        )}

        {/* 축어록 버튼 영역 */}
        {activeTab === 'transcript' && !isHandwrittenSession && (
          <TranscriptToolbar
            isReadOnly={isReadOnly}
            isEditing={isEditing}
            isAnonymized={isAnonymized}
            enableTimestampFeatures={enableTimestampFeatures}
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={onSetMenuOpen}
            onToggleAnonymized={onToggleAnonymized}
            onEditStart={onEditStart}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onCopy={onCopyTranscript}
            checkIsGuideLevel={checkIsGuideLevel}
          />
        )}

        {activeTab === 'transcript' ? (
          isHandwrittenSession ? (
            <HandwrittenTabContent
              contentScrollRef={contentScrollRef}
              transcribe={transcribe as HandwrittenTranscribe | null}
              isEditing={isEditingHandwritten}
              editContent={handwrittenEditContent}
              isSaving={isSavingHandwritten}
              onContentChange={onHandwrittenContentChange}
            />
          ) : (
            <TranscriptTabContent
              contentScrollRef={contentScrollRef}
              segments={segments}
              speakers={speakers}
              transcribe={transcribe as Transcribe | null}
              clientId={session?.client_id || null}
              isReadOnly={isReadOnly}
              isEditing={isEditing}
              isAnonymized={isAnonymized}
              enableTimestampFeatures={enableTimestampFeatures}
              currentSegmentIndex={currentSegmentIndex}
              activeSegmentRef={activeSegmentRef}
              onSeekTo={onSeekTo}
              onTextEdit={onTextEdit}
              onSpeakerChange={onSpeakerChange}
              onAddSegment={onAddSegment}
              onDeleteSegment={onDeleteSegment}
              checkIsGuideLevel={checkIsGuideLevel}
              nextGuideLevel={nextGuideLevel}
              endGuide={endGuide}
              onGuideScroll={onGuideScroll}
            />
          )
        ) : (
          <ProgressNoteTabContent
            contentScrollRef={contentScrollRef}
            activeTab={activeTab}
            activeCreatingTab={activeCreatingTab}
            creatingTabs={creatingTabs}
            sessionId={sessionId}
            transcribedText={transcribedText}
            progressNotes={sessionProgressNotes}
            isReadOnly={isReadOnly}
            isRegenerating={isRegenerating}
            onCreateProgressNote={onCreateProgressNote}
            onRegenerateProgressNote={onRegenerateProgressNote}
            onTemplateSelect={onTemplateSelect}
            onSaveSummary={onSaveProgressNoteSummary}
          />
        )}
      </div>

      {activeTab === 'transcript' && !isHandwrittenSession && (
        <div className="flex-shrink-0 select-none">
          <AudioPlayer
            audioRef={audioRef}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={audioDuration}
            playbackRate={playbackRate}
            isLoading={isLoadingAudioBlob}
            onPlayPause={onPlayPause}
            onBackward={onBackward}
            onForward={onForward}
            onProgressClick={onProgressClick}
            onPlaybackRateChange={onPlaybackRateChange}
          />
        </div>
      )}

      {/* 탭 변경 확인 모달 */}
      <TabChangeConfirmModal
        open={isTabChangeModalOpen}
        onOpenChange={onSetTabChangeModalOpen}
        onCancel={onCancelTabChange}
        onConfirm={onConfirmTabChange}
      />

      {/* 축어록 편집 기능 가이드 모달 */}
      <TranscriptEditGuideModal />
    </div>
  );
};
