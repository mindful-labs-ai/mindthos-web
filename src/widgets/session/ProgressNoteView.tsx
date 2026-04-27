import React, { useState } from 'react';

import type { ProgressNote } from '@/features/session/types';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useMarkdownEditSession } from '@/shared/hooks/useMarkdownEditSession';
import { CheckIcon, CopyIcon } from '@/shared/icons';
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

interface ProgressNoteViewProps {
  note: ProgressNote;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  isReadOnly?: boolean;
  progressNotes?: ProgressNote[];
  onSaveSummary?: (noteId: string, summary: string) => Promise<void>;
}

export const ProgressNoteView: React.FC<ProgressNoteViewProps> = ({
  note,
  onRegenerate,
  isRegenerating = false,
  isReadOnly = false,
  progressNotes = [],
  onSaveSummary,
}) => {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(stripMarkdown(content));
      setCopiedIndex(index);
      trackEvent(MixpanelEvent.ProgressNoteCopy, { section_index: index });
      toast({
        title: '복사 완료',
        description: '내용을 복사했어요.',
        duration: 2000,
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      toast({
        title: '복사 실패 — 다시 시도해 주세요.',
        description: '내용을 복사하지 못했어요.',
        duration: 3000,
      });
    }
  };

  if (format.kind === 'v2') {
    const { noteV2 } = format;
    return (
      <div className="space-y-4 text-left">
        <div className="mb-6 px-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline text-grey-100">
              {note.title || '상담노트'}
            </h2>
            <ProgressNoteToolbar
              variant="desktop"
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
          <p className="mt-1 text-sm text-grey-60">
            {note.created_at &&
              `${new Date(note.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 작성됨`}
          </p>
          <div className="mt-4 border-b border-grey-30" />
        </div>

        <div ref={v2ContainerRef}>
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
      <div className="mb-6 px-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-headline text-grey-100">
            {note.title || '상담노트'}
          </h2>
          <ProgressNoteToolbar
            variant="desktop"
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
        <p className="mt-1 text-sm text-grey-60">
          {note.created_at &&
            `${new Date(note.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 작성됨`}
        </p>
        <div className="mt-4 border-b border-grey-30" />
      </div>

      {note.summary ? (
        <div className="relative">
          {v1Sections.length === 0 ? (
            <div className="rounded-lg px-2 py-1">
              <MarkdownRenderer content={note.summary} editable={isEditing} />
            </div>
          ) : (
            <div ref={sectionsContainerRef} className="space-y-6">
              {v1Sections.map((section, index) => (
                <div
                  key={index}
                  className={`group relative rounded-lg px-2 py-1 ${!isEditing ? 'lg:hover:bg-surface-contrast' : ''}`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <Title
                      ref={
                        isEditing
                          ? (el: HTMLHeadingElement | null) => {
                              titleRefs.current.set(index, el);
                            }
                          : undefined
                      }
                      as="h3"
                      className={`typo-l font-emphasize text-fg${isEditing ? 'focus:ring-primary/50 cursor-text bg-primary-subtle focus:rounded focus:outline-none focus:ring-1' : ''}`}
                      {...(isEditing
                        ? {
                            contentEditable: true,
                            suppressContentEditableWarning: true,
                          }
                        : {})}
                    >
                      {section.title}
                    </Title>

                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => handleCopy(section.content, index)}
                        className="relative flex-shrink-0 rounded-lg p-2 text-fg-muted opacity-0 transition-all lg:hover:bg-surface-contrast lg:hover:text-fg lg:hover:opacity-100"
                        aria-label="복사"
                      >
                        {copiedIndex === index ? (
                          <CheckIcon size={18} className="text-success" />
                        ) : (
                          <CopyIcon />
                        )}
                        <span className="typo-xs pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-bg opacity-0 transition-opacity lg:hover:opacity-100">
                          {copiedIndex === index ? '복사됨' : '복사'}
                        </span>
                      </button>
                    )}
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
