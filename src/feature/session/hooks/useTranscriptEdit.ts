/**
 * 축어록 편집 기능 훅
 * Optimistic Update로 즉각적인 UI 반영 후 백그라운드 서버 업데이트
 */

import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/composites/Toast';
import { trackError, trackEvent } from '@/lib/mixpanel';

import { updateMultipleTranscriptSegments } from '../services/sessionService';
import type {
  ProgressNote,
  Session,
  Transcribe,
  TranscribeSegment,
} from '../types';

import { sessionDetailQueryKey } from './useSessionDetail';

interface UseTranscriptEditOptions {
  sessionId: string;
  transcribeId: string | undefined;
  isDummySession: boolean;
  isReadOnly: boolean;
  /** 가이드 레벨 체크 함수 */
  checkIsGuideLevel?: (level: number) => boolean;
  /** 다음 가이드 레벨로 이동 */
  nextGuideLevel?: () => void;
  /** 축어록 스크롤을 최상단으로 이동 */
  scrollToTop?: () => void;
}

interface UseTranscriptEditReturn {
  /** 편집 모드 여부 */
  isEditing: boolean;
  /** 편집된 내용이 있는지 여부 */
  hasEdits: boolean;
  /** 편집된 세그먼트 저장소 (ref) */
  editedSegmentsRef: React.MutableRefObject<Record<number, string>>;
  /** 세그먼트 텍스트 편집 */
  handleTextEdit: (segmentId: number, newText: string) => void;
  /** 편집 모드 시작 */
  handleEditStart: () => void;
  /** 편집 취소 */
  handleCancelEdit: () => void;
  /** 모든 편집 저장 */
  handleSaveAllEdits: () => Promise<void>;
  /** 편집 모드 설정 (외부에서 제어 필요할 때) */
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
  /** hasEdits 상태 설정 (외부에서 제어 필요할 때) */
  setHasEdits: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useTranscriptEdit({
  sessionId,
  transcribeId,
  isDummySession,
  isReadOnly,
  checkIsGuideLevel,
  nextGuideLevel,
  scrollToTop,
}: UseTranscriptEditOptions): UseTranscriptEditReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = React.useState(false);
  // 편집 내용이 있는지 여부만 상태로 관리 (UI 표시용)
  const [hasEdits, setHasEdits] = React.useState(false);
  // useRef로 변경하여 리렌더링 없이 편집 내용 저장 (타이핑 렉 방지)
  const editedSegmentsRef = React.useRef<Record<number, string>>({});

  const sessionQueryKey = React.useMemo(
    () => sessionDetailQueryKey(sessionId, isDummySession),
    [sessionId, isDummySession]
  );

  const handleTextEdit = React.useCallback(
    (segmentId: number, newText: string) => {
      if (isReadOnly) return;
      // ref에 저장하여 리렌더링 없이 편집 내용 보관
      editedSegmentsRef.current[segmentId] = newText;
      if (!hasEdits) {
        setHasEdits(true);
      }
    },
    [isReadOnly, hasEdits]
  );

  const handleEditStart = React.useCallback(() => {
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

    // 가이드 Level 1 → Level 2 진행
    if (checkIsGuideLevel?.(1)) {
      nextGuideLevel?.();
    }
  }, [isReadOnly, sessionId, checkIsGuideLevel, nextGuideLevel, toast]);

  const handleCancelEdit = React.useCallback(() => {
    trackEvent('transcript_edit_cancel', { session_id: sessionId });
    editedSegmentsRef.current = {};
    setHasEdits(false);
    setIsEditing(false);
  }, [sessionId]);

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

    // 가이드 Level 3 → Level 4 진행
    if (checkIsGuideLevel?.(3)) {
      scrollToTop?.();
      nextGuideLevel?.();
    }

    if (Object.keys(editedSegmentsRef.current).length === 0) {
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
        sessionQueryKey,
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
                if (seg.id in editedSegmentsRef.current) {
                  return { ...seg, text: editedSegmentsRef.current[seg.id] };
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
                if (seg.id in editedSegmentsRef.current) {
                  return { ...seg, text: editedSegmentsRef.current[seg.id] };
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

      // 저장할 편집 내용 복사 (ref 초기화 전에)
      const editsToSave = { ...editedSegmentsRef.current };

      // 편집 상태 초기화 (UI 즉시 반영)
      editedSegmentsRef.current = {};
      setHasEdits(false);
      setIsEditing(false);

      // 백그라운드에서 서버 업데이트
      await updateMultipleTranscriptSegments(transcribeId, editsToSave);

      trackEvent('transcript_edit_complete', {
        session_id: sessionId,
        edited_segments_count: Object.keys(editsToSave).length,
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
    editedSegmentsRef,
    handleTextEdit,
    handleEditStart,
    handleCancelEdit,
    handleSaveAllEdits,
    setIsEditing,
    setHasEdits,
  };
}
