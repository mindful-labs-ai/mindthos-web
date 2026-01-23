/**
 * 직접 입력 세션 편집 기능 훅
 */

import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';

import { updateHandwrittenTranscribeContent } from '../services/sessionService';

import { sessionDetailQueryKey } from './useSessionDetail';

interface UseHandwrittenEditOptions {
  transcribeId: string | undefined;
  initialContent: string;
  sessionId: string;
  isReadOnly: boolean;
  isDummySession: boolean;
}

interface UseHandwrittenEditReturn {
  /** 편집 모드 여부 */
  isEditing: boolean;
  /** 현재 편집 중인 텍스트 */
  editContent: string;
  /** 저장 중 여부 */
  isSaving: boolean;
  /** 편집 모드 시작 */
  handleEditStart: () => void;
  /** 편집 취소 */
  handleCancel: () => void;
  /** 편집 내용 저장 */
  handleSave: () => Promise<void>;
  /** 편집 내용 변경 */
  handleContentChange: (content: string) => void;
}

export function useHandwrittenEdit({
  transcribeId,
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

  const sessionQueryKey = React.useMemo(
    () => sessionDetailQueryKey(sessionId, isDummySession),
    [sessionId, isDummySession]
  );

  const handleEditStart = React.useCallback(() => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 편집 기능이 비활성화됩니다.',
        duration: 3000,
      });
      return;
    }
    setEditContent(initialContent);
    setIsEditing(true);
  }, [isReadOnly, initialContent, toast]);

  const handleCancel = React.useCallback(() => {
    setIsEditing(false);
    setEditContent('');
  }, []);

  const handleContentChange = React.useCallback((content: string) => {
    setEditContent(content);
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!transcribeId) return;

    setIsSaving(true);
    try {
      await updateHandwrittenTranscribeContent(transcribeId, editContent);

      // 캐시 무효화
      const userIdString = useAuthStore.getState().userId;
      const userIdNum = userIdString ? Number(userIdString) : null;
      if (userIdNum) {
        queryClient.invalidateQueries({ queryKey: ['sessions', userIdNum] });
      }
      queryClient.invalidateQueries({ queryKey: sessionQueryKey });

      toast({
        title: '저장 완료',
        description: '입력된 텍스트가 저장되었습니다.',
        duration: 3000,
      });

      setIsEditing(false);
      setEditContent('');
    } catch (err) {
      console.error('직접 입력 텍스트 저장 실패:', err);
      toast({
        title: '저장 실패',
        description: '텍스트 저장 중 오류가 발생했습니다.',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [transcribeId, editContent, queryClient, sessionQueryKey, toast]);

  return {
    isEditing,
    editContent,
    isSaving,
    handleEditStart,
    handleCancel,
    handleSave,
    handleContentChange,
  };
}
