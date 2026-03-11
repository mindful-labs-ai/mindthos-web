/**
 * 축어록 편집 세션 통합 훅
 *
 * 편집 시작 시 contents 스냅샷을 생성하고,
 * 모든 변경(텍스트, 화자, 세그먼트 추가/삭제)을 스냅샷에서 관리합니다.
 * 저장 시 일괄 전송, 취소 시 스냅샷 폐기.
 *
 * 비편집 모드에서의 화자 변경은 기존처럼 즉시 서버에 저장됩니다.
 */

import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/composites/Toast';
import { trackError, trackEvent } from '@/lib/mixpanel';

import {
  saveTranscriptContents,
  updateTranscriptSegments,
} from '../services/sessionService';
import type {
  ProgressNote,
  Session,
  Speaker,
  Transcribe,
  TranscribeSegment,
} from '../types';
import {
  addSegmentAfter,
  applyBulkSpeakerChanges,
  applyBulkTextEdits,
  type Contents,
  deepCloneContents,
  getSegments,
  removeSegment,
} from '../utils/contentsEditor';

import { sessionDetailQueryKey } from './useSessionDetail';

// ── 타입 ──

interface SpeakerChangeUpdate {
  speakerChanges: Record<number, number>;
  speakerDefinitions: Speaker[];
}

interface UseTranscriptEditSessionOptions {
  sessionId: string;
  transcribeId: string | undefined;
  isDummySession: boolean;
  isReadOnly: boolean;
  checkIsGuideLevel?: (level: number) => boolean;
  nextGuideLevel?: () => void;
  scrollToTop?: () => void;
}

interface UseTranscriptEditSessionReturn {
  isEditing: boolean;
  hasEdits: boolean;
  handleEditStart: () => void;
  handleCancelEdit: () => void;
  handleSaveAllEdits: () => Promise<void>;
  handleTextEdit: (segmentId: number, newText: string) => void;
  handleSpeakerChange: (updates: SpeakerChangeUpdate) => Promise<void>;
  handleAddSegment: (afterSegmentId: number, speaker: number) => void;
  handleDeleteSegment: (segmentId: number) => void;
  /** 편집 중이면 스냅샷 기반 contents, 아니면 null */
  editingContents: Contents | null;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setHasEdits: React.Dispatch<React.SetStateAction<boolean>>;
}

type CachedSessionData = {
  session: Session;
  transcribe: Transcribe | null;
  progressNotes: ProgressNote[];
};

// ── 훅 ──

export function useTranscriptEditSession({
  sessionId,
  transcribeId,
  isDummySession,
  isReadOnly,
  checkIsGuideLevel,
  nextGuideLevel,
  scrollToTop,
}: UseTranscriptEditSessionOptions): UseTranscriptEditSessionReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = React.useState(false);
  const [hasEdits, setHasEdits] = React.useState(false);
  // 편집 중 UI에 반영할 스냅샷 (화자/추가/삭제는 state로 관리)
  const [editingContents, setEditingContents] = React.useState<Contents | null>(
    null
  );
  // 텍스트 편집은 ref로 관리 (리렌더링 없이 타이핑 성능 유지)
  const textEditsRef = React.useRef<Record<number, string>>({});

  const sessionQueryKey = React.useMemo(
    () => sessionDetailQueryKey(sessionId, isDummySession),
    [sessionId, isDummySession]
  );

  /** 캐시에서 현재 contents 읽기 */
  const getContentsFromCache = React.useCallback((): Contents | null => {
    const cached = queryClient.getQueryData(sessionQueryKey) as
      | CachedSessionData
      | undefined;
    return (cached?.transcribe?.contents as Contents) ?? null;
  }, [queryClient, sessionQueryKey]);

  // ── 편집 시작 ──

  const handleEditStart = React.useCallback(() => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 편집할 수 없습니다.',
        duration: 3000,
      });
      return;
    }

    const contents = getContentsFromCache();
    if (!contents) return;

    trackEvent('transcript_edit_start', { session_id: sessionId });

    // 스냅샷 생성
    setEditingContents(deepCloneContents(contents));
    textEditsRef.current = {};
    setHasEdits(false);
    setIsEditing(true);

    // 가이드 Level 1 → Level 2
    if (checkIsGuideLevel?.(1)) {
      nextGuideLevel?.();
    }
  }, [
    isReadOnly,
    sessionId,
    getContentsFromCache,
    checkIsGuideLevel,
    nextGuideLevel,
    toast,
  ]);

  // ── 편집 취소 ──

  const handleCancelEdit = React.useCallback(() => {
    trackEvent('transcript_edit_cancel', { session_id: sessionId });

    // 스냅샷 폐기
    setEditingContents(null);
    textEditsRef.current = {};
    setHasEdits(false);
    setIsEditing(false);

    // 서버 원본으로 복원
    queryClient.invalidateQueries({ queryKey: sessionQueryKey });
  }, [sessionId, queryClient, sessionQueryKey]);

  // ── 텍스트 편집 (편집 모드 전용, ref 기반) ──

  const handleTextEdit = React.useCallback(
    (segmentId: number, newText: string) => {
      if (isReadOnly || !isEditing) return;

      textEditsRef.current[segmentId] = newText;
      if (!hasEdits) {
        setHasEdits(true);
      }
    },
    [isReadOnly, isEditing, hasEdits]
  );

  // ── 화자 변경 (듀얼 모드) ──

  const handleSpeakerChange = React.useCallback(
    async (updates: SpeakerChangeUpdate) => {
      if (isReadOnly) {
        toast({
          title: '읽기 전용',
          description: '예시에서는 편집할 수 없습니다.',
          duration: 3000,
        });
        return;
      }

      if (!transcribeId || !sessionId) {
        toast({
          title: '오류',
          description: '전사 데이터를 찾을 수 없습니다.',
          duration: 3000,
        });
        return;
      }

      if (isEditing) {
        // ── 편집 모드: 스냅샷에만 적용 ──
        setEditingContents((prev) => {
          if (!prev) return prev;
          return applyBulkSpeakerChanges(
            prev,
            updates.speakerChanges,
            updates.speakerDefinitions
          );
        });
        setHasEdits(true);
      } else {
        // ── 비편집 모드: 기존 즉시 저장 방식 ──
        try {
          // Optimistic update
          queryClient.setQueryData(
            sessionQueryKey,
            (oldData: CachedSessionData | undefined) => {
              if (!oldData?.transcribe?.contents) return oldData;
              const contents = oldData.transcribe.contents as Contents;
              const updatedContents = applyBulkSpeakerChanges(
                contents,
                updates.speakerChanges,
                updates.speakerDefinitions
              );
              return {
                ...oldData,
                transcribe: {
                  ...oldData.transcribe,
                  contents: updatedContents,
                },
              };
            }
          );

          // 서버 업데이트
          await updateTranscriptSegments(transcribeId, {
            speakerUpdates: updates.speakerChanges,
            speakerDefinitions: updates.speakerDefinitions,
          });

          // 서버 최신 데이터로 갱신
          await queryClient.invalidateQueries({
            queryKey: sessionQueryKey,
          });

          toast({
            title: '화자 변경 완료',
            description: '축어록이 수정되었습니다.',
            duration: 3000,
          });
        } catch (error) {
          await queryClient.invalidateQueries({
            queryKey: sessionQueryKey,
          });

          trackError('speaker_change_error', error, {
            session_id: sessionId,
            transcribe_id: transcribeId,
          });
          toast({
            title: '화자 변경 실패',
            description: '화자 변경에 실패했습니다. 다시 시도해주세요.',
            duration: 3000,
          });
        }
      }
    },
    [
      isReadOnly,
      isEditing,
      transcribeId,
      sessionId,
      queryClient,
      sessionQueryKey,
      toast,
    ]
  );

  // ── 세그먼트 추가 (편집 모드 전용) ──

  const handleAddSegment = React.useCallback(
    (afterSegmentId: number, speaker: number) => {
      if (isReadOnly || !isEditing) return;

      setEditingContents((prev) => {
        if (!prev) return prev;
        const segments = getSegments(prev);
        const maxId = segments.reduce((max, seg) => Math.max(max, seg.id), 0);
        const newSegment: TranscribeSegment = {
          id: maxId + 1,
          start: null as null,
          end: null as null,
          text: '',
          speaker,
        };
        return addSegmentAfter(prev, afterSegmentId, newSegment);
      });
      setHasEdits(true);
    },
    [isReadOnly, isEditing]
  );

  // ── 세그먼트 삭제 (편집 모드 전용) ──

  const handleDeleteSegment = React.useCallback(
    (segmentId: number) => {
      if (isReadOnly || !isEditing) return;

      setEditingContents((prev) => {
        if (!prev) return prev;
        return removeSegment(prev, segmentId);
      });

      // 삭제된 세그먼트의 텍스트 편집도 정리
      delete textEditsRef.current[segmentId];
      setHasEdits(true);
    },
    [isReadOnly, isEditing]
  );

  // ── 모든 편집 저장 ──

  const handleSaveAllEdits = React.useCallback(async () => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 편집할 수 없습니다.',
        duration: 3000,
      });
      return;
    }

    if (!transcribeId || !sessionId) {
      toast({
        title: '오류',
        description: '전사 데이터를 찾을 수 없습니다.',
        duration: 3000,
      });
      return;
    }

    if (!editingContents) {
      toast({
        title: '오류',
        description: '편집 데이터를 찾을 수 없습니다.',
        duration: 3000,
      });
      return;
    }

    // 가이드 Level 3 → Level 4
    if (checkIsGuideLevel?.(3)) {
      scrollToTop?.();
      nextGuideLevel?.();
    }

    try {
      // 텍스트 편집을 스냅샷에 병합
      const textEdits = textEditsRef.current;
      const finalContents = applyBulkTextEdits(editingContents, textEdits);

      // 캐시에 최종 contents 반영 (UI 즉시 반영)
      queryClient.setQueryData(
        sessionQueryKey,
        (oldData: CachedSessionData | undefined) => {
          if (!oldData?.transcribe) return oldData;
          return {
            ...oldData,
            transcribe: { ...oldData.transcribe, contents: finalContents },
          };
        }
      );

      // 편집 상태 초기화
      setEditingContents(null);
      textEditsRef.current = {};
      setHasEdits(false);
      setIsEditing(false);

      // 서버에 전체 contents 저장
      await saveTranscriptContents(transcribeId, finalContents);

      trackEvent('transcript_edit_complete', {
        session_id: sessionId,
        edited_segments_count: Object.keys(textEdits).length,
      });

      toast({
        title: '저장 완료',
        description: '축어록이 수정되었습니다.',
        duration: 3000,
      });
    } catch (error) {
      // 실패 시 서버 데이터로 복원
      await queryClient.invalidateQueries({
        queryKey: sessionQueryKey,
      });

      trackError('transcript_save_error', error, {
        session_id: sessionId,
        transcribe_id: transcribeId,
      });
      toast({
        title: '저장 실패',
        description: '축어록 저장에 실패했습니다. 다시 시도해주세요.',
        duration: 3000,
      });
    }
  }, [
    isReadOnly,
    transcribeId,
    sessionId,
    editingContents,
    checkIsGuideLevel,
    scrollToTop,
    nextGuideLevel,
    queryClient,
    sessionQueryKey,
    toast,
  ]);

  return {
    isEditing,
    hasEdits,
    handleEditStart,
    handleCancelEdit,
    handleSaveAllEdits,
    handleTextEdit,
    handleSpeakerChange,
    handleAddSegment,
    handleDeleteSegment,
    editingContents,
    setIsEditing,
    setHasEdits,
  };
}
