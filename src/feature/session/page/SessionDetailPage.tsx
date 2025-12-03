import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import type { TabItem } from '@/components/ui/atoms/Tab';
import { Tab } from '@/components/ui/atoms/Tab';
import { PopUp } from '@/components/ui/composites/PopUp';
import { useToast } from '@/components/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';

import { AudioPlayer } from '../components/AudioPlayer';
import { CreateProgressNoteView } from '../components/CreateProgressNoteView';
import { ProgressNoteView } from '../components/ProgressNoteView';
import { SessionHeader } from '../components/SessionHeader';
import { TranscriptSegment } from '../components/TranscriptSegment';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useSessionDetail } from '../hooks/useSessionDetail';
import { useTranscriptSync } from '../hooks/useTranscriptSync';
import { createProgressNote } from '../services/progressNoteService';
import {
  getAudioPresignedUrl,
  updateMultipleTranscriptSegments,
  updateSessionTitle,
} from '../services/sessionService';
import { getSpeakerDisplayName } from '../utils/speakerUtils';
import { getTranscriptData } from '../utils/transcriptParser';
import { shouldEnableTimestampFeatures } from '../utils/transcriptUtils';

// 초를 [MM:SS] 형식으로 변환
const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
};

export const SessionDetailPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<string>('transcript');
  const [isEditing, setIsEditing] = React.useState(false);
  const [isAnonymized, setIsAnonymized] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [presignedAudioUrl, setPresignedAudioUrl] = React.useState<
    string | null
  >(null);
  const [isCreatingNote, setIsCreatingNote] = React.useState(false);
  const [creatingTemplateId, setCreatingTemplateId] = React.useState<
    number | null
  >(null);
  const [editedSegments, setEditedSegments] = React.useState<
    Record<number, string>
  >({});

  // 세션 상세 조회 (TanStack Query)
  const { data: sessionDetail, isLoading } = useSessionDetail({
    sessionId: sessionId || '',
    enabled: !!sessionId,
  });

  const session = sessionDetail?.session;
  const transcribe = sessionDetail?.transcribe;
  const sessionProgressNotes = sessionDetail?.progressNotes || [];

  // 탭 아이템 동적 생성
  const tabItems: TabItem[] = React.useMemo(() => {
    // transcribe의 stt_model이 "gemini-3"이면 "고급 축어록" + 프리미엄 아이콘
    const transcriptLabel =
      transcribe?.stt_model === 'gemini-3' ? (
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

    const items: TabItem[] = [
      { value: 'transcript', label: transcriptLabel },
      ...sessionProgressNotes.map((note) => ({
        value: note.id,
        label: note.title || '상담 노트',
      })),
    ];

    // 상담 노트 생성 중이거나 create-note 탭이 활성화된 경우 임시 탭 추가
    if (activeTab === 'create-note' || isCreatingNote) {
      items.push({
        value: 'create-note',
        label: isCreatingNote ? '생성 중...' : '상담 노트 만들기',
      });
    }

    items.push({ value: 'add', label: '+' });
    return items;
  }, [sessionProgressNotes, activeTab, isCreatingNote, transcribe?.stt_model]);

  // raw_output 파싱 또는 기존 result 사용
  const transcriptData = getTranscriptData(transcribe || null);

  const segments = transcriptData?.segments || [];
  const speakers = transcriptData?.speakers || [];

  // 타임스탬프 기반 기능 활성화 여부 (gemini-3는 비활성화)
  const enableTimestampFeatures = shouldEnableTimestampFeatures(
    transcribe?.stt_model,
    segments
  );

  const handleTextEdit = (segmentId: number, newText: string) => {
    // 편집된 세그먼트를 메모리에 저장 (실제 저장은 편집 완료 버튼 클릭 시)
    setEditedSegments((prev) => ({
      ...prev,
      [segmentId]: newText,
    }));
  };

  const handleSaveAllEdits = async () => {
    if (!transcribe?.id) {
      toast({
        title: '오류',
        description: '전사 데이터를 찾을 수 없습니다.',
        duration: 3000,
      });
      return;
    }

    if (Object.keys(editedSegments).length === 0) {
      toast({
        title: '알림',
        description: '수정된 내용이 없습니다.',
        duration: 3000,
      });
      setIsEditing(false);
      return;
    }

    try {
      // 모든 편집된 세그먼트를 일괄 업데이트
      await updateMultipleTranscriptSegments(transcribe.id, editedSegments);

      // React Query 캐시 무효화하여 최신 데이터 가져오기
      await queryClient.invalidateQueries({
        queryKey: ['session', sessionId],
      });

      toast({
        title: '저장 완료',
        description: `${Object.keys(editedSegments).length}개의 세그먼트가 업데이트되었습니다.`,
        duration: 3000,
      });

      // 편집 상태 초기화
      setEditedSegments({});
      setIsEditing(false);
    } catch (error) {
      console.error('전사 텍스트 업데이트 실패:', error);
      toast({
        title: '저장 실패',
        description:
          error instanceof Error
            ? error.message
            : '전사 내용 업데이트에 실패했습니다.',
        duration: 3000,
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedSegments({});
    setIsEditing(false);
  };

  const handleCopyTranscript = async () => {
    try {
      // 세그먼트를 포맷팅: [타임스탬프] 또는 번호. 발화자 : 내용
      const formattedText = segments
        .map((segment, index) => {
          // 타임스탬프가 있으면 [MM:SS] 형식, 없으면 시퀀스 번호
          const prefix = enableTimestampFeatures && segment.start !== null
            ? formatTimestamp(segment.start)
            : `${index + 1}.`;

          // {%X%내용%} 또는 {%X%} 형태의 비언어적 표현을 (내용) 로 변환
          // {%A%웃음%} -> (웃음), {%S%} -> (침묵), {%E%강조%} -> (강조)
          let cleanedText = segment.text.replace(
            /\{%[SAEO]%([^%]+)%\}/g,
            '($1)'
          );
          // {%X%} 형태 처리 (내용 없는 경우)
          cleanedText = cleanedText.replace(/\{%S%\}/g, '(침묵)');
          cleanedText = cleanedText.replace(/\{%O%\}/g, '(겹침)');
          cleanedText = cleanedText.replace(/\{%[AE]%\}/g, ''); // A, E는 내용 없으면 제거

          // 익명화 모드일 경우 화자 정보 제외
          if (isAnonymized) {
            return `${prefix} ${cleanedText}`;
          } else {
            const speakerName = getSpeakerDisplayName(
              segment.speaker,
              speakers
            );
            return `${prefix} ${speakerName} : ${cleanedText}`;
          }
        })
        .join('\n');

      await navigator.clipboard.writeText(formattedText);
      toast({
        title: '복사 완료',
        description: '축어록이 클립보드에 복사되었습니다.',
        duration: 3000,
      });
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      toast({
        title: '복사 실패',
        description: '클립보드에 복사할 수 없습니다.',
        duration: 3000,
      });
    }
  };

  const handleTitleUpdate = async (newTitle: string) => {
    if (!sessionId) return;

    try {
      await updateSessionTitle(sessionId, newTitle);

      // 성공 시 세션 상세 정보 다시 조회
      await queryClient.invalidateQueries({
        queryKey: ['session', sessionId],
      });
    } catch (error) {
      console.error('세션 제목 업데이트 실패:', error);
      throw error;
    }
  };

  const handleCreateStart = async (templateId: number) => {
    if (!sessionId || !transcribe?.contents) return;

    const userIdString = useAuthStore.getState().userId;
    if (!userIdString) {
      console.error('인증되지 않은 사용자입니다.');
      return;
    }

    const userId = Number(userIdString);
    if (isNaN(userId)) {
      console.error('유효하지 않은 사용자 ID입니다.');
      return;
    }

    const rawOutput =
      typeof transcribe.contents === 'object' && transcribe.contents !== null
        ? transcribe.contents.raw_output
        : null;

    if (!rawOutput) {
      console.error('전사 내용(raw_output)이 없습니다.');
      return;
    }

    try {
      setIsCreatingNote(true);
      setCreatingTemplateId(templateId);

      const response = await createProgressNote({
        sessionId,
        userId,
        templateId,
        transcribedText: rawOutput,
      });

      // 성공 시 세션 상세 정보 다시 조회
      await queryClient.invalidateQueries({
        queryKey: ['session', sessionId],
      });

      // 새로 생성된 상담 노트 탭으로 이동
      setActiveTab(response.progress_note_id);
    } catch (error) {
      console.error('상담 노트 생성 실패:', error);
      // TODO: 에러 토스트 표시
    } finally {
      setIsCreatingNote(false);
      setCreatingTemplateId(null);
    }
  };

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
  } = useAudioPlayer(audioUrl);

  const { currentSegmentIndex, activeSegmentRef } = useTranscriptSync({
    segments,
    currentTime,
    enableSync: enableTimestampFeatures,
  });

  // S3 Presigned URL 가져오기 (캐싱 없이 sessionId만 의존)
  React.useEffect(() => {
    const fetchPresignedUrl = async () => {
      if (sessionId && hasS3Key) {
        try {
          const url = await getAudioPresignedUrl(sessionId);
          setPresignedAudioUrl(url);
        } catch (error) {
          console.error('[SessionDetailPage] Presigned URL 생성 실패:', error);
        }
      }
    };

    fetchPresignedUrl();
  }, [sessionId, hasS3Key]);

  // 로딩 완료 후 세션이 없으면 sessions 목록으로 이동
  React.useEffect(() => {
    if (!isLoading && !session && sessionId) {
      navigate('/sessions');
    }
  }, [isLoading, session, sessionId, navigate]);

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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-contrast">
        <p className="text-fg-muted">세션을 불러오는 중...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-contrast">
        <p className="text-fg-muted">세션을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const audioDuration = audioMetadata?.duration_seconds || duration || 0;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-contrast">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="metadata" />

      <div className="flex-shrink-0">
        <SessionHeader
          title={session.title || '제목 없음'}
          createdAt={session.created_at}
          onTitleUpdate={handleTitleUpdate}
        />
      </div>

      <div className="flex flex-shrink-0 justify-start px-12 pt-2">
        <Tab
          items={tabItems}
          value={activeTab}
          onValueChange={(value) => {
            if (value === 'add') {
              setActiveTab('create-note');
              return;
            }
            setActiveTab(value);
          }}
          size="md"
          variant="underline"
        />
      </div>

      <div
        className={`mx-6 min-h-0 flex-1 overflow-y-auto rounded-xl border-2 ${isEditing ? 'border-primary-100 bg-primary-50' : 'border-surface-strong bg-surface'}`}
      >
        {activeTab === 'transcript' && (
          <div className="z-10v sticky top-0 mb-4 flex items-center justify-end gap-2 px-8 py-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
                  onClick={handleSaveAllEdits}
                >
                  편집 완료
                </button>
                <button
                  type="button"
                  className="hover:bg-surface-hover rounded-lg bg-surface px-4 py-2 text-sm font-medium text-fg transition-colors"
                  onClick={handleCancelEdit}
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                  onClick={() => setIsEditing(true)}
                  title="편집"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                  onClick={handleCopyTranscript}
                  title="복사"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                <div className="inline-block">
                  <PopUp
                    open={isMenuOpen}
                    onOpenChange={setIsMenuOpen}
                    placement="bottom-left"
                    trigger={
                      <button
                        type="button"
                        className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                        title="메뉴"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                    }
                    content={
                      <div className="w-[200px] space-y-1">
                        <button
                          onClick={() => {
                            setIsAnonymized(!isAnonymized);
                            setIsMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-surface"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-fg-muted"
                          >
                            {isAnonymized ? (
                              <>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </>
                            ) : (
                              <>
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </>
                            )}
                          </svg>
                          <span className="text-sm text-fg">
                            {isAnonymized ? '익명화 해제' : '축어록 익명화'}
                          </span>
                        </button>
                      </div>
                    }
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'transcript' ? (
          <div className={`space-y-4 rounded-lg px-8 pb-6 transition-colors`}>
            {segments.length > 0 ? (
              segments.map((segment, index) => (
                <TranscriptSegment
                  key={`segment-${index}-${segment.id}`}
                  segment={segment}
                  speakers={speakers}
                  isActive={enableTimestampFeatures && index === currentSegmentIndex}
                  isEditable={isEditing}
                  isAnonymized={isAnonymized}
                  sttModel={transcribe?.stt_model}
                  segmentRef={
                    enableTimestampFeatures && index === currentSegmentIndex
                      ? activeSegmentRef
                      : undefined
                  }
                  onClick={handleSeekTo}
                  onTextEdit={handleTextEdit}
                  showTimestamp={enableTimestampFeatures}
                  segmentIndex={index}
                />
              ))
            ) : (
              <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-fg-muted">전사 내용이 없습니다.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'create-note' ? (
          <div className="px-8 py-6">
            <CreateProgressNoteView
              sessionId={sessionId || ''}
              transcribedText={
                transcribe?.contents &&
                typeof transcribe.contents === 'object' &&
                transcribe.contents !== null
                  ? transcribe.contents.raw_output || null
                  : null
              }
              usedTemplateIds={sessionProgressNotes
                .map((note) => note.template_id)
                .filter((id): id is number => id !== null && id !== undefined)}
              isCreating={isCreatingNote}
              creatingTemplateId={creatingTemplateId}
              onCreateStart={handleCreateStart}
            />
          </div>
        ) : (
          <div className="px-8 py-6">
            {(() => {
              const selectedNote = sessionProgressNotes.find(
                (note) => note.id === activeTab
              );
              return selectedNote ? (
                <ProgressNoteView note={selectedNote} />
              ) : (
                <div className="flex min-h-[400px] items-center justify-center">
                  <p className="text-fg-muted">상담 노트를 선택해주세요.</p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div className="flex-shrink-0">
        <AudioPlayer
          audioRef={audioRef}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={audioDuration}
          playbackRate={playbackRate}
          isLoading={isLoadingAudioBlob}
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
