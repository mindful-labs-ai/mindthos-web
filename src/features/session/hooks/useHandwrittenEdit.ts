/**
 * 직접 입력 세션 편집 기능 훅
 */

import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { updateHandwrittenTranscript } from '@/shared/api/server/transcriptServerApi';
import { sessionQueryKeys } from '@/shared/constants/queryKeys';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';

import type { HandwrittenTranscribe, ProgressNote, Session } from '../types';

const MIN_CONTENT_LENGTH = 100;
const MAX_CONTENT_LENGTH = 50000;

interface UseHandwrittenEditOptions {
  transcribeId: string | undefined;
  revision: number | undefined;
  contentsFingerprint: string | null | undefined;
  initialContent: string;
  sessionId: string;
  isReadOnly: boolean;
  isDummySession: boolean;
}

interface UseHandwrittenEditReturn {
  isEditing: boolean;
  editContent: string;
  isSaving: boolean;
  handleEditStart: () => void;
  /** 저장 요청이 이미 전송된 경우 false를 반환해 화면 이탈을 막는다. */
  handleCancel: () => boolean;
  handleSave: () => Promise<void>;
  handleContentChange: (content: string) => void;
}

interface EditTarget {
  sessionId: string;
  transcribeId: string;
  baseRevision: number;
  baseContentsFingerprint: string;
  baseContents: string;
  generation: number;
}

type CachedSessionData = {
  session: Session;
  transcribe: HandwrittenTranscribe | null;
  progressNotes: ProgressNote[];
};

export function useHandwrittenEdit({
  transcribeId,
  revision,
  contentsFingerprint,
  initialContent,
  sessionId,
  isReadOnly,
  isDummySession,
}: UseHandwrittenEditOptions): UseHandwrittenEditReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const editTargetRef = React.useRef<EditTarget | null>(null);
  const editGenerationRef = React.useRef(0);
  const mutationInFlightRef = React.useRef<EditTarget | null>(null);

  const isTargetMutationInFlight = React.useCallback(
    (target: EditTarget | null): boolean => {
      const inFlight = mutationInFlightRef.current;
      return (
        !!inFlight && !!target && inFlight.generation === target.generation
      );
    },
    []
  );

  const sessionQueryKey = React.useMemo(
    () => sessionQueryKeys.detail(sessionId, isDummySession),
    [sessionId, isDummySession]
  );

  const resetEditState = React.useCallback(() => {
    editGenerationRef.current += 1;
    editTargetRef.current = null;
    setIsEditing(false);
    setEditContent('');
  }, []);

  React.useEffect(() => {
    const target = editTargetRef.current;
    if (
      target &&
      (target.sessionId !== sessionId || target.transcribeId !== transcribeId)
    ) {
      resetEditState();
    }
  }, [resetEditState, sessionId, transcribeId]);

  const handleEditStart = React.useCallback(() => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '실제 상담 기록에서 편집할 수 있어요.',
        duration: 3000,
      });
      return;
    }

    const inFlight = mutationInFlightRef.current;
    if (
      inFlight?.sessionId === sessionId &&
      inFlight.transcribeId === transcribeId
    ) {
      toast({
        title: '저장 중이에요',
        description: '현재 상담 기록 저장이 끝난 뒤 다시 편집해 주세요.',
        duration: 3000,
      });
      return;
    }

    if (
      !transcribeId ||
      !sessionId ||
      !Number.isInteger(revision) ||
      !contentsFingerprint
    ) {
      toast({
        title: '편집 정보를 불러오지 못했어요',
        description: '페이지를 새로고침한 뒤 다시 시도해 주세요.',
        duration: 3000,
      });
      return;
    }

    const generation = editGenerationRef.current + 1;
    editGenerationRef.current = generation;
    editTargetRef.current = {
      sessionId,
      transcribeId,
      baseRevision: revision as number,
      baseContentsFingerprint: contentsFingerprint,
      baseContents: initialContent,
      generation,
    };
    setEditContent(initialContent);
    setIsEditing(true);
  }, [
    contentsFingerprint,
    initialContent,
    isReadOnly,
    revision,
    sessionId,
    toast,
    transcribeId,
  ]);

  const handleCancel = React.useCallback(() => {
    if (isTargetMutationInFlight(editTargetRef.current)) {
      toast({
        title: '저장 중이에요',
        description: '저장이 끝난 뒤 이동해 주세요.',
        duration: 3000,
      });
      return false;
    }
    resetEditState();
    return true;
  }, [isTargetMutationInFlight, resetEditState, toast]);

  const handleContentChange = React.useCallback(
    (content: string) => {
      if (!isEditing || isTargetMutationInFlight(editTargetRef.current)) return;
      setEditContent(content);
    },
    [isEditing, isTargetMutationInFlight]
  );

  const handleSave = React.useCallback(async () => {
    const target = editTargetRef.current;
    if (
      !target ||
      target.sessionId !== sessionId ||
      target.transcribeId !== transcribeId
    ) {
      toast({
        title: '이전 편집을 저장하지 않았어요',
        description:
          '다른 상담 기록으로 이동해 편집 내용을 안전하게 취소했어요.',
        duration: 3000,
      });
      return;
    }

    if (editContent === target.baseContents) {
      resetEditState();
      return;
    }

    const trimmedContent = editContent.trim();
    if (trimmedContent.length < MIN_CONTENT_LENGTH) {
      toast({
        title: '입력 오류',
        description: `상담 내용은 최소 ${MIN_CONTENT_LENGTH}자 이상 입력해 주세요.`,
        duration: 3000,
      });
      return;
    }
    if (trimmedContent.length > MAX_CONTENT_LENGTH) {
      toast({
        title: '입력 오류',
        description: `상담 내용은 최대 ${MAX_CONTENT_LENGTH.toLocaleString()}자까지 입력 가능해요.`,
        duration: 3000,
      });
      return;
    }
    if (mutationInFlightRef.current) return;

    mutationInFlightRef.current = target;
    setIsSaving(true);
    try {
      const response = await updateHandwrittenTranscript({
        sessionId: target.sessionId,
        transcribeId: target.transcribeId,
        expectedRevision: target.baseRevision,
        expectedContentsFingerprint: target.baseContentsFingerprint,
        baseContents: target.baseContents,
        contents: editContent,
      });

      queryClient.setQueryData(
        sessionQueryKey,
        (oldData: CachedSessionData | undefined) => {
          if (
            oldData?.session.id !== target.sessionId ||
            oldData.transcribe?.id !== target.transcribeId
          ) {
            return oldData;
          }
          return {
            ...oldData,
            transcribe: {
              ...oldData.transcribe,
              contents: editContent,
              revision: response.revision,
              contents_md5: response.contentsFingerprint,
            },
          };
        }
      );

      const isCurrentEdit =
        editTargetRef.current?.generation === target.generation;
      if (isCurrentEdit) resetEditState();

      const userIdString = useAuthStore.getState().userId;
      const userIdNum = userIdString ? Number(userIdString) : null;
      if (userIdNum) {
        await queryClient.invalidateQueries({
          queryKey: sessionQueryKeys.all(userIdNum),
        });
      }
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });

      if (isCurrentEdit) {
        toast({
          title: '저장 완료',
          description: '입력한 텍스트를 저장했어요.',
          duration: 3000,
        });
      }
    } catch (error) {
      const isConflict =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        error.status === 409;
      const isCurrentEdit =
        editTargetRef.current?.generation === target.generation;
      if (isConflict && isCurrentEdit) resetEditState();
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });

      if (isCurrentEdit) {
        toast({
          title: isConflict ? '최신 내용을 다시 불러왔어요' : '저장 실패',
          description: isConflict
            ? '다른 곳에서 내용이 변경되어 이전 편집은 저장하지 않았어요.'
            : '텍스트 저장 중 오류가 생겼어요.',
          duration: 3000,
        });
      }
    } finally {
      if (mutationInFlightRef.current?.generation === target.generation) {
        mutationInFlightRef.current = null;
        setIsSaving(false);
      }
    }
  }, [
    editContent,
    queryClient,
    resetEditState,
    sessionId,
    sessionQueryKey,
    toast,
    transcribeId,
  ]);

  return {
    isEditing,
    editContent,
    isSaving:
      isSaving &&
      mutationInFlightRef.current?.sessionId === sessionId &&
      mutationInFlightRef.current?.transcribeId === transcribeId,
    handleEditStart,
    handleCancel,
    handleSave,
    handleContentChange,
  };
}
