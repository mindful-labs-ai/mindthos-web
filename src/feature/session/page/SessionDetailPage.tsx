import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useNavigate, useParams } from 'react-router-dom';

import { Title } from '@/components/ui';
import { Badge } from '@/components/ui/atoms/Badge';
import { Tab } from '@/components/ui/atoms/Tab';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';
import { PopUp } from '@/components/ui/composites/PopUp';
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
import { trackError, trackEvent } from '@/lib/mixpanel';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';

import { AudioPlayer } from '../components/AudioPlayer';
import { CreateProgressNoteView } from '../components/CreateProgressNoteView';
import { ProgressNoteView } from '../components/ProgressNoteView';
import { SessionHeader } from '../components/SessionHeader';
import { TranscriptSegment } from '../components/TranscriptSegment';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useProgressNoteTabs } from '../hooks/useProgressNoteTabs';
import {
  sessionDetailQueryKey,
  useSessionDetail,
} from '../hooks/useSessionDetail';
import { useTranscriptSync } from '../hooks/useTranscriptSync';
import { addProgressNote } from '../services/progressNoteService';
import {
  getAudioPresignedUrl,
  updateMultipleTranscriptSegments,
  updateSessionTitle,
  updateTranscriptSegments,
} from '../services/sessionService';
import type {
  ProgressNote,
  Session,
  Speaker,
  Transcribe,
  TranscribeSegment,
} from '../types';
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

  const [isEditing, setIsEditing] = React.useState(false);
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
  const [editedSegments, setEditedSegments] = React.useState<
    Record<number, string>
  >({});
  const [isTabChangeModalOpen, setIsTabChangeModalOpen] = React.useState(false);
  const [pendingTabValue, setPendingTabValue] = React.useState<string | null>(
    null
  );
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
  const PROGRESS_NOTE_CREDIT = 10; // 상담노트 생성 크레딧
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

  // 템플릿 목록 조회
  const { templates } = useTemplateList();

  // 탭 상태 훅 - 탭 관리, 폴링, 초기 탭 설정을 한 곳에서 처리
  // transcriptLabel 계산 (stt_model에 따라)
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
  const transcriptData = React.useMemo(() => {
    return getTranscriptData(transcribe || null);
  }, [transcribe]);

  const rawSegments = React.useMemo(
    () => transcriptData?.segments || [],
    [transcriptData]
  );
  const speakers = React.useMemo(
    () => transcriptData?.speakers || [],
    [transcriptData]
  );

  // 편집 중인 내용을 반영한 segments (편집 중에도 UI에 즉시 반영)
  const segments = React.useMemo(() => {
    if (Object.keys(editedSegments).length === 0) {
      return rawSegments;
    }
    return rawSegments.map((seg) => {
      if (seg.id in editedSegments) {
        return { ...seg, text: editedSegments[seg.id] };
      }
      return seg;
    });
  }, [rawSegments, editedSegments]);

  // 타임스탬프 기반 기능 활성화 여부 (gemini-3는 비활성화)
  const enableTimestampFeatures = shouldEnableTimestampFeatures(
    transcribe?.stt_model,
    rawSegments
  );

  const handleTextEdit = (segmentId: number, newText: string) => {
    if (isReadOnly) return;
    // 편집된 세그먼트를 메모리에 저장 (실제 저장은 편집 완료 버튼 클릭 시)
    setEditedSegments((prev) => ({
      ...prev,
      [segmentId]: newText,
    }));
  };

  const handleSaveAllEdits = async () => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 편집할 수 없습니다.',
        duration: 3000,
      });
      return;
    }
    if (!transcribe?.id || !sessionId) {
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
      // Optimistic update: 캐시를 즉시 업데이트
      queryClient.setQueryData(
        sessionQueryKey, // 수정 가능 = 더미 아님
        (
          oldData:
            | {
                session: Session;
                transcribe: Transcribe | null;
                progressNotes: ProgressNote[];
              }
            | undefined
        ) => {
          if (!oldData || !oldData.transcribe) return oldData;

          const transcribe = oldData.transcribe;
          const contents = transcribe.contents;

          if (!contents) return oldData;

          let updatedContents;

          // New format: { stt_model, segments, ... }
          if ('segments' in contents && Array.isArray(contents.segments)) {
            const updatedSegments = contents.segments.map(
              (seg: TranscribeSegment) => {
                // seg.id를 직접 사용 (index + 1이 아님)
                if (seg.id in editedSegments) {
                  return { ...seg, text: editedSegments[seg.id] };
                }
                return seg;
              }
            );

            updatedContents = {
              ...contents,
              segments: updatedSegments,
            };
          }
          // Legacy format: { result: { segments, speakers } }
          else if ('result' in contents && contents.result?.segments) {
            const updatedSegments = contents.result.segments.map(
              (seg: TranscribeSegment) => {
                // seg.id를 직접 사용 (index + 1이 아님)
                if (seg.id in editedSegments) {
                  return { ...seg, text: editedSegments[seg.id] };
                }
                return seg;
              }
            );

            updatedContents = {
              ...contents,
              result: {
                ...contents.result,
                segments: updatedSegments,
              },
            };
          } else {
            return oldData;
          }

          return {
            ...oldData,
            transcribe: {
              ...transcribe,
              contents: updatedContents,
            },
          };
        }
      );

      // 편집 상태 초기화 (UI 즉시 반영)
      setEditedSegments({});
      setIsEditing(false);

      // 백그라운드에서 서버 업데이트
      await updateMultipleTranscriptSegments(transcribe.id, editedSegments);

      trackEvent('transcript_edit_complete', {
        session_id: sessionId,
        edited_segments_count: Object.keys(editedSegments).length,
      });

      toast({
        title: '저장 완료',
        description: '축어록이 수정되었습니다.',
        duration: 3000,
      });
    } catch (error) {
      // 실패 시 캐시 무효화하여 서버 데이터로 되돌림
      await queryClient.invalidateQueries({
        queryKey: sessionQueryKey,
      });

      trackError('transcript_save_error', error, {
        session_id: sessionId,
        transcribe_id: transcribe?.id,
      });
      toast({
        title: '저장 실패',
        description: '축어록 저장에 실패했습니다. 다시 시도해주세요.',
        duration: 3000,
      });
    }
  };

  const handleEditStart = () => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 편집할 수 없습니다.',
        duration: 3000,
      });
      return;
    }
    trackEvent('transcript_edit_start', { session_id: sessionId });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    trackEvent('transcript_edit_cancel', { session_id: sessionId });
    setEditedSegments({});
    setIsEditing(false);
  };

  const handleSpeakerChange = async (updates: {
    speakerChanges: Record<number, number>;
    speakerDefinitions: Speaker[];
  }) => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 편집할 수 없습니다.',
        duration: 3000,
      });
      return;
    }

    if (!transcribe?.id || !sessionId) {
      toast({
        title: '오류',
        description: '전사 데이터를 찾을 수 없습니다.',
        duration: 3000,
      });
      return;
    }

    try {
      // Optimistic update: 캐시를 즉시 업데이트
      queryClient.setQueryData(
        sessionQueryKey, // 수정 가능 = 더미 아님
        (
          oldData:
            | {
                session: Session;
                transcribe: Transcribe | null;
                progressNotes: ProgressNote[];
              }
            | undefined
        ) => {
          if (!oldData || !oldData.transcribe) return oldData;

          const transcribe = oldData.transcribe;
          const contents = transcribe.contents;

          if (!contents) return oldData;

          // 세그먼트의 speaker 업데이트
          let updatedContents;

          if ('segments' in contents && Array.isArray(contents.segments)) {
            // New format
            const updatedSegments = contents.segments.map(
              (seg: TranscribeSegment) => {
                if (updates.speakerChanges[seg.id]) {
                  return { ...seg, speaker: updates.speakerChanges[seg.id] };
                }
                return seg;
              }
            );

            updatedContents = {
              ...contents,
              segments: updatedSegments,
              speakers: updates.speakerDefinitions,
            };
          } else if ('result' in contents && contents.result?.segments) {
            // Legacy format
            const updatedSegments = contents.result.segments.map(
              (seg: TranscribeSegment) => {
                if (updates.speakerChanges[seg.id]) {
                  return { ...seg, speaker: updates.speakerChanges[seg.id] };
                }
                return seg;
              }
            );

            updatedContents = {
              ...contents,
              result: {
                ...contents.result,
                segments: updatedSegments,
                speakers: updates.speakerDefinitions,
              },
            };
          } else {
            return oldData;
          }

          return {
            ...oldData,
            transcribe: {
              ...transcribe,
              contents: updatedContents,
            },
          };
        }
      );

      // 백그라운드에서 서버 업데이트

      await updateTranscriptSegments(transcribe.id, {
        speakerUpdates: updates.speakerChanges,
        speakerDefinitions: updates.speakerDefinitions,
      });

      // API 성공 후 캐시 무효화하여 DB의 최신 데이터 가져오기

      await queryClient.invalidateQueries({
        queryKey: sessionQueryKey,
      });

      toast({
        title: '화자 변경 완료',
        description: '축어록이 수정되었습니다.',
        duration: 3000,
      });
    } catch (error) {
      // 실패 시 캐시 무효화하여 서버 데이터로 되돌림
      await queryClient.invalidateQueries({
        queryKey: sessionQueryKey,
      });

      trackError('speaker_change_error', error, {
        session_id: sessionId,
        transcribe_id: transcribe?.id,
      });
      toast({
        title: '화자 변경 실패',
        description: '화자 변경에 실패했습니다. 다시 시도해주세요.',
        duration: 3000,
      });
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = React.useCallback(
    (value: string) => {
      // 편집 중이고, 축어록 탭에서 다른 탭으로 변경하려는 경우
      if (isEditing && activeTab === 'transcript') {
        setPendingTabValue(value);
        setIsTabChangeModalOpen(true);
        return;
      }

      // 'add' 탭 처리 - 새로운 생성 탭 추가
      if (value === 'add') {
        const newTabId = `create-note-${Date.now()}`;
        setCreatingTabs((prev) => ({
          ...prev,
          [newTabId]: null,
        }));
        setActiveTab(newTabId);
        // 스크롤 초기화
        contentScrollRef.current?.scrollTo({ top: 0 });
        return;
      }

      setActiveTab(value);
      // 스크롤 초기화 (즉시 강제 리셋)
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = 0;
      }

      // 튜토리얼 9단계: 상담 노트 생성 탭 클릭 시 다음 단계로
      if (value === 'add' && checkIsTutorialActive(9)) {
        nextTutorialStep();
      }
    },
    [activeTab, isEditing, checkIsTutorialActive, nextTutorialStep]
  );

  // 탭 변경 확인
  const handleConfirmTabChange = () => {
    setIsEditing(false);
    setEditedSegments({});
    if (pendingTabValue) {
      if (pendingTabValue === 'add') {
        const newTabId = `create-note-${Date.now()}`;
        setCreatingTabs((prev) => ({
          ...prev,
          [newTabId]: null,
        }));
        setActiveTab(newTabId);
      } else {
        setActiveTab(pendingTabValue);
      }
      // 스크롤 초기화 (즉시 강제 리셋)
      if (contentScrollRef.current) {
        contentScrollRef.current.scrollTop = 0;
      }
    }
    setIsTabChangeModalOpen(false);
    setPendingTabValue(null);
  };

  // 탭 변경 취소
  const handleCancelTabChange = () => {
    setIsTabChangeModalOpen(false);
    setPendingTabValue(null);
  };

  const handleCopyTranscript = async () => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 복사 기능이 비활성화됩니다.',
        duration: 3000,
      });
      return;
    }
    try {
      // 세그먼트를 포맷팅: [타임스탬프] 또는 번호. 발화자 : 내용
      const formattedText = segments
        .map((segment, index) => {
          // 타임스탬프가 있으면 [MM:SS] 형식, 없으면 시퀀스 번호
          const prefix =
            enableTimestampFeatures && segment.start !== null
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
    } catch {
      toast({
        title: '복사 실패',
        description: '클립보드에 복사할 수 없습니다.',
        duration: 3000,
      });
    }
  };

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

  // 현재 활성 생성 탭의 템플릿 선택 핸들러
  const handleTemplateSelect = (templateId: number | null) => {
    if (!activeTab.startsWith('create-note-')) return;
    if (!(activeTab in creatingTabs)) return; // 템플릿 선택 탭만 처리
    setCreatingTabs((prev) => ({
      ...prev,
      [activeTab]: templateId,
    }));
  };

  const handleCreateProgressNote = async () => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 상담 노트를 작성할 수 없습니다.',
        duration: 3000,
      });
      return;
    }

    // 크레딧 체크
    const remainingCredit = creditInfo?.plan.remaining ?? 0;
    if (remainingCredit < PROGRESS_NOTE_CREDIT) {
      toast({
        title: '크레딧 부족',
        description: `상담노트 작성에 ${PROGRESS_NOTE_CREDIT} 크레딧이 필요합니다. (보유: ${remainingCredit})`,
        duration: 5000,
      });
      return;
    }

    // 현재 활성 탭이 템플릿 선택 중인 탭인지 확인
    if (!(activeTab in creatingTabs)) return;

    // 이미 요청 중인 탭이면 무시 (중복 클릭 방지)
    if (activeTab in requestingTabs) return;

    const templateId = creatingTabs[activeTab];
    if (!sessionId || !transcribe?.contents || !templateId) return;

    const userIdString = useAuthStore.getState().userId;
    if (!userIdString) {
      return;
    }

    const userId = Number(userIdString);
    if (isNaN(userId)) {
      return;
    }

    // 1. 즉시 creatingTabs에서 제거하고 requestingTabs에 추가 (대기 UI 표시)
    const currentTabId = activeTab;
    setCreatingTabs((prev) => {
      const updated = { ...prev };
      delete updated[currentTabId];
      return updated;
    });
    setRequestingTabs((prev) => ({
      ...prev,
      [currentTabId]: { templateId, progressNoteId: null },
    }));

    try {
      // 백그라운드로 상담노트 추가
      const response = await addProgressNote({
        sessionId,
        userId,
        templateId,
      });

      // 2. API 응답 후 progressNoteId 업데이트 (탭은 유지)
      // DB 폴링에서 해당 노트를 감지하면 requestingTabs에서 자동 제거됨
      setRequestingTabs((prev) => ({
        ...prev,
        [currentTabId]: {
          templateId,
          progressNoteId: response.progress_note_id,
        },
      }));

      toast({
        title: '상담노트 작성 시작',
        description: '상담노트를 작성하고 있습니다.',
        duration: 3000,
      });
    } catch (error) {
      // 실패 시 requestingTabs에서 제거하고 다시 creatingTabs로 복원
      setRequestingTabs((prev) => {
        const updated = { ...prev };
        delete updated[currentTabId];
        return updated;
      });
      setCreatingTabs((prev) => ({
        ...prev,
        [currentTabId]: templateId,
      }));
      // 원래 탭으로 돌아가기
      setActiveTab(currentTabId);

      console.error('상담노트 작성 에러 : ', error);
      trackError('progress_note_create_error', error, {
        session_id: sessionId,
        template_id: templateId,
      });

      toast({
        title: '상담노트 작성 실패',
        description: '상담 노트 작성에 실패했습니다. 다시 시도해주세요.',
        duration: 5000,
      });
    }
  };

  // 상담노트 재생성 핸들러
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const handleRegenerateProgressNote = async (templateId: number) => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 상담 노트를 작성할 수 없습니다.',
        duration: 3000,
      });
      return;
    }

    // 크레딧 체크
    const remainingCredit = creditInfo?.plan.remaining ?? 0;
    if (remainingCredit < PROGRESS_NOTE_CREDIT) {
      toast({
        title: '크레딧 부족',
        description: `상담노트 작성에 ${PROGRESS_NOTE_CREDIT} 크레딧이 필요합니다. (보유: ${remainingCredit})`,
        duration: 5000,
      });
      return;
    }

    if (!sessionId || !transcribe?.contents) return;

    const userIdString = useAuthStore.getState().userId;
    if (!userIdString) return;

    const userId = Number(userIdString);
    if (isNaN(userId)) return;

    setIsRegenerating(true);

    // 재생성용 임시 탭 ID 생성
    const regenerateTabId = `regenerate-${Date.now()}`;

    // requestingTabs에 추가하여 즉시 처리중 UI 표시
    setRequestingTabs((prev) => ({
      ...prev,
      [regenerateTabId]: {
        templateId,
        progressNoteId: null,
      },
    }));

    // 재생성 탭으로 즉시 전환
    setActiveTab(regenerateTabId);

    try {
      const result = await addProgressNote({
        sessionId,
        userId,
        templateId,
      });

      toast({
        title: '상담노트 재생성 시작',
        description: '상담노트를 다시 작성하고 있습니다.',
        duration: 3000,
      });

      // requestingTabs에 progressNoteId 업데이트
      setRequestingTabs((prev) => ({
        ...prev,
        [regenerateTabId]: {
          ...prev[regenerateTabId],
          progressNoteId: result.progress_note_id,
        },
      }));

      // 세션 데이터 갱신
      await queryClient.invalidateQueries({
        queryKey: sessionDetailQueryKey(sessionId, isDummySession),
      });
    } catch (error) {
      // 실패 시 requestingTabs에서 제거
      setRequestingTabs((prev) => {
        const updated = { ...prev };
        delete updated[regenerateTabId];
        return updated;
      });

      // 이전 탭으로 돌아가기 (현재 탭이 재생성 탭이면)
      if (activeTab === regenerateTabId) {
        // 해당 template_id의 기존 완료된 노트로 전환
        const existingNote = sessionProgressNotes.find(
          (n) =>
            n.template_id === templateId && n.processing_status === 'succeeded'
        );
        if (existingNote) {
          setActiveTab(existingNote.id);
        } else {
          setActiveTab('transcript');
        }
      }
      console.error('상담노트 재생성 에러:', error);
      trackError('progress_note_regenerate_error', error, {
        session_id: sessionId,
        template_id: templateId,
      });

      toast({
        title: '상담노트 재생성 실패',
        description: '상담 노트 재생성에 실패했습니다. 다시 시도해주세요.',
        duration: 5000,
      });
    } finally {
      setIsRegenerating(false);
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
    handleTimeUpdate,
  } = useAudioPlayer(audioUrl);

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
        {activeTab === 'transcript' && (
          <div className="absolute inset-x-0 right-4 top-0 flex select-none justify-end rounded-lg bg-gradient-to-t from-transparent to-slate-50">
            <div className="flex select-none items-center gap-2 overflow-hidden px-2 pt-2">
              {isReadOnly ? (
                <Badge tone="warning" variant="soft" size="sm">
                  예시 - 읽기 전용
                </Badge>
              ) : isEditing ? (
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
                    className="mx-1 rounded-md border border-border bg-surface px-2.5 py-0.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                    onClick={handleEditStart}
                    title="편집"
                  >
                    편집
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                    onClick={handleCopyTranscript}
                    title="복사"
                  >
                    <svg
                      width="20"
                      height="24"
                      viewBox="0 0 20 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11 4C11 4.26522 11.1054 4.51957 11.2929 4.70711C11.4804 4.89464 11.7348 5 12 5H15.966C15.8924 4.35068 15.6074 3.74354 15.155 3.272L12.871 0.913C12.3714 0.406548 11.7085 0.0933745 11 0.029V4ZM9 4V0H5C3.67441 0.00158786 2.40356 0.528882 1.46622 1.46622C0.528882 2.40356 0.00158786 3.67441 0 5V15C0.00158786 16.3256 0.528882 17.5964 1.46622 18.5338C2.40356 19.4711 3.67441 19.9984 5 20H11C12.3256 19.9984 13.5964 19.4711 14.5338 18.5338C15.4711 17.5964 15.9984 16.3256 16 15V7H12C11.2044 7 10.4413 6.68393 9.87868 6.12132C9.31607 5.55871 9 4.79565 9 4ZM15 24H6C5.73478 24 5.48043 23.8946 5.29289 23.7071C5.10536 23.5196 5 23.2652 5 23C5 22.7348 5.10536 22.4804 5.29289 22.2929C5.48043 22.1054 5.73478 22 6 22H15C15.7956 22 16.5587 21.6839 17.1213 21.1213C17.6839 20.5587 18 19.7956 18 19V8C18 7.73478 18.1054 7.48043 18.2929 7.29289C18.4804 7.10536 18.7348 7 19 7C19.2652 7 19.5196 7.10536 19.7071 7.29289C19.8946 7.48043 20 7.73478 20 8V19C19.9984 20.3256 19.4711 21.5964 18.5338 22.5338C17.5964 23.4711 16.3256 23.9984 15 24Z"
                        fill="#BABAC0"
                      />
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
                              {isAnonymized
                                ? '참석자 가리기 해제'
                                : '참석자 가리기'}
                            </span>
                          </button>
                          {/* 자동 스크롤 토글 (타임스탬프 기능이 활성화된 경우에만 표시) */}
                          {enableTimestampFeatures && (
                            <button
                              onClick={() => {
                                const store = useSessionStore.getState();
                                store.setAutoScrollEnabled(
                                  !store.autoScrollEnabled
                                );
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
                                {useSessionStore.getState()
                                  .autoScrollEnabled ? (
                                  <>
                                    <path d="M12 5v14" />
                                    <path d="M19 12l-7 7-7-7" />
                                  </>
                                ) : (
                                  <>
                                    <path d="M12 5v14" />
                                    <path d="M19 12l-7 7-7-7" />
                                    <line x1="4" y1="4" x2="20" y2="20" />
                                  </>
                                )}
                              </svg>
                              <span className="text-sm text-fg">
                                {useSessionStore.getState().autoScrollEnabled
                                  ? '자동 스크롤 끄기'
                                  : '자동 스크롤 켜기'}
                              </span>
                            </button>
                          )}
                        </div>
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
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
            <div
              key="transcript-container"
              ref={contentScrollRef}
              className={`h-full overflow-y-auto rounded-lg px-8 py-6 transition-colors`}
            >
              {segments.length > 0 ? (
                <>
                  {segments.map((segment, index) => (
                    <TranscriptSegment
                      key={`segment-${index}-${segment.id}`}
                      segment={segment}
                      speakers={speakers}
                      isActive={
                        enableTimestampFeatures && index === currentSegmentIndex
                      }
                      isEditable={isEditing && !isReadOnly}
                      isAnonymized={isAnonymized}
                      sttModel={transcribe?.stt_model}
                      segmentRef={
                        enableTimestampFeatures && index === currentSegmentIndex
                          ? activeSegmentRef
                          : undefined
                      }
                      onClick={handleSeekToWithInteraction}
                      onTextEdit={isReadOnly ? undefined : handleTextEdit}
                      showTimestamp={enableTimestampFeatures}
                      segmentIndex={index}
                      allSegments={segments}
                      clientId={session?.client_id || null}
                      onSpeakerChange={
                        isReadOnly ? undefined : handleSpeakerChange
                      }
                    />
                  ))}
                  {/* 스크롤 감지용 타겟 - key를 주어 단계 변경 시 감지 상태 초기화 */}
                  <div
                    key={`scroll-target-${tutorialStep}`}
                    ref={transcriptEndRef}
                    className="h-4 w-full"
                  />
                </>
              ) : (
                <div className="flex min-h-[400px] items-center justify-center">
                  <p className="text-fg-muted">전사 내용이 없습니다.</p>
                </div>
              )}
            </div>
          ) : activeTab.startsWith('create-note-') ||
            activeTab in requestingTabs ? (
            <div className="flex h-full flex-col">
              {activeCreatingTab?.isProcessing ? (
                // 생성 중 로딩 UI (DB에서 처리 중인 노트)
                <div className="flex h-full flex-col items-center justify-center gap-4 px-8 py-6">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-surface-strong border-t-primary"></div>
                  <div className="text-center">
                    <Title as="h2" className="text-lg font-medium text-fg">
                      상담노트 작성 중...
                    </Title>
                    <p className="mt-2 text-sm text-fg-muted">
                      상담노트를 작성하고 있습니다.
                      <br />
                      잠시만 기다려주세요.
                    </p>
                  </div>
                </div>
              ) : activeTab in creatingTabs ? (
                // 템플릿 선택 UI
                <>
                  {/* 우측 상단 생성 버튼 */}
                  <div className="flex items-center justify-between px-8 py-4">
                    <div>
                      <Title as="h2" className="text-base text-fg-muted">
                        상담 노트 템플릿
                      </Title>
                    </div>
                    <button
                      onClick={handleCreateProgressNote}
                      disabled={isReadOnly || !creatingTabs[activeTab]}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        isReadOnly || !creatingTabs[activeTab]
                          ? 'cursor-not-allowed bg-surface-contrast text-fg-muted'
                          : 'bg-primary text-white hover:bg-primary-600'
                      }`}
                    >
                      상담 노트 작성하기
                    </button>
                  </div>
                  {/* CreateProgressNoteView */}
                  <div
                    ref={contentScrollRef}
                    className="flex-1 overflow-y-auto px-8 py-6"
                  >
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
                        .filter((note) => note.processing_status !== 'failed')
                        .map((note) => note.template_id)
                        .filter(
                          (id): id is number => id !== null && id !== undefined
                        )}
                      selectedTemplateId={creatingTabs[activeTab] || null}
                      onTemplateSelect={handleTemplateSelect}
                    />
                  </div>
                </>
              ) : (
                // 알 수 없는 상태
                <div className="flex h-full items-center justify-center">
                  <p className="text-fg-muted">잠시 기다려주세요...</p>
                </div>
              )}
            </div>
          ) : (
            <div
              key={`note-container-${activeTab}`}
              className="flex h-full flex-col"
            >
              {(() => {
                const selectedNote = sessionProgressNotes.find(
                  (note) => note.id === activeTab
                );
                return selectedNote ? (
                  <>
                    {/* 상담노트 콘텐츠 */}
                    <div
                      ref={contentScrollRef}
                      className="flex-1 overflow-y-auto px-8 py-6"
                    >
                      <ProgressNoteView
                        note={selectedNote}
                        onRegenerate={
                          selectedNote.template_id
                            ? () =>
                                handleRegenerateProgressNote(
                                  selectedNote.template_id!
                                )
                            : undefined
                        }
                        isRegenerating={isRegenerating}
                        isReadOnly={isReadOnly}
                      />
                      {/* 상담노트용 스크롤 감지 타겟 */}
                      <div
                        key={`scroll-target-note-${tutorialStep}`}
                        ref={noteEndRef}
                        className="h-4 w-full"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-[400px] items-center justify-center">
                    <p className="text-fg-muted">상담 노트를 선택해주세요.</p>
                  </div>
                );
              })()}
            </div>
          )}
        </Spotlight>
      </div>

      {activeTab === 'transcript' && (
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
      <Modal
        open={isTabChangeModalOpen}
        onOpenChange={setIsTabChangeModalOpen}
        title="탭 변경 확인"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <Text className="text-base text-fg">
            편집 중인 내용이 있습니다. 저장하지 않고 탭을 변경하시겠습니까?
          </Text>
          <Text className="text-sm text-fg-muted">
            변경하면 편집 중인 내용이 모두 사라집니다.
          </Text>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={handleCancelTabChange}
              className="hover:bg-surface-hover w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-fg transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirmTabChange}
              className="hover:bg-primary/90 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SessionDetailPage;
