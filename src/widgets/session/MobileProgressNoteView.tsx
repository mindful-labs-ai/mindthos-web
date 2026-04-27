/**
 * 모바일 상담노트 뷰
 * sticky 헤더 + kebab → bottomSheet 메뉴, onEditStateChange 콜백
 */

import React, { useState } from 'react';

import type { ProgressNote } from '@/features/session/types';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useDevice } from '@/shared/hooks/useDevice';
import { useMarkdownEditSession } from '@/shared/hooks/useMarkdownEditSession';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { MarkdownRenderer } from '@/shared/ui/composites/MarkdownRenderer';
import { useToast } from '@/shared/ui/composites/Toast';
import { domToMarkdown } from '@/shared/utils/domToMarkdown';
import { stripMarkdown } from '@/shared/utils/stripMarkdown';

import { NoteV2Renderer, serializeNoteV2 } from './NoteV2Renderer';
import {
  ProgressNoteStatusView,
  ProgressNoteToolbar,
  rebuildHeading,
  useNoteV2EditSession,
  useProgressNoteFormat,
} from './progressNote';
import { RegenerateProgressNoteModal } from './RegenerateProgressNoteModal';

interface MobileProgressNoteViewProps {
  note: ProgressNote;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  isReadOnly?: boolean;
  progressNotes?: ProgressNote[];
  onSaveSummary?: (noteId: string, summary: string) => Promise<void>;
  /** 편집 상태 변경 콜백 (Container에서 compact-nav 액션 연동용) */
  onEditStateChange?: (state: {
    isEditing: boolean;
    hasEdits: boolean;
    isSaving: boolean;
    onSave: () => void;
    onCancel: () => void;
  }) => void;
}

export const MobileProgressNoteView: React.FC<MobileProgressNoteViewProps> = ({
  note,
  onRegenerate,
  isRegenerating = false,
  isReadOnly = false,
  progressNotes = [],
  onSaveSummary,
  onEditStateChange,
}) => {
  const { toast } = useToast();
  const { isTablet } = useDevice();
  const [copiedAll, setCopiedAll] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);

  const format = useProgressNoteFormat(note);

  const {
    isEditing: isEditingV2,
    hasEdits: hasEditsV2,
    isSaving: isSavingV2,
    handleEditStart: handleEditStartV2,
    handleCancelEdit: handleCancelEditV2,
    handleSaveEdit: handleSaveEditV2,
    noteV2RendererRef,
    containerRef: v2ContainerRef,
  } = useNoteV2EditSession({
    onSave: async (editedJson) => {
      if (!onSaveSummary) return;
      await onSaveSummary(note.id, editedJson);
    },
    isReadOnly: isReadOnly || !onSaveSummary,
    trackingEvents: {
      editStart: MixpanelEvent.ProgressNoteEditStart,
      editCancel: MixpanelEvent.ProgressNoteEditCancel,
      editComplete: MixpanelEvent.ProgressNoteEditComplete,
    },
    trackingMeta: {
      note_id: note.id,
      session_id: note.session_id,
    },
  });

  const sectionRefs = React.useRef<Map<number, HTMLDivElement | null>>(
    new Map()
  );
  const titleRefs = React.useRef<Map<number, HTMLHeadingElement | null>>(
    new Map()
  );
  const sectionsContainerRef = React.useRef<HTMLDivElement>(null);

  const v1Sections = React.useMemo(
    () => (format.kind === 'v1' ? format.sections : []),
    [format]
  );

  const extractSectionsContent = React.useCallback((): string => {
    return v1Sections
      .map((section, index) => {
        const contentRef = sectionRefs.current.get(index);
        const titleRef = titleRefs.current.get(index);

        const editedContent = contentRef
          ? domToMarkdown(contentRef).trim()
          : section.content.trim();

        const heading = titleRef
          ? rebuildHeading(
              section.rawHeading,
              (titleRef.textContent || '').trim()
            )
          : section.rawHeading;

        return editedContent ? `${heading}\n${editedContent}` : heading;
      })
      .join('\n\n');
  }, [v1Sections]);

  const {
    isEditing,
    hasEdits,
    isSaving,
    handleEditStart,
    handleCancelEdit,
    handleSaveEdit,
    setHasEdits,
  } = useMarkdownEditSession({
    originalContent: note.summary ?? null,
    inlineEdit: true,
    extractContent: extractSectionsContent,
    onSave: async (editedSummary) => {
      if (!onSaveSummary) return;
      await onSaveSummary(note.id, editedSummary);
    },
    isReadOnly: isReadOnly || !onSaveSummary,
    trackingEvents: {
      editStart: MixpanelEvent.ProgressNoteEditStart,
      editCancel: MixpanelEvent.ProgressNoteEditCancel,
      editComplete: MixpanelEvent.ProgressNoteEditComplete,
    },
    trackingMeta: {
      note_id: note.id,
      session_id: note.session_id,
    },
  });

  // 편집 상태를 Container로 전달 (v1/v2 중 활성화된 쪽 기준)
  const isV2 = format.kind === 'v2';
  const activeIsEditing = isV2 ? isEditingV2 : isEditing;
  const activeHasEdits = isV2 ? hasEditsV2 : hasEdits;
  const activeIsSaving = isV2 ? isSavingV2 : isSaving;
  const activeOnSave = isV2 ? handleSaveEditV2 : handleSaveEdit;
  const activeOnCancel = isV2 ? handleCancelEditV2 : handleCancelEdit;

  React.useEffect(() => {
    onEditStateChange?.({
      isEditing: activeIsEditing,
      hasEdits: activeHasEdits,
      isSaving: activeIsSaving,
      onSave: activeOnSave,
      onCancel: activeOnCancel,
    });
  }, [
    activeIsEditing,
    activeHasEdits,
    activeIsSaving,
    activeOnSave,
    activeOnCancel,
    onEditStateChange,
  ]);

  React.useEffect(() => {
    if (!isEditing || !sectionsContainerRef.current) return;
    const container = sectionsContainerRef.current;
    const handleInput = () => setHasEdits(true);
    container.addEventListener('input', handleInput);
    return () => container.removeEventListener('input', handleInput);
  }, [isEditing, setHasEdits]);

  const sameTemplateSucceededCount = progressNotes.filter(
    (n) =>
      n.template_id === note.template_id && n.processing_status === 'succeeded'
  ).length;
  const isFirstRegeneration = sameTemplateSucceededCount <= 1;

  const handleRegenerateClick = () => setIsRegenerateModalOpen(true);
  const handleRegenerateConfirm = () => {
    setIsRegenerateModalOpen(false);
    onRegenerate?.();
  };

  const handleCopyAll = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      trackEvent(MixpanelEvent.ProgressNoteCopyAll);
      toast({
        title: '복사 완료',
        description: '전체 내용을 복사했어요.',
        duration: 2000,
      });
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      toast({
        title: '복사 실패 — 다시 시도해 주세요.',
        description: '내용을 복사하지 못했어요.',
        duration: 3000,
      });
    }
  };

  const toolbarVariant = isTablet ? 'mobile-inline' : 'mobile-kebab';

  if (format.kind === 'v2') {
    const { noteV2 } = format;
    return (
      <div className="space-y-4 text-left">
        <div className="px-4 py-4 md:px-10">
          <div className="flex items-center justify-between">
            <h2 className="text-l font-headline text-grey-100 md:text-xl">
              {note.title || '상담노트'}
            </h2>
            <ProgressNoteToolbar
              variant={toolbarVariant}
              isEditing={isEditingV2}
              hasEdits={hasEditsV2}
              isSaving={isSavingV2}
              copiedAll={copiedAll}
              canEdit={!!onSaveSummary && !isReadOnly}
              canRegenerate={!!onRegenerate && !isReadOnly}
              isRegenerating={isRegenerating}
              onEditStart={handleEditStartV2}
              onCancelEdit={handleCancelEditV2}
              onSaveEdit={handleSaveEditV2}
              onCopyAll={() => handleCopyAll(serializeNoteV2(noteV2))}
              onRegenerateClick={handleRegenerateClick}
            />
          </div>
          <p className="mt-1 text-xs text-grey-60 md:text-sm">
            {note.created_at &&
              `${new Date(note.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 작성됨`}
          </p>
          <div className="mt-4 border-b border-grey-30" />
        </div>

        <div ref={v2ContainerRef} className="px-4 md:px-10">
          <NoteV2Renderer
            ref={noteV2RendererRef}
            note={noteV2}
            editable={isEditingV2}
          />
        </div>

        <RegenerateProgressNoteModal
          open={isRegenerateModalOpen}
          onOpenChange={setIsRegenerateModalOpen}
          onConfirm={handleRegenerateConfirm}
          isFirstRegeneration={isFirstRegeneration}
          templateName={note.title ?? undefined}
        />
      </div>
    );
  }

  const isProcessing =
    note.processing_status === 'pending' ||
    note.processing_status === 'in_progress';
  const isFailed = note.processing_status === 'failed';

  if (isProcessing) {
    return <ProgressNoteStatusView status="processing" note={note} />;
  }

  if (isFailed) {
    return <ProgressNoteStatusView status="failed" note={note} />;
  }

  return (
    <div className="space-y-4 text-left">
      <div className="px-4 py-4 md:px-10">
        <div className="flex items-center justify-between">
          <h2 className="text-l font-headline text-grey-100 md:text-xl">
            {note.title || '상담노트'}
          </h2>
          <ProgressNoteToolbar
            variant={toolbarVariant}
            isEditing={isEditing}
            hasEdits={hasEdits}
            isSaving={isSaving}
            copiedAll={copiedAll}
            canEdit={!!onSaveSummary && !isReadOnly}
            canRegenerate={!!onRegenerate && !isReadOnly}
            isRegenerating={isRegenerating}
            onEditStart={handleEditStart}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            onCopyAll={() =>
              note.summary && handleCopyAll(stripMarkdown(note.summary))
            }
            onRegenerateClick={handleRegenerateClick}
          />
        </div>
        <p className="mt-1 text-xs text-grey-60 md:text-sm">
          {note.created_at &&
            `${new Date(note.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 작성됨`}
        </p>
        <div className="mt-4 border-b border-grey-30" />
      </div>

      {note.summary ? (
        <div className="relative px-4 md:px-10">
          {v1Sections.length === 0 ? (
            <div className="rounded-lg py-1">
              <MarkdownRenderer content={note.summary} editable={isEditing} />
            </div>
          ) : (
            <div ref={sectionsContainerRef} className="space-y-6">
              {v1Sections.map((section, index) => (
                <div
                  key={index}
                  className={`group relative rounded-lg py-1 ${!isEditing ? 'lg:hover:bg-grey-10' : ''}`}
                >
                  <div className="mb-3">
                    <Title
                      ref={
                        isEditing
                          ? (el: HTMLHeadingElement | null) => {
                              titleRefs.current.set(index, el);
                            }
                          : undefined
                      }
                      as="h3"
                      className={`text-m font-emphasize text-grey-100 md:text-l ${isEditing ? 'focus:ring-primary/50 cursor-text bg-primary-subtle focus:rounded focus:outline-none focus:ring-1' : ''}`}
                      {...(isEditing
                        ? {
                            contentEditable: true,
                            suppressContentEditableWarning: true,
                          }
                        : {})}
                    >
                      {section.title}
                    </Title>
                  </div>

                  {(section.content || isEditing) && (
                    <MarkdownRenderer
                      ref={
                        isEditing
                          ? (el) => {
                              sectionRefs.current.set(index, el);
                            }
                          : undefined
                      }
                      content={section.content}
                      disableHeadings
                      editable={isEditing}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex min-h-[200px] items-center justify-center">
          <Text className="text-center text-fg-muted">내용이 없어요.</Text>
        </div>
      )}

      <RegenerateProgressNoteModal
        open={isRegenerateModalOpen}
        onOpenChange={setIsRegenerateModalOpen}
        onConfirm={handleRegenerateConfirm}
        isFirstRegeneration={isFirstRegeneration}
        templateName={note.title ?? undefined}
      />
    </div>
  );
};
