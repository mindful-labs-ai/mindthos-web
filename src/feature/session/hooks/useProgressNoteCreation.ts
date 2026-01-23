/**
 * 상담노트 생성/재생성 기능 훅
 */

import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/ui/composites/Toast';
import { trackError } from '@/lib/mixpanel';
import { useAuthStore } from '@/stores/authStore';

import { addProgressNote } from '../services/progressNoteService';
import type { ProgressNote } from '../types';

import { sessionDetailQueryKey } from './useSessionDetail';

const PROGRESS_NOTE_CREDIT = 10; // 상담노트 생성 크레딧

interface UseProgressNoteCreationOptions {
  sessionId: string;
  transcribeContents: unknown;
  isReadOnly: boolean;
  isDummySession: boolean;
  /** 잔여 크레딧 */
  remainingCredit: number;
  /** 템플릿 선택 중인 탭들 */
  creatingTabs: Record<string, number | null>;
  setCreatingTabs: React.Dispatch<
    React.SetStateAction<Record<string, number | null>>
  >;
  /** 요청 중인 탭들 */
  requestingTabs: Record<
    string,
    { templateId: number; progressNoteId: string | null }
  >;
  setRequestingTabs: React.Dispatch<
    React.SetStateAction<
      Record<string, { templateId: number; progressNoteId: string | null }>
    >
  >;
  setActiveTab: (tab: string) => void;
  activeTab: string;
  progressNotes: ProgressNote[];
}

interface UseProgressNoteCreationReturn {
  /** 재생성 중 여부 */
  isRegenerating: boolean;
  /** 상담노트 생성 */
  handleCreateProgressNote: () => Promise<void>;
  /** 상담노트 재생성 */
  handleRegenerateProgressNote: (templateId: number) => Promise<void>;
  /** 현재 활성 탭의 템플릿 선택 */
  handleTemplateSelect: (templateId: number | null) => void;
}

export function useProgressNoteCreation({
  sessionId,
  transcribeContents,
  isReadOnly,
  isDummySession,
  remainingCredit,
  creatingTabs,
  setCreatingTabs,
  requestingTabs,
  setRequestingTabs,
  setActiveTab,
  activeTab,
  progressNotes,
}: UseProgressNoteCreationOptions): UseProgressNoteCreationReturn {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const handleTemplateSelect = React.useCallback(
    (templateId: number | null) => {
      if (!activeTab.startsWith('create-note-')) return;
      if (!(activeTab in creatingTabs)) return;
      setCreatingTabs((prev) => ({
        ...prev,
        [activeTab]: templateId,
      }));
    },
    [activeTab, creatingTabs, setCreatingTabs]
  );

  const handleCreateProgressNote = React.useCallback(async () => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 상담 노트를 작성할 수 없습니다.',
        duration: 3000,
      });
      return;
    }

    // 크레딧 체크
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
    if (!sessionId || !transcribeContents || !templateId) return;

    const userIdString = useAuthStore.getState().userId;
    if (!userIdString) return;

    const userId = Number(userIdString);
    if (isNaN(userId)) return;

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
  }, [
    isReadOnly,
    remainingCredit,
    activeTab,
    creatingTabs,
    requestingTabs,
    sessionId,
    transcribeContents,
    setCreatingTabs,
    setRequestingTabs,
    setActiveTab,
    toast,
  ]);

  const handleRegenerateProgressNote = React.useCallback(
    async (templateId: number) => {
      if (isReadOnly) {
        toast({
          title: '읽기 전용',
          description: '예시에서는 상담 노트를 작성할 수 없습니다.',
          duration: 3000,
        });
        return;
      }

      // 크레딧 체크
      if (remainingCredit < PROGRESS_NOTE_CREDIT) {
        toast({
          title: '크레딧 부족',
          description: `상담노트 작성에 ${PROGRESS_NOTE_CREDIT} 크레딧이 필요합니다. (보유: ${remainingCredit})`,
          duration: 5000,
        });
        return;
      }

      if (!sessionId || !transcribeContents) return;

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

        // 이전 탭으로 돌아가기
        // 해당 template_id의 기존 완료된 노트로 전환
        const existingNote = progressNotes.find(
          (n) =>
            n.template_id === templateId && n.processing_status === 'succeeded'
        );
        if (existingNote) {
          setActiveTab(existingNote.id);
        } else {
          setActiveTab('transcript');
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
    },
    [
      isReadOnly,
      remainingCredit,
      sessionId,
      transcribeContents,
      isDummySession,
      progressNotes,
      setRequestingTabs,
      setActiveTab,
      queryClient,
      toast,
    ]
  );

  return {
    isRegenerating,
    handleCreateProgressNote,
    handleRegenerateProgressNote,
    handleTemplateSelect,
  };
}
