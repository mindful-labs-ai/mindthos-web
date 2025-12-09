import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { Title } from '@/components/ui';
import { Badge } from '@/components/ui/atoms/Badge';
import type { TabItem } from '@/components/ui/atoms/Tab';
import { Tab } from '@/components/ui/atoms/Tab';
import { Text } from '@/components/ui/atoms/Text';
import { Modal } from '@/components/ui/composites/Modal';
import { PopUp } from '@/components/ui/composites/PopUp';
import { useToast } from '@/components/ui/composites/Toast';
import { isDummySessionId } from '@/feature/session/constants/dummySessions';
import { useTemplateList } from '@/feature/template/hooks/useTemplateList';
import { useAuthStore } from '@/stores/authStore';

import { AudioPlayer } from '../components/AudioPlayer';
import { CreateProgressNoteView } from '../components/CreateProgressNoteView';
import { ProgressNoteView } from '../components/ProgressNoteView';
import { SessionHeader } from '../components/SessionHeader';
import { TranscriptSegment } from '../components/TranscriptSegment';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useProgressNotePolling } from '../hooks/useProgressNotePolling';
import { useSessionDetail } from '../hooks/useSessionDetail';
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
  const [activeTab, setActiveTab] = React.useState<string>('transcript');
  const [isEditing, setIsEditing] = React.useState(false);
  const [isAnonymized, setIsAnonymized] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [presignedAudioUrl, setPresignedAudioUrl] = React.useState<
    string | null
  >(null);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<
    number | null
  >(null);
  const [editedSegments, setEditedSegments] = React.useState<
    Record<number, string>
  >({});
  const [isTabChangeModalOpen, setIsTabChangeModalOpen] = React.useState(false);
  const [pendingTabValue, setPendingTabValue] = React.useState<string | null>(
    null
  );
  const [hasShownDummyToast, setHasShownDummyToast] = React.useState(false);
  const [pollingProgressNoteId, setPollingProgressNoteId] = React.useState<
    string | null
  >(null);
  const [isCreateNoteRequesting, setIsCreateNoteRequesting] =
    React.useState(false);

  // 세션 상세 조회 (TanStack Query)
  const { data: sessionDetail, isLoading } = useSessionDetail({
    sessionId: sessionId || '',
    enabled: !!sessionId,
  });

  const isDummySession = isDummySessionId(sessionId || '');
  const isReadOnly = isDummySession;

  const session = sessionDetail?.session;
  const transcribe = sessionDetail?.transcribe;
  const sessionProgressNotes = sessionDetail?.progressNotes || [];

  const processingProgressNote = React.useMemo(
    () =>
      sessionProgressNotes.find(
        (note) =>
          note.processing_status === 'pending' ||
          note.processing_status === 'in_progress'
      ) || null,
    [sessionProgressNotes]
  );

  // 상담노트 폴링
  const {
    data: pollingNote,
    isFetching: isPollingNote,
    isLoading: isPollingNoteLoading,
  } = useProgressNotePolling({
    sessionId: sessionId || '',
    progressNoteId: pollingProgressNoteId,
    enabled: !!pollingProgressNoteId,
    onComplete: (note) => {
      console.log('상담노트 생성 완료:', note);
      setPollingProgressNoteId(null);
      setSelectedTemplateId(null); // 생성 완료 시 초기화

      // 로딩 창(create-note 탭)을 보고 있었다면 완성된 노트로 이동
      if (activeTab === 'create-note') {
        setActiveTab(note.id);
      }

      toast({
        title: '상담노트 생성 완료',
        description: '상담노트가 성공적으로 생성되었습니다.',
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error('상담노트 생성 실패:', error);
      setPollingProgressNoteId(null);
      setSelectedTemplateId(null); // 생성 실패 시에도 초기화
      toast({
        title: '상담노트 생성 실패',
        description: error.message,
        duration: 5000,
      });
    },
  });

  // 템플릿 목록 조회
  const { templates } = useTemplateList();

  React.useEffect(() => {
    if (!pollingProgressNoteId && processingProgressNote) {
      setPollingProgressNoteId(processingProgressNote.id);
    }
  }, [pollingProgressNoteId, processingProgressNote]);

  const isProgressNoteProcessing = React.useMemo(() => {
    const status =
      pollingNote?.processing_status ||
      processingProgressNote?.processing_status;

    if (pollingProgressNoteId && !status) {
      // 생성 요청 직후 첫 폴링 응답 이전까지 처리중으로 간주
      return true;
    }

    return status === 'pending' || status === 'in_progress';
  }, [
    pollingNote?.processing_status,
    pollingProgressNoteId,
    processingProgressNote?.processing_status,
  ]);

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
    if (activeTab === 'create-note' || isProgressNoteProcessing) {
      let label = '빈 노트';

      if (isProgressNoteProcessing) {
        const templateId =
          pollingNote?.template_id ||
          processingProgressNote?.template_id ||
          selectedTemplateId;

        if (templateId) {
          const template = templates.find((t) => t.id === templateId);
          label = template ? `${template.title} 생성 중...` : '생성 중...';
        } else {
          label = '생성 중...';
        }
      } else if (selectedTemplateId) {
        // 템플릿 선택 상태: 선택된 템플릿 제목 표시
        const selectedTemplate = templates.find(
          (t) => t.id === selectedTemplateId
        );
        label = selectedTemplate ? selectedTemplate.title : '빈 노트';
      }

      items.push({
        value: 'create-note',
        label,
      });
    }

    items.push({ value: 'add', label: '+' });
    return items;
  }, [
    sessionProgressNotes,
    activeTab,
    isProgressNoteProcessing,
    transcribe?.stt_model,
    selectedTemplateId,
    pollingNote?.template_id,
    processingProgressNote?.template_id,
    templates,
  ]);

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
        description: '더미 데이터에서는 편집할 수 없습니다.',
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
        ['session', sessionId],
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
              (seg: TranscribeSegment, index: number) => {
                const segmentId = index + 1; // id는 1부터 시작
                if (segmentId in editedSegments) {
                  return { ...seg, text: editedSegments[segmentId] };
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
              (seg: TranscribeSegment, index: number) => {
                const segmentId = index + 1; // id는 1부터 시작
                if (segmentId in editedSegments) {
                  return { ...seg, text: editedSegments[segmentId] };
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

      toast({
        title: '저장 완료',
        description: `${Object.keys(editedSegments).length}개의 세그먼트가 업데이트되었습니다.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('전사 텍스트 업데이트 실패:', error);

      // 실패 시 캐시 무효화하여 서버 데이터로 되돌림
      await queryClient.invalidateQueries({
        queryKey: ['session', sessionId],
      });

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

  const handleEditStart = () => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '더미 데이터에서는 편집할 수 없습니다.',
        duration: 3000,
      });
      return;
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
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
        description: '더미 데이터에서는 편집할 수 없습니다.',
        duration: 3000,
      });
      return;
    }
    console.log(
      '🔄 [SessionDetailPage] handleSpeakerChange called with:',
      updates
    );

    if (!transcribe?.id || !sessionId) {
      console.error(
        '❌ [SessionDetailPage] Missing transcribe.id or sessionId'
      );
      toast({
        title: '오류',
        description: '전사 데이터를 찾을 수 없습니다.',
        duration: 3000,
      });
      return;
    }

    console.log('🔄 [SessionDetailPage] transcribe.id:', transcribe.id);

    try {
      // Optimistic update: 캐시를 즉시 업데이트
      console.log('🔄 [SessionDetailPage] Starting optimistic update...');
      queryClient.setQueryData(
        ['session', sessionId],
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

      console.log('✅ [SessionDetailPage] Optimistic update completed');

      // 백그라운드에서 서버 업데이트
      console.log(
        '🔄 [SessionDetailPage] Calling updateTranscriptSegments API...'
      );
      await updateTranscriptSegments(transcribe.id, {
        speakerUpdates: updates.speakerChanges,
        speakerDefinitions: updates.speakerDefinitions,
      });

      console.log('✅ [SessionDetailPage] API call completed');

      // API 성공 후 캐시 무효화하여 DB의 최신 데이터 가져오기
      console.log('🔄 [SessionDetailPage] Invalidating cache...');
      await queryClient.invalidateQueries({
        queryKey: ['session', sessionId],
      });
      console.log('✅ [SessionDetailPage] Cache invalidated');

      toast({
        title: '화자 변경 완료',
        description: `${Object.keys(updates.speakerChanges).length}개의 세그먼트가 업데이트되었습니다.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ [SessionDetailPage] 화자 변경 실패:', error);

      // 실패 시 캐시 무효화하여 서버 데이터로 되돌림
      await queryClient.invalidateQueries({
        queryKey: ['session', sessionId],
      });

      toast({
        title: '화자 변경 실패',
        description:
          error instanceof Error ? error.message : '화자 변경에 실패했습니다.',
        duration: 3000,
      });
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (value: string) => {
    // 편집 중이고, 축어록 탭에서 다른 탭으로 변경하려는 경우
    if (isEditing && activeTab === 'transcript') {
      setPendingTabValue(value);
      setIsTabChangeModalOpen(true);
      return;
    }

    // 'add' 탭 처리
    if (value === 'add') {
      setActiveTab('create-note');
      return;
    }

    setActiveTab(value);
  };

  // 탭 변경 확인
  const handleConfirmTabChange = () => {
    setIsEditing(false);
    setEditedSegments({});
    if (pendingTabValue) {
      if (pendingTabValue === 'add') {
        setActiveTab('create-note');
      } else {
        setActiveTab(pendingTabValue);
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
        description: '더미 데이터에서는 복사 기능이 비활성화됩니다.',
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
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '더미 데이터에서는 제목을 수정할 수 없습니다.',
        duration: 3000,
      });
      return;
    }
    if (!sessionId) return;

    try {
      await updateSessionTitle(sessionId, newTitle);

      const userIdString = useAuthStore.getState().userId;
      const userId = userIdString ? Number(userIdString) : null;

      // 성공 시 세션 상세 정보 및 세션 목록 다시 조회
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['session', sessionId],
        }),
        // 세션 목록도 invalidate하여 SessionRecordCard와 SessionSideList 업데이트
        userId &&
          queryClient.invalidateQueries({
            queryKey: ['sessions', userId],
          }),
      ]);
    } catch (error) {
      console.error('세션 제목 업데이트 실패:', error);
      throw error;
    }
  };

  const handleTemplateSelect = (templateId: number | null) => {
    setSelectedTemplateId(templateId);
  };

  const handleCreateProgressNote = async () => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '더미 데이터에서는 상담 노트를 생성할 수 없습니다.',
        duration: 3000,
      });
      return;
    }
    if (!sessionId || !transcribe?.contents || !selectedTemplateId) return;
    if (
      isCreateNoteRequesting ||
      isProgressNoteProcessing ||
      isPollingNote ||
      isPollingNoteLoading
    ) {
      return;
    }

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

    try {
      setIsCreateNoteRequesting(true);
      // 백그라운드로 상담노트 추가
      const response = await addProgressNote({
        sessionId,
        userId,
        templateId: selectedTemplateId,
      });

      // 폴링 시작
      setPollingProgressNoteId(response.progress_note_id);

      toast({
        title: '상담노트 생성 시작',
        description: '백그라운드에서 상담노트를 생성하고 있습니다.',
        duration: 3000,
      });
    } catch (error) {
      console.error('상담 노트 생성 실패:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : '상담 노트 생성에 실패했습니다.';

      toast({
        title: '상담노트 생성 실패',
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsCreateNoteRequesting(false);
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

  React.useEffect(() => {
    if (isReadOnly && session && !hasShownDummyToast) {
      toast({
        title: '읽기 전용',
        description: '더미 데이터에서는 편집 기능이 비활성화됩니다.',
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
        <p className="text-fg-muted">상담기록을 불러오는 중...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-contrast">
        <p className="text-fg-muted">상담기록을 찾을 수 없습니다.</p>
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
          duration={session.audio_meta_data?.duration_seconds || 0}
          onTitleUpdate={isReadOnly ? undefined : handleTitleUpdate}
        />
      </div>

      <div className="flex flex-shrink-0 justify-start px-12 pt-2">
        <Tab
          items={tabItems}
          value={activeTab}
          onValueChange={handleTabChange}
          size="sm"
          variant="underline"
        />
      </div>

      <div
        className={`relative mx-6 mb-2 min-h-0 flex-1 rounded-xl border-2 ${isEditing && activeTab === 'transcript' ? 'border-primary-100 bg-primary-50' : 'border-surface-strong bg-surface'}`}
      >
        {activeTab === 'transcript' && (
          <div className="absolute inset-x-0 top-0 z-10 flex select-none justify-end">
            <div className="flex select-none items-center gap-2 overflow-hidden px-2 pt-2">
              {isReadOnly ? (
                <Badge tone="warning" variant="soft" size="sm">
                  더미 데이터 - 읽기 전용
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
                        </div>
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transcript' ? (
          <div
            className={`h-full overflow-y-auto rounded-lg px-8 py-6 transition-colors`}
          >
            {segments.length > 0 ? (
              segments.map((segment, index) => (
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
                  onClick={handleSeekTo}
                  onTextEdit={isReadOnly ? undefined : handleTextEdit}
                  showTimestamp={enableTimestampFeatures}
                  segmentIndex={index}
                  allSegments={segments}
                  clientId={session?.client_id || null}
                  onSpeakerChange={isReadOnly ? undefined : handleSpeakerChange}
                />
              ))
            ) : (
              <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-fg-muted">전사 내용이 없습니다.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'create-note' ? (
          <div className="flex h-full flex-col">
            {isProgressNoteProcessing ||
            isPollingNote ||
            isPollingNoteLoading ? (
              // 생성 중 로딩 UI
              <div className="flex h-full flex-col items-center justify-center gap-4 px-8 py-6">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-surface-strong border-t-primary"></div>
                <div className="text-center">
                  <Title as="h2" className="text-lg font-medium text-fg">
                    상담노트 생성 중...
                  </Title>
                  <p className="mt-2 text-sm text-fg-muted">
                    백그라운드에서 상담노트를 생성하고 있습니다.
                    <br />
                    잠시만 기다려주세요.
                  </p>
                </div>
              </div>
            ) : (
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
                    disabled={
                      isReadOnly ||
                      !selectedTemplateId ||
                      isCreateNoteRequesting ||
                      isProgressNoteProcessing ||
                      isPollingNote ||
                      isPollingNoteLoading
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isReadOnly ||
                      !selectedTemplateId ||
                      isCreateNoteRequesting ||
                      isProgressNoteProcessing ||
                      isPollingNote ||
                      isPollingNoteLoading
                        ? 'cursor-not-allowed bg-surface-contrast text-fg-muted'
                        : 'bg-primary text-white hover:bg-primary-600'
                    }`}
                  >
                    상담 노트 생성하기
                  </button>
                </div>
                {/* CreateProgressNoteView */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
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
                      .filter(
                        (id): id is number => id !== null && id !== undefined
                      )}
                    selectedTemplateId={selectedTemplateId}
                    onTemplateSelect={handleTemplateSelect}
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-8 py-6">
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

      {activeTab === 'transcript' && (
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
