import React from 'react';

import { trackEvent } from '@/lib/mixpanel';
import { useToast } from '@/shared/ui/composites/Toast';

import type { NoteV2RendererHandle } from '../NoteV2Renderer';

interface UseNoteV2EditSessionOptions {
  /** 저장 콜백 (NoteV2Renderer DOM에서 추출된 JSON 문자열) */
  onSave: (content: string) => Promise<void>;
  /** 저장 성공 후 콜백 */
  onSaveSuccess?: () => void;
  /** 읽기 전용 모드 */
  isReadOnly?: boolean;
  /** Mixpanel 트래킹 이벤트명 */
  trackingEvents?: {
    editStart?: string;
    editCancel?: string;
    editComplete?: string;
  };
  /** Mixpanel 트래킹 메타데이터 */
  trackingMeta?: Record<string, unknown>;
}

interface UseNoteV2EditSessionReturn {
  isEditing: boolean;
  hasEdits: boolean;
  isSaving: boolean;
  handleEditStart: () => void;
  handleCancelEdit: () => void;
  handleSaveEdit: () => Promise<void>;
  setHasEdits: (value: boolean) => void;
  /** NoteV2Renderer에 전달하여 편집된 JSON을 DOM에서 추출 */
  noteV2RendererRef: React.RefObject<NoteV2RendererHandle | null>;
  /** NoteV2Renderer를 감싸는 컨테이너에 붙여 input 이벤트로 변경 감지 */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function useNoteV2EditSession({
  onSave,
  onSaveSuccess,
  isReadOnly = false,
  trackingEvents,
  trackingMeta = {},
}: UseNoteV2EditSessionOptions): UseNoteV2EditSessionReturn {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const [hasEdits, setHasEdits] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const noteV2RendererRef = React.useRef<NoteV2RendererHandle>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isEditing || !containerRef.current) return;
    const container = containerRef.current;
    const handleInput = () => setHasEdits(true);
    container.addEventListener('input', handleInput);
    return () => container.removeEventListener('input', handleInput);
  }, [isEditing]);

  const handleEditStart = React.useCallback(() => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '편집할 수 없어요.',
        duration: 3000,
      });
      return;
    }
    setIsEditing(true);
    setHasEdits(false);
    if (trackingEvents?.editStart) {
      trackEvent(trackingEvents.editStart, trackingMeta);
    }
  }, [isReadOnly, trackingEvents, trackingMeta, toast]);

  const handleCancelEdit = React.useCallback(() => {
    setIsEditing(false);
    setHasEdits(false);
    if (trackingEvents?.editCancel) {
      trackEvent(trackingEvents.editCancel, trackingMeta);
    }
  }, [trackingEvents, trackingMeta]);

  const handleSaveEdit = React.useCallback(async () => {
    if (!noteV2RendererRef.current || isReadOnly) return;
    setIsSaving(true);
    try {
      const editedJson = noteV2RendererRef.current.getEditedContent();
      await onSave(editedJson);
      if (trackingEvents?.editComplete) {
        trackEvent(trackingEvents.editComplete, trackingMeta);
      }
      setIsEditing(false);
      setHasEdits(false);
      onSaveSuccess?.();
    } catch (error) {
      console.error('저장 실패:', error);
      toast({
        title: '저장 실패',
        description: '내용을 저장하지 못했어요.',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [isReadOnly, onSave, onSaveSuccess, trackingEvents, trackingMeta, toast]);

  return {
    isEditing,
    hasEdits,
    isSaving,
    handleEditStart,
    handleCancelEdit,
    handleSaveEdit,
    setHasEdits,
    noteV2RendererRef,
    containerRef,
  };
}
