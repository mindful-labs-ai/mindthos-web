/**
 * 마크다운 콘텐츠 편집 세션 훅
 *
 * useTranscriptEditSession 패턴을 따르되, 단일 문자열 편집에 맞게 단순화.
 * 편집 시작 시 스냅샷 생성, 취소 시 폐기, 저장 시 onSave 콜백 호출.
 *
 * inlineEdit 모드: contentEditable 기반 인라인 편집.
 * markdownRef로 DOM 접근 → domToMarkdown()으로 마크다운 추출.
 */

import React from 'react';

import { useToast } from '@/components/ui/composites/Toast';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { domToMarkdown } from '@/shared/utils/domToMarkdown';

interface UseMarkdownEditSessionOptions {
  /** 원본 콘텐츠 (편집 시작 시 스냅샷으로 복사) */
  originalContent: string | null;
  /** 저장 콜백 */
  onSave: (content: string) => Promise<void>;
  /** 저장 성공 후 콜백 (쿼리 invalidation 등) */
  onSaveSuccess?: () => void;
  /** 읽기 전용 모드 */
  isReadOnly?: boolean;
  /** 인라인 편집 모드 (contentEditable 사용) */
  inlineEdit?: boolean;
  /** 커스텀 콘텐츠 추출 함수 (inlineEdit 시 domToMarkdown 대신 사용) */
  extractContent?: () => string;
  /** Mixpanel 트래킹 이벤트명 */
  trackingEvents?: {
    editStart?: string;
    editCancel?: string;
    editComplete?: string;
  };
  /** Mixpanel 트래킹 메타데이터 */
  trackingMeta?: Record<string, unknown>;
}

interface UseMarkdownEditSessionReturn {
  isEditing: boolean;
  editingContent: string;
  hasEdits: boolean;
  isSaving: boolean;
  handleEditStart: () => void;
  handleCancelEdit: () => void;
  handleSaveEdit: () => Promise<void>;
  handleContentChange: (content: string) => void;
  /** 인라인 편집용 MarkdownRenderer ref */
  markdownRef: React.RefObject<HTMLDivElement | null>;
  /** hasEdits를 수동으로 설정 */
  setHasEdits: (value: boolean) => void;
}

export function useMarkdownEditSession({
  originalContent,
  onSave,
  onSaveSuccess,
  isReadOnly = false,
  inlineEdit = false,
  extractContent,
  trackingEvents,
  trackingMeta = {},
}: UseMarkdownEditSessionOptions): UseMarkdownEditSessionReturn {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingContent, setEditingContent] = React.useState('');
  const [hasEdits, setHasEdits] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const markdownRef = React.useRef<HTMLDivElement | null>(null);

  // 인라인 편집 모드: DOM input 이벤트로 변경 감지
  React.useEffect(() => {
    if (!inlineEdit || !isEditing || !markdownRef.current) return;

    const container = markdownRef.current;
    const handleInput = () => {
      setHasEdits(true);
    };

    container.addEventListener('input', handleInput);
    return () => {
      container.removeEventListener('input', handleInput);
    };
  }, [inlineEdit, isEditing]);

  const handleEditStart = React.useCallback(() => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '편집할 수 없습니다.',
        duration: 3000,
      });
      return;
    }

    if (!inlineEdit) {
      setEditingContent(originalContent || '');
    }
    setHasEdits(false);
    setIsEditing(true);

    if (trackingEvents?.editStart) {
      trackEvent(trackingEvents.editStart, trackingMeta);
    }
  }, [isReadOnly, originalContent, inlineEdit, trackingEvents, trackingMeta, toast]);

  const handleCancelEdit = React.useCallback(() => {
    setEditingContent('');
    setHasEdits(false);
    setIsEditing(false);

    if (trackingEvents?.editCancel) {
      trackEvent(trackingEvents.editCancel, trackingMeta);
    }
  }, [trackingEvents, trackingMeta]);

  const handleContentChange = React.useCallback(
    (newContent: string) => {
      setEditingContent(newContent);
      setHasEdits(newContent !== (originalContent || ''));
    },
    [originalContent]
  );

  const handleSaveEdit = React.useCallback(async () => {
    if (isReadOnly || !hasEdits) return;

    setIsSaving(true);
    try {
      let contentToSave: string;

      if (inlineEdit && extractContent) {
        // 커스텀 추출 함수 사용
        contentToSave = extractContent();
      } else if (inlineEdit && markdownRef.current) {
        // DOM에서 마크다운 추출
        contentToSave = domToMarkdown(markdownRef.current);
      } else {
        contentToSave = editingContent;
      }

      await onSave(contentToSave);

      if (trackingEvents?.editComplete) {
        trackEvent(trackingEvents.editComplete, trackingMeta);
      }

      setIsEditing(false);
      setHasEdits(false);
      setEditingContent('');

      onSaveSuccess?.();

      toast({
        title: '저장 완료',
        description: '내용이 수정되었습니다.',
        duration: 3000,
      });
    } catch (error) {
      trackError('markdown_edit_save_error', error, trackingMeta);
      toast({
        title: '저장 실패',
        description: '내용 저장에 실패했습니다. 다시 시도해주세요.',
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    isReadOnly,
    hasEdits,
    inlineEdit,
    extractContent,
    editingContent,
    onSave,
    onSaveSuccess,
    trackingEvents,
    trackingMeta,
    toast,
  ]);

  return {
    isEditing,
    editingContent,
    hasEdits,
    isSaving,
    handleEditStart,
    handleCancelEdit,
    handleSaveEdit,
    handleContentChange,
    markdownRef,
    setHasEdits,
  };
}
