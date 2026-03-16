import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { ROUTES } from '@/app/router/constants';
import { isDummySessionId } from '@/features/session/constants/dummySessions';
import { useCreditInfo } from '@/features/settings/hooks/useCreditInfo';
import { useTemplateList } from '@/features/template/hooks/useTemplateList';
import { trackError } from '@/lib/mixpanel';
import { updateProgressNoteSummary } from '@/shared/api/supabase/progressNoteQueries';
import {
  getAudioPresignedUrl,
  updateSessionTitle,
} from '@/shared/api/supabase/sessionQueries';
import { MixpanelError } from '@/shared/constants/mixpanelEvents';
import { sessionQueryKeys } from '@/shared/constants/queryKeys';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Tab } from '@/shared/ui/atoms/Tab';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { AudioPlayer } from '@/widgets/session/AudioPlayer';
import { HandwrittenTabContent } from '@/widgets/session/HandwrittenTabContent';
import { HandwrittenToolbar } from '@/widgets/session/HandwrittenToolbar';
import { MobileAudioPlayer } from '@/widgets/session/MobileAudioPlayer';
import { MobileHandwrittenTabContent } from '@/widgets/session/MobileHandwrittenTabContent';
import { MobileHandwrittenToolbar } from '@/widgets/session/MobileHandwrittenToolbar';
import { MobileProgressNoteTabContent } from '@/widgets/session/MobileProgressNoteTabContent';
import { MobileTranscriptTabContent } from '@/widgets/session/MobileTranscriptTabContent';
import { MobileTranscriptToolbar } from '@/widgets/session/MobileTranscriptToolbar';
import { ProgressNoteTabContent } from '@/widgets/session/ProgressNoteTabContent';
import { SessionHeader } from '@/widgets/session/SessionHeader';
import { TabChangeConfirmModal } from '@/widgets/session/TabChangeConfirmModal';
import { TranscriptEditGuideModal } from '@/widgets/session/TranscriptEditGuideModal';
import { TranscriptTabContent } from '@/widgets/session/TranscriptTabContent';
import { TranscriptToolbar } from '@/widgets/session/TranscriptToolbar';

import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useHandwrittenEdit } from '../hooks/useHandwrittenEdit';
import { useProgressNoteCreation } from '../hooks/useProgressNoteCreation';
import { useProgressNoteTabs } from '../hooks/useProgressNoteTabs';
import { useSessionDetail } from '../hooks/useSessionDetail';
import { useTabNavigation } from '../hooks/useTabNavigation';
import { useTitleEdit } from '../hooks/useTitleEdit';
import { useTranscriptCopy } from '../hooks/useTranscriptCopy';
import { useTranscriptEditGuide } from '../hooks/useTranscriptEditGuide';
import { useTranscriptEditSession } from '../hooks/useTranscriptEditSession';
import { useTranscriptSync } from '../hooks/useTranscriptSync';
import type { HandwrittenTranscribe, Transcribe } from '../types';
import {
  getSegments as getSnapshotSegments,
  getSpeakers as getSnapshotSpeakers,
} from '../utils/contentsEditor';
import { getTranscriptData } from '../utils/transcriptParser';
import { shouldEnableTimestampFeatures } from '../utils/transcriptUtils';

import { MobileSessionDetailView } from './MobileSessionDetailView';
import { SessionDetailView } from './SessionDetailView';

export const SessionDetailContainer: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { navigateWithUtm } = useNavigateWithUtm();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAnonymized, setIsAnonymized] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [presignedAudioUrl, setPresignedAudioUrl] = React.useState<
    string | null
  >(null);
  const [hasShownDummyToast, setHasShownDummyToast] = React.useState(false);
  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);
  const contentScrollRef = React.useRef<HTMLDivElement>(null);

  const { data: sessionDetail, isLoading } = useSessionDetail({
    sessionId: sessionId || '',
    enabled: !!sessionId,
  });

  const isDummySession = isDummySessionId(sessionId || '');
  const isReadOnly = isDummySession;

  const { creditInfo } = useCreditInfo();
  const sessionQueryKey = React.useMemo(
    () => sessionQueryKeys.detail(sessionId || '', isDummySession),
    [sessionId, isDummySession]
  );

  const session = sessionDetail?.session;
  const transcribe = sessionDetail?.transcribe;
  const sessionProgressNotes = React.useMemo(
    () => sessionDetail?.progressNotes || [],
    [sessionDetail?.progressNotes]
  );

  const isHandwrittenSession = session?.audio_meta_data === null;

  const handwrittenContent =
    (transcribe as HandwrittenTranscribe)?.contents || '';
  const {
    isEditing: isEditingHandwritten,
    editContent: handwrittenEditContent,
    isSaving: isSavingHandwritten,
    handleEditStart: handleEditHandwrittenStart,
    handleCancel: handleCancelHandwrittenEdit,
    handleSave: handleSaveHandwrittenEdit,
    handleContentChange: setHandwrittenEditContent,
  } = useHandwrittenEdit({
    transcribeId: transcribe?.id,
    initialContent: handwrittenContent,
    sessionId: sessionId || '',
    isReadOnly,
    isDummySession,
  });

  const { templates } = useTemplateList();

  const transcriptLabel = isHandwrittenSession ? (
    '입력된 텍스트'
  ) : (transcribe as Transcribe | null)?.stt_model === 'gemini-3' ? (
    <span className="flex items-center justify-center gap-1.5">
      고급 축어록
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14 5.25C13.9244 5.67356 13.7561 6.07515 13.5071 6.426L8.38367 13.321C8.22123 13.5309 8.0132 13.701 7.77531 13.8186C7.53742 13.9362 7.2759 13.9982 7.01053 13.9998C6.74517 14.0014 6.4829 13.9427 6.24359 13.828C6.00427 13.7134 5.79416 13.5458 5.62917 13.3379L0.480667 6.3C0.261963 5.9831 0.107574 5.62636 0.02625 5.25H3.68258L6.45517 12.4594C6.49736 12.5697 6.57203 12.6646 6.66931 12.7316C6.7666 12.7985 6.88191 12.8343 7 12.8343C7.11809 12.8343 7.2334 12.7985 7.33069 12.7316C7.42797 12.6646 7.50264 12.5697 7.54483 12.4594L10.3174 5.25H14ZM10.325 4.08333H13.9749C13.8862 3.68866 13.7159 3.3169 13.475 2.99192L11.9828 0.977084C11.7667 0.675067 11.4818 0.428897 11.1516 0.258976C10.8214 0.0890556 10.4554 0.000278038 10.0841 1.12792e-06H8.80075L10.325 4.08333ZM6.47967 1.12792e-06L4.92858 4.08333H9.07725L7.55708 1.12792e-06H6.47967ZM3.68083 4.08333L5.23133 1.12792e-06H3.87683C3.50862 -0.000361335 3.14558 0.0866408 2.81753 0.25386C2.48948 0.421079 2.20579 0.663744 1.98975 0.961918L0.547167 2.85308C0.271136 3.21477 0.0837343 3.63612 0 4.08333H3.68083ZM9.06733 5.25H4.93267L7 10.6248L9.06733 5.25Z"
          fill="#44CE4B"
        />
      </svg>
    </span>
  ) : (
    '축어록'
  );

  const {
    activeTab,
    setActiveTab,
    tabItems,
    activeCreatingTab,
    creatingTabs,
    setCreatingTabs,
    requestingTabs,
    setRequestingTabs,
  } = useProgressNoteTabs({
    sessionId: sessionId || '',
    isDummySession,
    isReadOnly,
    progressNotes: sessionProgressNotes,
    templates,
    transcriptLabel,
  });

  const userId = useAuthStore((state) =>
    state.userId ? Number(state.userId) : undefined
  );
  const {
    handleScroll: handleGuideScroll,
    isGuideActive,
    checkIsGuideLevel,
    nextLevel: nextGuideLevel,
    endGuide: endTranscriptEditGuide,
    scrollToTop: scrollTranscriptToTop,
  } = useTranscriptEditGuide({
    activeTab,
    isDummySession,
    userId,
  });

  React.useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const transcriptData = React.useMemo(() => {
    if (!transcribe) return null;
    if (isHandwrittenSession) return null;
    return getTranscriptData(transcribe as Transcribe);
  }, [transcribe, isHandwrittenSession]);

  const rawSegments = React.useMemo(
    () => transcriptData?.segments || [],
    [transcriptData]
  );
  const rawSpeakers = React.useMemo(
    () => transcriptData?.speakers || [],
    [transcriptData]
  );

  const {
    isEditing,
    editingContents,
    handleTextEdit,
    handleEditStart,
    handleCancelEdit,
    handleSaveAllEdits,
    handleSpeakerChange,
    handleAddSegment,
    handleDeleteSegment,
  } = useTranscriptEditSession({
    sessionId: sessionId || '',
    transcribeId: transcribe?.id,
    isDummySession,
    isReadOnly,
    checkIsGuideLevel,
    nextGuideLevel,
    scrollToTop: scrollTranscriptToTop,
  });

  const segments = React.useMemo(
    () =>
      editingContents ? getSnapshotSegments(editingContents) : rawSegments,
    [editingContents, rawSegments]
  );
  const speakers = React.useMemo(
    () =>
      editingContents ? getSnapshotSpeakers(editingContents) : rawSpeakers,
    [editingContents, rawSpeakers]
  );

  const transcribeContents = transcribe?.contents;
  const transcribedText = React.useMemo(() => {
    if (!transcribeContents) return null;
    if (typeof transcribeContents === 'string') {
      return transcribeContents;
    }
    return transcribeContents?.raw_output || null;
  }, [transcribeContents]);

  const enableTimestampFeatures = shouldEnableTimestampFeatures(
    transcribe && 'stt_model' in transcribe ? transcribe.stt_model : null,
    rawSegments
  );

  const {
    handleCopyTranscript: copyTranscriptFromHook,
    handleCopyHandwritten: copyHandwrittenFromHook,
  } = useTranscriptCopy({ isReadOnly });

  const handleCopyTranscript = React.useCallback(() => {
    copyTranscriptFromHook(segments, speakers, isAnonymized);
  }, [copyTranscriptFromHook, segments, speakers, isAnonymized]);

  const handleCopyHandwritten = React.useCallback(() => {
    const content = (transcribe as HandwrittenTranscribe)?.contents || '';
    copyHandwrittenFromHook(content);
  }, [copyHandwrittenFromHook, transcribe]);

  const {
    isTabChangeModalOpen,
    setIsTabChangeModalOpen,
    handleTabChange,
    handleConfirmTabChange,
    handleCancelTabChange,
  } = useTabNavigation({
    activeTab,
    setActiveTab,
    isEditing,
    isEditingHandwritten,
    onCancelEdit: handleCancelEdit,
    onCancelEditHandwritten: handleCancelHandwrittenEdit,
    setCreatingTabs,
    contentScrollRef,
  });

  const handleTitleUpdate = async (newTitle: string) => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 제목을 수정할 수 없습니다.',
        duration: 3000,
      });
      return;
    }
    if (!sessionId) return;

    await updateSessionTitle(sessionId, newTitle);

    const userIdString = useAuthStore.getState().userId;
    const userIdNum = userIdString ? Number(userIdString) : null;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: sessionQueryKey,
      }),
      userIdNum &&
        queryClient.invalidateQueries({
          queryKey: sessionQueryKeys.all(userIdNum),
        }),
    ]);
  };

  const {
    isRegenerating,
    handleCreateProgressNote,
    handleRegenerateProgressNote,
    handleTemplateSelect,
  } = useProgressNoteCreation({
    sessionId: sessionId || '',
    transcribeContents: transcribe?.contents,
    isReadOnly,
    isDummySession,
    remainingCredit: creditInfo?.plan.remaining ?? 0,
    creatingTabs,
    setCreatingTabs,
    requestingTabs,
    setRequestingTabs,
    setActiveTab,
    activeTab,
    progressNotes: sessionProgressNotes,
  });

  const handleSaveProgressNoteSummary = React.useCallback(
    async (noteId: string, summary: string) => {
      await updateProgressNoteSummary(noteId, summary);
      queryClient.setQueryData(
        sessionQueryKey,
        (
          oldData:
            | { progressNotes?: { id: string; summary: string | null }[] }
            | undefined
        ) => {
          if (!oldData?.progressNotes) return oldData;
          return {
            ...oldData,
            progressNotes: oldData.progressNotes.map((pn) =>
              pn.id === noteId ? { ...pn, summary } : pn
            ),
          };
        }
      );
    },
    [queryClient, sessionQueryKey]
  );

  const audioMetadata = session?.audio_meta_data;
  const hasS3Key = !!audioMetadata?.s3_key;
  const audioUrl = presignedAudioUrl || session?.audio_url || null;

  const {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    isLoadingAudio: isLoadingAudioBlob,
    handlePlayPause,
    handleBackward,
    handleForward,
    handleProgressClick,
    handleSeekTo,
    handlePlaybackRateChange,
    handleTimeUpdate,
  } = useAudioPlayer(audioUrl, { disabled: isGuideActive });

  const { currentSegmentIndex, activeSegmentRef } = useTranscriptSync({
    segments,
    currentTime,
    enableSync: enableTimestampFeatures,
    hasUserInteracted,
  });

  // S3 Presigned URL
  React.useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (sessionId && hasS3Key) {
        try {
          const url = await getAudioPresignedUrl(sessionId);
          setPresignedAudioUrl(url);
        } catch (error) {
          console.error('녹음 파일을 불러오는 데 실패했습니다:', error);
          trackError(MixpanelError.AudioPresignedUrlError, error, {
            session_id: sessionId,
          });
        }
      }
    };
    fetchPresignedUrl();
  }, [sessionId, hasS3Key]);

  React.useEffect(() => {
    if (isReadOnly && session && !hasShownDummyToast) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 편집 기능이 비활성화됩니다.',
        duration: 3000,
      });
      setHasShownDummyToast(true);
    }
  }, [isReadOnly, session, hasShownDummyToast, toast]);

  React.useEffect(() => {
    if (!isLoading && !session && sessionId) {
      toast({
        title: '오류',
        description: '상담 데이터를 찾을 수 없습니다.',
        duration: 3000,
      });
      navigateWithUtm(ROUTES.SESSIONS);
    }
  }, [isLoading, session, sessionId, navigateWithUtm, toast]);

  // 편집 상태를 sessionStore에 동기화
  const setIsEditingGlobal = useSessionStore((state) => state.setIsEditing);
  const setCancelEditHandler = useSessionStore(
    (state) => state.setCancelEditHandler
  );

  React.useEffect(() => {
    const currentlyEditing = isEditing || isEditingHandwritten;
    setIsEditingGlobal(currentlyEditing);

    if (currentlyEditing) {
      setCancelEditHandler(() => {
        if (isEditing) handleCancelEdit();
        if (isEditingHandwritten) handleCancelHandwrittenEdit();
      });
    } else {
      setCancelEditHandler(null);
    }

    return () => {
      setIsEditingGlobal(false);
      setCancelEditHandler(null);
    };
  }, [
    isEditing,
    isEditingHandwritten,
    setIsEditingGlobal,
    setCancelEditHandler,
    handleCancelEdit,
    handleCancelHandwrittenEdit,
  ]);

  const handlePlayPauseWithInteraction = React.useCallback(() => {
    setHasUserInteracted(true);
    handlePlayPause();
  }, [handlePlayPause]);

  const handleSeekToWithInteraction = React.useCallback(
    (time: number) => {
      setHasUserInteracted(true);
      handleSeekTo(time);
    },
    [handleSeekTo]
  );

  // 키바인드
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
          handlePlayPauseWithInteraction();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setHasUserInteracted(true);
          handleBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          setHasUserInteracted(true);
          handleForward();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPauseWithInteraction, handleBackward, handleForward]);

  const titleEdit = useTitleEdit({
    title: session?.title || '제목 없음',
    onTitleUpdate: isReadOnly ? undefined : handleTitleUpdate,
  });

  // 상담노트 편집 상태 (ProgressNoteView에서 콜백으로 전달받음)
  const [noteEditState, setNoteEditState] = React.useState<{
    isEditing: boolean;
    hasEdits: boolean;
    isSaving: boolean;
    onSave: () => void;
    onCancel: () => void;
  } | null>(null);

  // 모바일 compact-nav에 표시할 편집 액션 결정
  const mobileEditActions = React.useMemo(() => {
    if (!isMobileView) return undefined;
    if (titleEdit.isEditing) {
      return {
        label: '완료',
        onSave: titleEdit.handleSave,
        onCancel: titleEdit.handleCancel,
        isSaving: titleEdit.isSaving,
      };
    }
    if (isEditing) {
      return {
        label: '편집 완료',
        onSave: handleSaveAllEdits,
        onCancel: handleCancelEdit,
      };
    }
    if (isEditingHandwritten) {
      return {
        label: '편집 완료',
        onSave: handleSaveHandwrittenEdit,
        onCancel: handleCancelHandwrittenEdit,
        isSaving: isSavingHandwritten,
      };
    }
    if (noteEditState?.isEditing) {
      return {
        label: '저장',
        onSave: noteEditState.onSave,
        onCancel: noteEditState.onCancel,
        isSaving: noteEditState.isSaving,
      };
    }
    return undefined;
  }, [
    isMobileView,
    titleEdit,
    isEditing,
    handleSaveAllEdits,
    handleCancelEdit,
    isEditingHandwritten,
    handleSaveHandwrittenEdit,
    handleCancelHandwrittenEdit,
    isSavingHandwritten,
    noteEditState,
  ]);

  // 세션 변경 시 오디오 정지
  const prevSessionIdForAudio = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (prevSessionIdForAudio.current !== sessionId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      handleTimeUpdate(0);
      setHasUserInteracted(false);
      prevSessionIdForAudio.current = sessionId;
    }
  }, [sessionId, handleTimeUpdate, audioRef]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-fg-muted">상담기록을 불러오는 중...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-fg-muted">상담기록을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const audioDuration = audioMetadata?.duration_seconds || duration || 0;

  const sessionHeaderProps = {
    title: session.title || '제목 없음',
    createdAt: session.created_at,
    duration: session.audio_meta_data?.duration_seconds || 0,
    isHandwritten: isHandwrittenSession,
    onTitleUpdate: isReadOnly ? undefined : handleTitleUpdate,
  };

  // --- Build widget slots ---

  // eslint-disable-next-line jsx-a11y/media-has-caption
  const audioElement = <audio ref={audioRef} preload="metadata" />;

  const header = (
    <SessionHeader
      {...sessionHeaderProps}
      variant={isMobileView ? 'compact-nav' : 'full'}
      editActions={mobileEditActions}
    />
  );

  const mobileHeader = isMobileView ? (
    <SessionHeader
      {...sessionHeaderProps}
      variant="meta-only"
      titleEditState={titleEdit}
    />
  ) : null;

  const tab = (
    <Tab
      items={tabItems}
      value={activeTab}
      onValueChange={handleTabChange}
      size="sm"
      fullWidth
      className={isMobileView ? 'px-2' : 'px-8'}
      variant={isMobileView ? 'card-nav' : 'underline'}
    />
  );

  const toolbar =
    activeTab === 'transcript' ? (
      isHandwrittenSession ? (
        isMobileView ? (
          <MobileHandwrittenToolbar
            isReadOnly={isReadOnly}
            isEditing={isEditingHandwritten}
            onEditStart={handleEditHandwrittenStart}
            onCopy={handleCopyHandwritten}
          />
        ) : (
          <HandwrittenToolbar
            isReadOnly={isReadOnly}
            isEditing={isEditingHandwritten}
            isSaving={isSavingHandwritten}
            onEditStart={handleEditHandwrittenStart}
            onSaveEdit={handleSaveHandwrittenEdit}
            onCancelEdit={handleCancelHandwrittenEdit}
            onCopy={handleCopyHandwritten}
          />
        )
      ) : isMobileView ? (
        <MobileTranscriptToolbar
          isReadOnly={isReadOnly}
          isEditing={isEditing}
          isAnonymized={isAnonymized}
          enableTimestampFeatures={enableTimestampFeatures}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          onToggleAnonymized={() => setIsAnonymized(!isAnonymized)}
          onEditStart={handleEditStart}
          onCopy={handleCopyTranscript}
        />
      ) : (
        <TranscriptToolbar
          isReadOnly={isReadOnly}
          isEditing={isEditing}
          isAnonymized={isAnonymized}
          enableTimestampFeatures={enableTimestampFeatures}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          onToggleAnonymized={() => setIsAnonymized(!isAnonymized)}
          onEditStart={handleEditStart}
          onSaveEdit={handleSaveAllEdits}
          onCancelEdit={handleCancelEdit}
          onCopy={handleCopyTranscript}
          checkIsGuideLevel={checkIsGuideLevel}
        />
      )
    ) : null;

  const tabContent =
    activeTab === 'transcript' ? (
      isHandwrittenSession ? (
        isMobileView ? (
          <MobileHandwrittenTabContent
            contentScrollRef={contentScrollRef}
            transcribe={transcribe as HandwrittenTranscribe | null}
            isEditing={isEditingHandwritten}
            editContent={handwrittenEditContent}
            isSaving={isSavingHandwritten}
            onContentChange={setHandwrittenEditContent}
          />
        ) : (
          <HandwrittenTabContent
            contentScrollRef={contentScrollRef}
            transcribe={transcribe as HandwrittenTranscribe | null}
            isEditing={isEditingHandwritten}
            editContent={handwrittenEditContent}
            isSaving={isSavingHandwritten}
            onContentChange={setHandwrittenEditContent}
          />
        )
      ) : isMobileView ? (
        <MobileTranscriptTabContent
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
          onSeekTo={handleSeekToWithInteraction}
          onTextEdit={handleTextEdit}
          onSpeakerChange={handleSpeakerChange}
          onAddSegment={handleAddSegment}
          onDeleteSegment={handleDeleteSegment}
          checkIsGuideLevel={checkIsGuideLevel}
          nextGuideLevel={nextGuideLevel}
          endGuide={endTranscriptEditGuide}
          onGuideScroll={handleGuideScroll}
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
          onSeekTo={handleSeekToWithInteraction}
          onTextEdit={handleTextEdit}
          onSpeakerChange={handleSpeakerChange}
          onAddSegment={handleAddSegment}
          onDeleteSegment={handleDeleteSegment}
          checkIsGuideLevel={checkIsGuideLevel}
          nextGuideLevel={nextGuideLevel}
          endGuide={endTranscriptEditGuide}
          onGuideScroll={handleGuideScroll}
        />
      )
    ) : isMobileView ? (
      <MobileProgressNoteTabContent
        contentScrollRef={contentScrollRef}
        activeTab={activeTab}
        activeCreatingTab={activeCreatingTab}
        creatingTabs={creatingTabs}
        sessionId={session.id}
        transcribedText={transcribedText}
        progressNotes={sessionProgressNotes}
        isReadOnly={isReadOnly}
        isRegenerating={isRegenerating}
        onCreateProgressNote={handleCreateProgressNote}
        onRegenerateProgressNote={handleRegenerateProgressNote}
        onTemplateSelect={handleTemplateSelect}
        onSaveSummary={handleSaveProgressNoteSummary}
        onNoteEditStateChange={setNoteEditState}
      />
    ) : (
      <ProgressNoteTabContent
        contentScrollRef={contentScrollRef}
        activeTab={activeTab}
        activeCreatingTab={activeCreatingTab}
        creatingTabs={creatingTabs}
        sessionId={session.id}
        transcribedText={transcribedText}
        progressNotes={sessionProgressNotes}
        isReadOnly={isReadOnly}
        isRegenerating={isRegenerating}
        onCreateProgressNote={handleCreateProgressNote}
        onRegenerateProgressNote={handleRegenerateProgressNote}
        onTemplateSelect={handleTemplateSelect}
        onSaveSummary={handleSaveProgressNoteSummary}
      />
    );

  const audioPlayer =
    activeTab === 'transcript' && !isHandwrittenSession ? (
      isMobileView ? (
        <MobileAudioPlayer
          audioRef={audioRef}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={audioDuration}
          playbackRate={playbackRate}
          isLoading={isLoadingAudioBlob}
          onPlayPause={handlePlayPauseWithInteraction}
          onBackward={handleBackward}
          onForward={handleForward}
          onProgressClick={handleProgressClick}
          onPlaybackRateChange={handlePlaybackRateChange}
        />
      ) : (
        <AudioPlayer
          audioRef={audioRef}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={audioDuration}
          playbackRate={playbackRate}
          isLoading={isLoadingAudioBlob}
          onPlayPause={handlePlayPauseWithInteraction}
          onBackward={handleBackward}
          onForward={handleForward}
          onProgressClick={handleProgressClick}
          onPlaybackRateChange={handlePlaybackRateChange}
        />
      )
    ) : null;

  const tabChangeModal = (
    <TabChangeConfirmModal
      open={isTabChangeModalOpen}
      onOpenChange={setIsTabChangeModalOpen}
      onCancel={handleCancelTabChange}
      onConfirm={handleConfirmTabChange}
    />
  );

  const editGuideModal = <TranscriptEditGuideModal />;

  const isContentEditing =
    (isEditing || isEditingHandwritten) && activeTab === 'transcript';

  if (isMobileView) {
    return (
      <MobileSessionDetailView
        isContentEditing={isContentEditing}
        audioElement={audioElement}
        header={header}
        mobileHeader={mobileHeader}
        tab={tab}
        toolbar={toolbar}
        tabContent={tabContent}
        audioPlayer={audioPlayer}
        tabChangeModal={tabChangeModal}
        editGuideModal={editGuideModal}
      />
    );
  }

  return (
    <SessionDetailView
      isContentEditing={isContentEditing}
      audioElement={audioElement}
      header={header}
      tab={tab}
      toolbar={toolbar}
      tabContent={tabContent}
      audioPlayer={audioPlayer}
      tabChangeModal={tabChangeModal}
      editGuideModal={editGuideModal}
    />
  );
};

export default SessionDetailContainer;
