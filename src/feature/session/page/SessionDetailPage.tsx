import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useNavigate, useParams } from 'react-router-dom';

import { Tab } from '@/components/ui/atoms/Tab';
import { Spotlight } from '@/components/ui/composites/Spotlight';
import { useToast } from '@/components/ui/composites/Toast';
import { ScrollIndicator } from '@/feature/onboarding/components/ScrollIndicator';
import {
  AddNoteButtonTooltip,
  NoteClickTooltip,
  NoteCompleteTooltip,
  NoteScrollTooltip,
  TotalCompleteTooltip,
  TranscriptCompleteTooltip,
  TranscriptScrollTooltip,
  TranscriptTabTooltip,
} from '@/feature/onboarding/components/TutorialTooltips';
import { useTutorial } from '@/feature/onboarding/hooks/useTutorial';
import { isDummySessionId } from '@/feature/session/constants/dummySessions';
import { useCreditInfo } from '@/feature/settings/hooks/useCreditInfo';
import { useTemplateList } from '@/feature/template/hooks/useTemplateList';
import { trackError } from '@/lib/mixpanel';
import { useAuthStore } from '@/stores/authStore';

import { AudioPlayer } from '../components/AudioPlayer';
import { HandwrittenTabContent } from '../components/HandwrittenTabContent';
import { HandwrittenToolbar } from '../components/HandwrittenToolbar';
import { ProgressNoteTabContent } from '../components/ProgressNoteTabContent';
import { SessionHeader } from '../components/SessionHeader';
import { TabChangeConfirmModal } from '../components/TabChangeConfirmModal';
import { TranscriptEditGuideModal } from '../components/TranscriptEditGuideModal';
import { TranscriptTabContent } from '../components/TranscriptTabContent';
import { TranscriptToolbar } from '../components/TranscriptToolbar';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useHandwrittenEdit } from '../hooks/useHandwrittenEdit';
import { useProgressNoteCreation } from '../hooks/useProgressNoteCreation';
import { useProgressNoteTabs } from '../hooks/useProgressNoteTabs';
import {
  sessionDetailQueryKey,
  useSessionDetail,
} from '../hooks/useSessionDetail';
import { useSpeakerManagement } from '../hooks/useSpeakerManagement';
import { useTabNavigation } from '../hooks/useTabNavigation';
import { useTranscriptCopy } from '../hooks/useTranscriptCopy';
import { useTranscriptEdit } from '../hooks/useTranscriptEdit';
import { useTranscriptEditGuide } from '../hooks/useTranscriptEditGuide';
import { useTranscriptSync } from '../hooks/useTranscriptSync';
import {
  getAudioPresignedUrl,
  updateSessionTitle,
} from '../services/sessionService';
import type { HandwrittenTranscribe, Transcribe } from '../types';
import { getTranscriptData } from '../utils/transcriptParser';
import { shouldEnableTimestampFeatures } from '../utils/transcriptUtils';

export const SessionDetailPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const {
    checkIsTutorialActive,
    handleTutorialAction,
    nextTutorialStep,
    tutorialStep,
    completeNextStep,
    endTutorial,
  } = useTutorial({
    currentLevel: 1,
  });

  const [isAnonymized, setIsAnonymized] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // 4단계(축어록) 스크롤 감지
  const { ref: transcriptEndRef, inView: isTranscriptEnd } = useInView({
    threshold: 1.0,
  });

  // 7단계(상담노트) 스크롤 감지
  const { ref: noteEndRef, inView: isNoteEnd } = useInView({
    threshold: 1.0,
  });

  // 스크롤 감지 시 4단계 클리어
  React.useEffect(() => {
    if (isTranscriptEnd && checkIsTutorialActive(4)) {
      nextTutorialStep();
    }
  }, [isTranscriptEnd, nextTutorialStep, checkIsTutorialActive]);

  const missionTooltip = React.useMemo(() => {
    if (checkIsTutorialActive(4)) return <TranscriptScrollTooltip />;
    if (checkIsTutorialActive(5)) {
      return <TranscriptCompleteTooltip onConfirm={() => nextTutorialStep()} />;
    }
    if (checkIsTutorialActive(7)) return <NoteScrollTooltip />;
    if (checkIsTutorialActive(8)) {
      return <NoteCompleteTooltip onConfirm={() => nextTutorialStep()} />;
    }
    if (checkIsTutorialActive(10)) {
      return (
        <TotalCompleteTooltip
          onConfirm={async () => {
            const email = useAuthStore.getState().user?.email;
            if (email) {
              await completeNextStep(email);
            }
            endTutorial();
          }}
        />
      );
    }
    return '';
  }, [checkIsTutorialActive, nextTutorialStep, endTutorial, completeNextStep]);
  const [presignedAudioUrl, setPresignedAudioUrl] = React.useState<
    string | null
  >(null);
  const [hasShownDummyToast, setHasShownDummyToast] = React.useState(false);
  // 사용자가 오디오 재생/세그먼트 클릭 등 상호작용을 했는지 여부
  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);
  // 탭 내부 스크롤 컨테이너 ref
  const contentScrollRef = React.useRef<HTMLDivElement>(null);

  // 세션 상세 조회 (TanStack Query)
  const { data: sessionDetail, isLoading } = useSessionDetail({
    sessionId: sessionId || '',
    enabled: !!sessionId,
  });

  const isDummySession = isDummySessionId(sessionId || '');
  const isReadOnly = isDummySession;

  // 크레딧 정보 조회
  const { creditInfo } = useCreditInfo();
  const sessionQueryKey = React.useMemo(
    () => sessionDetailQueryKey(sessionId || '', isDummySession),
    [sessionId, isDummySession]
  );

  const session = sessionDetail?.session;
  const transcribe = sessionDetail?.transcribe;
  const sessionProgressNotes = React.useMemo(
    () => sessionDetail?.progressNotes || [],
    [sessionDetail?.progressNotes]
  );

  // 직접 입력 세션 여부 (audio_meta_data가 없으면 직접 입력)
  const isHandwrittenSession = session?.audio_meta_data === null;

  // 직접 입력 세션 편집 훅
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

  // 템플릿 목록 조회
  const { templates } = useTemplateList();

  // 탭 상태 훅 - 탭 관리, 폴링, 초기 탭 설정을 한 곳에서 처리
  // transcriptLabel 계산 (직접 입력 세션이면 '입력된 텍스트', stt_model에 따라 다름)
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
    tabItems: baseTabItems,
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

  // 훅에서 반환된 탭 아이템 사용
  const tabItems = baseTabItems;

  // 축어록 편집 가이드 훅
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

  // 탭이 바뀌면 스크롤을 최상단으로 초기화
  React.useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // 스크롤 감지 시 7단계 클리어 (상담노트 탭)
  React.useEffect(() => {
    if (isNoteEnd && checkIsTutorialActive(7) && activeTab !== 'transcript') {
      nextTutorialStep();
    }
  }, [isNoteEnd, nextTutorialStep, checkIsTutorialActive, activeTab]);

  // raw_output 파싱 또는 기존 result 사용
  // useMemo로 감싸서 transcribe.contents가 변경되면 재계산
  // HandwrittenTranscribe는 contents가 string이므로 getTranscriptData에 전달하지 않음
  const transcriptData = React.useMemo(() => {
    if (!transcribe) return null;
    // 직접 입력 세션은 segments가 없으므로 null 반환
    if (isHandwrittenSession) return null;
    return getTranscriptData(transcribe as Transcribe);
  }, [transcribe, isHandwrittenSession]);

  const rawSegments = React.useMemo(
    () => transcriptData?.segments || [],
    [transcriptData]
  );
  const speakers = React.useMemo(
    () => transcriptData?.speakers || [],
    [transcriptData]
  );

  // 편집 중인 내용은 각 세그먼트 내부에서 관리하므로 rawSegments를 직접 사용
  const segments = rawSegments;

  // 상담노트 생성에 사용할 전사 텍스트
  const transcribeContents = transcribe?.contents;
  const transcribedText = React.useMemo(() => {
    if (!transcribeContents) return null;
    if (typeof transcribeContents === 'string') {
      return transcribeContents; // 직접 입력 세션
    }
    return transcribeContents?.raw_output || null; // 오디오 세션
  }, [transcribeContents]);

  // 타임스탬프 기반 기능 활성화 여부 (gemini-3는 비활성화, 직접 입력 세션도 비활성화)
  const enableTimestampFeatures = shouldEnableTimestampFeatures(
    transcribe && 'stt_model' in transcribe ? transcribe.stt_model : null,
    rawSegments
  );

  // 축어록/직접 입력 복사 훅
  const {
    handleCopyTranscript: copyTranscriptFromHook,
    handleCopyHandwritten: copyHandwrittenFromHook,
  } = useTranscriptCopy({ isReadOnly });

  // 복사 핸들러 래퍼 (클릭 이벤트용)
  const handleCopyTranscript = React.useCallback(() => {
    copyTranscriptFromHook(segments, speakers, isAnonymized);
  }, [copyTranscriptFromHook, segments, speakers, isAnonymized]);

  const handleCopyHandwritten = React.useCallback(() => {
    const content = (transcribe as HandwrittenTranscribe)?.contents || '';
    copyHandwrittenFromHook(content);
  }, [copyHandwrittenFromHook, transcribe]);

  // 축어록 편집 훅
  const {
    isEditing,
    handleTextEdit,
    handleEditStart,
    handleCancelEdit,
    handleSaveAllEdits,
  } = useTranscriptEdit({
    sessionId: sessionId || '',
    transcribeId: transcribe?.id,
    isDummySession,
    isReadOnly,
    checkIsGuideLevel,
    nextGuideLevel,
    scrollToTop: scrollTranscriptToTop,
  });

  // 화자 변경 훅
  const { handleSpeakerChange } = useSpeakerManagement({
    sessionId: sessionId || '',
    transcribeId: transcribe?.id,
    isDummySession,
    isReadOnly,
  });

  // 탭 네비게이션 훅
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
    onCancelEdit: handleCancelEdit,
    setCreatingTabs,
    contentScrollRef,
    checkIsTutorialActive,
    nextTutorialStep,
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
    const userId = userIdString ? Number(userIdString) : null;

    // 성공 시 세션 상세 정보 및 세션 목록 다시 조회
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: sessionQueryKey,
      }),
      // 세션 목록도 invalidate하여 SessionRecordCard와 SessionSideList 업데이트
      userId &&
        queryClient.invalidateQueries({
          queryKey: ['sessions', userId],
        }),
    ]);
  };

  // 상담노트 생성/재생성 훅
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

  // S3 Presigned URL 가져오기 (캐싱 없이 sessionId만 의존)
  React.useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (sessionId && hasS3Key) {
        try {
          const url = await getAudioPresignedUrl(sessionId);
          setPresignedAudioUrl(url);
        } catch (error) {
          console.error('녹음 파일을 불러오는 데 실패했습니다:', error);
          trackError('audio_presigned_url_error', error, {
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

  // 로딩 완료 후 세션이 없으면 sessions 목록으로 이동
  React.useEffect(() => {
    if (!isLoading && !session && sessionId) {
      toast({
        title: '오류',
        description: '상담 데이터를 찾을 수 없습니다.',
        duration: 3000,
      });
      navigate('/sessions');
    }
  }, [isLoading, session, sessionId, navigate]);

  // 오디오 재생/일시정지 시 상호작용 상태 활성화
  const handlePlayPauseWithInteraction = React.useCallback(() => {
    setHasUserInteracted(true);
    handlePlayPause();
  }, [handlePlayPause]);

  // 세그먼트 클릭 시 상호작용 상태 활성화
  const handleSeekToWithInteraction = React.useCallback(
    (time: number) => {
      setHasUserInteracted(true);
      handleSeekTo(time);
    },
    [handleSeekTo]
  );

  // 오디오 플레이어 키바인드
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

  // 세션 변경 시 오디오 정지 및 상태 초기화
  const prevSessionIdForAudio = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (prevSessionIdForAudio.current !== sessionId) {
      // 재생 중이면 일시정지 (오디오 URL 변경 전에 정지)
      if (audioRef.current) {
        audioRef.current.pause();
      }
      handleTimeUpdate(0);
      setHasUserInteracted(false);
      prevSessionIdForAudio.current = sessionId;
    }
  }, [sessionId, handleTimeUpdate, audioRef]);

  // 초기 탭 설정은 useProgressNoteTabs 훅에서 처리됨

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

  return (
    <div className="mx-auto flex h-full w-full max-w-[min(100vw-535px,1332px)] flex-col overflow-hidden">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="metadata" />

      <div className="flex-shrink-0">
        <SessionHeader
          title={session.title || '제목 없음'}
          createdAt={session.created_at}
          duration={session.audio_meta_data?.duration_seconds || 0}
          onTitleUpdate={isReadOnly ? undefined : handleTitleUpdate}
        />
      </div>

      <div className="flex flex-shrink-0 select-none justify-start px-6 pt-2">
        <Spotlight
          isActive={
            checkIsTutorialActive(3) ||
            checkIsTutorialActive(6) ||
            checkIsTutorialActive(9)
          }
          tooltip={
            checkIsTutorialActive(3) ? (
              <TranscriptTabTooltip />
            ) : checkIsTutorialActive(6) ? (
              <NoteClickTooltip />
            ) : (
              <AddNoteButtonTooltip />
            )
          }
          tooltipPosition="bottom"
          selector={
            checkIsTutorialActive(9)
              ? '[data-value="add"]'
              : checkIsTutorialActive(6)
                ? '[data-value^="dummy_progress_note"]'
                : '[data-value="transcript"]'
          }
          onClose={() => endTutorial()}
        >
          <Tab
            items={tabItems}
            value={activeTab}
            onValueChange={(val) => {
              if (
                checkIsTutorialActive(3) ||
                checkIsTutorialActive(6) ||
                checkIsTutorialActive(9)
              ) {
                handleTutorialAction(
                  () => handleTabChange(val),
                  checkIsTutorialActive(3)
                    ? 3
                    : checkIsTutorialActive(6)
                      ? 6
                      : 9
                );
              } else {
                handleTabChange(val);
              }
            }}
            size="sm"
            fullWidth
            className="px-8"
            variant="underline"
          />
        </Spotlight>
      </div>

      {/* 탭 콘텐츠 */}
      <div
        className={`relative mx-6 mb-2 min-h-0 flex-1 rounded-xl border-2 ${isEditing && activeTab === 'transcript' ? 'border-primary-100 bg-primary-50' : 'border-surface-strong bg-surface'}`}
      >
        <ScrollIndicator
          className="bottom-0 right-1/2 translate-x-1/2"
          isVisible={checkIsTutorialActive(7)}
        />
        <ScrollIndicator
          className="bottom-0 right-1/2 translate-x-1/2"
          isVisible={checkIsTutorialActive(4)}
        />
        {/* 직접 입력 세션 버튼 영역 */}
        {activeTab === 'transcript' && isHandwrittenSession && (
          <HandwrittenToolbar
            isReadOnly={isReadOnly}
            isEditing={isEditingHandwritten}
            isSaving={isSavingHandwritten}
            onEditStart={handleEditHandwrittenStart}
            onSaveEdit={handleSaveHandwrittenEdit}
            onCancelEdit={handleCancelHandwrittenEdit}
            onCopy={handleCopyHandwritten}
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
            setIsMenuOpen={setIsMenuOpen}
            onToggleAnonymized={() => setIsAnonymized(!isAnonymized)}
            onEditStart={handleEditStart}
            onSaveEdit={handleSaveAllEdits}
            onCancelEdit={handleCancelEdit}
            onCopy={handleCopyTranscript}
            checkIsGuideLevel={checkIsGuideLevel}
          />
        )}

        {/* 탭 콘텐츠 Spotlight: 4단계(스크롤), 5단계(완료 버튼) */}
        <Spotlight
          isActive={
            checkIsTutorialActive(4) ||
            checkIsTutorialActive(5) ||
            checkIsTutorialActive(7) ||
            checkIsTutorialActive(8) ||
            checkIsTutorialActive(10)
          }
          tooltip={missionTooltip}
          tooltipPosition="left"
          onClose={() => endTutorial()}
        >
          {activeTab === 'transcript' ? (
            isHandwrittenSession ? (
              <HandwrittenTabContent
                contentScrollRef={contentScrollRef}
                transcribe={transcribe as HandwrittenTranscribe | null}
                isEditing={isEditingHandwritten}
                editContent={handwrittenEditContent}
                isSaving={isSavingHandwritten}
                onContentChange={setHandwrittenEditContent}
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
                transcriptEndRef={transcriptEndRef}
                onSeekTo={handleSeekToWithInteraction}
                onTextEdit={handleTextEdit}
                onSpeakerChange={handleSpeakerChange}
                checkIsGuideLevel={checkIsGuideLevel}
                nextGuideLevel={nextGuideLevel}
                endGuide={endTranscriptEditGuide}
                onGuideScroll={handleGuideScroll}
                tutorialStep={tutorialStep}
              />
            )
          ) : (
            <ProgressNoteTabContent
              contentScrollRef={contentScrollRef}
              activeTab={activeTab}
              activeCreatingTab={activeCreatingTab}
              creatingTabs={creatingTabs}
              sessionId={sessionId || ''}
              transcribedText={transcribedText}
              progressNotes={sessionProgressNotes}
              isReadOnly={isReadOnly}
              isRegenerating={isRegenerating}
              onCreateProgressNote={handleCreateProgressNote}
              onRegenerateProgressNote={handleRegenerateProgressNote}
              onTemplateSelect={handleTemplateSelect}
              noteEndRef={noteEndRef}
              tutorialStep={tutorialStep}
            />
          )}
        </Spotlight>
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
            onPlayPause={handlePlayPauseWithInteraction}
            onBackward={handleBackward}
            onForward={handleForward}
            onProgressClick={handleProgressClick}
            onPlaybackRateChange={handlePlaybackRateChange}
          />
        </div>
      )}

      {/* 탭 변경 확인 모달 */}
      <TabChangeConfirmModal
        open={isTabChangeModalOpen}
        onOpenChange={setIsTabChangeModalOpen}
        onCancel={handleCancelTabChange}
        onConfirm={handleConfirmTabChange}
      />

      {/* 축어록 편집 기능 가이드 모달 */}
      <TranscriptEditGuideModal />
    </div>
  );
};

export default SessionDetailPage;
