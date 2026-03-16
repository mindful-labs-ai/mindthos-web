/**
 * 모바일 상담노트 뷰
 * sticky 헤더 + kebab → bottomSheet 메뉴, onEditStateChange 콜백
 */

import React, { useState } from 'react';

import type { ProgressNote } from '@/features/session/types';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useMarkdownEditSession } from '@/shared/hooks/useMarkdownEditSession';
import { CheckIcon, CopyIcon } from '@/shared/icons';
import { Text } from '@/shared/ui/atoms/Text';
import { Title } from '@/shared/ui/atoms/Title';
import { MarkdownRenderer } from '@/shared/ui/composites/MarkdownRenderer';
import { Modal } from '@/shared/ui/composites/Modal';
import { useToast } from '@/shared/ui/composites/Toast';
import { domToMarkdown } from '@/shared/utils/domToMarkdown';
import { removeNonverbalTags } from '@/shared/utils/removeNonverbalTag';

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

interface NoteSection {
  title: string;
  content: string;
  rawHeading: string;
}

/** rawHeading에서 prefix(## , **1. 등)를 추출하여 편집된 제목과 재조합 */
const rebuildHeading = (rawHeading: string, editedTitle: string): string => {
  const hashMatch = rawHeading.match(/^(#{1,4}\s*)/);
  if (hashMatch) return `${hashMatch[1]}${editedTitle}`;

  const numMatch = rawHeading.match(/^(\*{0,2}\d+\.\s*)/);
  if (numMatch) return `${numMatch[1]}${editedTitle}`;

  const letterMatch = rawHeading.match(/^([A-Z]\s*\([^)]+\)\s*:\s*)/);
  if (letterMatch) return `${letterMatch[1]}${editedTitle}`;

  return editedTitle;
};

/** summary를 섹션별로 파싱 */
const parseSummary = (summary: string): NoteSection[] => {
  const sections: NoteSection[] = [];
  const cleanedSummary = removeNonverbalTags(summary);
  const lines = cleanedSummary.split('\n');
  let currentSection: NoteSection | null = null;

  const removeBoldMarkers = (text: string): string =>
    text.replace(/\*\*/g, '').trim();

  lines.forEach((line) => {
    if (/^#{1,4}\s/.test(line)) {
      if (currentSection) sections.push(currentSection);
      const rawTitle = line.replace(/^#{1,4}\s*/, '').trim();
      currentSection = {
        title: removeBoldMarkers(rawTitle),
        content: '',
        rawHeading: line,
      };
    } else if (/^\*{0,2}\d+\.\s+/.test(line)) {
      if (currentSection) sections.push(currentSection);
      const rawTitle = line.replace(/^\*{0,2}\d+\.\s*/, '').trim();
      currentSection = {
        title: removeBoldMarkers(rawTitle),
        content: '',
        rawHeading: line,
      };
    } else if (/^[A-Z]\s*\([^)]+\)\s*:\s/.test(line)) {
      if (currentSection) sections.push(currentSection);
      const colonIndex = line.indexOf('):');
      currentSection = {
        title: line.substring(0, colonIndex + 1).trim(),
        content: line.substring(colonIndex + 2).trim(),
        rawHeading: line.substring(0, colonIndex + 2),
      };
    } else if (currentSection) {
      currentSection.content += (currentSection.content ? '\n' : '') + line;
    }
  });

  if (currentSection) sections.push(currentSection);
  return sections;
};

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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const sectionRefs = React.useRef<Map<number, HTMLDivElement | null>>(
    new Map()
  );
  const titleRefs = React.useRef<Map<number, HTMLHeadingElement | null>>(
    new Map()
  );

  const sections = React.useMemo(
    () => (note.summary ? parseSummary(note.summary) : []),
    [note.summary]
  );

  const extractSectionsContent = React.useCallback((): string => {
    return sections
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
  }, [sections]);

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

  // 편집 상태를 Container로 전달 (compact-nav 액션 연동)
  React.useEffect(() => {
    onEditStateChange?.({
      isEditing,
      hasEdits,
      isSaving,
      onSave: handleSaveEdit,
      onCancel: handleCancelEdit,
    });
  }, [
    isEditing,
    hasEdits,
    isSaving,
    handleSaveEdit,
    handleCancelEdit,
    onEditStateChange,
  ]);

  // 섹션 영역에서 input 이벤트 감지
  const sectionsContainerRef = React.useRef<HTMLDivElement>(null);
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

  const isProcessing =
    note.processing_status === 'pending' ||
    note.processing_status === 'in_progress';
  const isFailed = note.processing_status === 'failed';

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      trackEvent(MixpanelEvent.ProgressNoteCopy, { section_index: index });
      toast({
        title: '복사 완료',
        description: '클립보드에 내용이 복사되었습니다.',
        duration: 2000,
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      toast({
        title: '복사 실패',
        description: '내용을 복사하는 데 실패했습니다.',
        duration: 3000,
      });
    }
  };

  const handleCopyAll = async () => {
    if (!note.summary) return;
    try {
      await navigator.clipboard.writeText(note.summary);
      setCopiedAll(true);
      trackEvent(MixpanelEvent.ProgressNoteCopyAll);
      toast({
        title: '복사 완료',
        description: '전체 내용이 클립보드에 복사되었습니다.',
        duration: 2000,
      });
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      toast({
        title: '복사 실패',
        description: '내용을 복사하는 데 실패했습니다.',
        duration: 3000,
      });
    }
  };

  if (isProcessing) {
    return (
      <div className="space-y-4 text-left">
        <div className="mb-6 flex items-center justify-between">
          <Title as="h2" className="text-base font-bold text-fg-muted">
            {note.title || '상담 노트'}
          </Title>
        </div>
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-surface-strong border-t-primary"></div>
          <div className="text-center">
            <Text className="text-lg font-medium text-fg">
              상담노트 작성 중...
            </Text>
            <Text className="mt-2 text-sm text-fg-muted">
              {note.processing_status === 'pending'
                ? '대기 중입니다. 잠시만 기다려주세요.'
                : 'AI가 상담 내용을 분석하고 있습니다.'}
            </Text>
          </div>
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="space-y-4 text-left">
        <div className="mb-6 flex items-center justify-between">
          <Title as="h2" className="text-base font-bold text-fg-muted">
            {note.title || '상담 노트'}
          </Title>
        </div>
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-danger"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
              fill="currentColor"
            />
          </svg>
          <div className="text-center">
            <Text className="text-lg font-medium text-danger">
              상담노트 작성 실패
            </Text>
            <Text className="mt-2 text-sm text-fg-muted">
              {note.error_message || '상담노트 작성 중 오류가 발생했습니다.'}
            </Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {/* 모바일 sticky 헤더 + 케밥 메뉴 */}
      <div className="sticky top-0 z-10 mb-6 flex items-center justify-between bg-surface px-4 py-2">
        <Title as="h2" className="text-base font-bold text-fg-muted">
          {note.title || '상담 노트'}
        </Title>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              <button
                type="button"
                className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                onClick={() => setIsMenuOpen(true)}
                aria-label="추가 메뉴"
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
              <Modal
                open={isMenuOpen}
                onOpenChange={setIsMenuOpen}
                mobileVariant="bottomSheet"
              >
                <div className="w-full space-y-1">
                  {onSaveSummary && !isReadOnly && (
                    <button
                      onClick={() => {
                        handleEditStart();
                        setIsMenuOpen(false);
                      }}
                      disabled={isRegenerating}
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
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span className="text-sm text-fg">편집</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleCopyAll();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-surface"
                  >
                    <CopyIcon size={18} className="text-fg-muted" />
                    <span className="text-sm text-fg">복사하기</span>
                  </button>
                  {onRegenerate && (
                    <button
                      onClick={() => {
                        handleRegenerateClick();
                        setIsMenuOpen(false);
                      }}
                      disabled={isReadOnly || isRegenerating}
                      className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-surface disabled:opacity-50"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 20 20"
                        fill="none"
                        className="text-fg-muted"
                      >
                        <path
                          d="M8.33447 13.3333H4.16781V17.5M11.6678 6.66667H15.8345V2.5M3.82031 7.50284C4.28755 6.34638 5.06984 5.3442 6.07826 4.61019C7.08669 3.87618 8.28185 3.4396 9.52593 3.35042C10.77 3.26125 12.0134 3.52284 13.1162 4.10551C14.219 4.68819 15.1355 5.56878 15.7629 6.64677M16.1824 12.4976C15.7152 13.654 14.9329 14.6562 13.9245 15.3902C12.9161 16.1242 11.7221 16.5602 10.478 16.6494C9.23395 16.7386 7.98953 16.477 6.88672 15.8944C5.78391 15.3117 4.86682 14.4313 4.23942 13.3533"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-sm text-fg">
                        {isRegenerating ? '재생성 중...' : '노트 재생성'}
                      </span>
                    </button>
                  )}
                </div>
              </Modal>
            </>
          )}
        </div>
      </div>

      {/* 마크다운 문서 렌더링 */}
      {note.summary ? (
        <div className="relative">
          {sections.length === 0 ? (
            <div className="rounded-lg px-2 py-1">
              <MarkdownRenderer content={note.summary} editable={isEditing} />
            </div>
          ) : (
            <div ref={sectionsContainerRef} className="space-y-6">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={`group relative rounded-lg px-2 py-1 ${!isEditing ? 'hover:bg-surface-contrast' : ''}`}
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
                      className={`text-lg font-semibold text-fg${isEditing ? 'focus:ring-primary/50 cursor-text bg-primary-50 focus:rounded focus:outline-none focus:ring-1' : ''}`}
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
                        className="relative flex-shrink-0 rounded-lg p-2 text-fg-muted opacity-0 transition-all hover:bg-surface-contrast hover:text-fg group-hover:opacity-100"
                        aria-label="복사"
                      >
                        {copiedIndex === index ? (
                          <CheckIcon size={18} className="text-success" />
                        ) : (
                          <CopyIcon />
                        )}
                        <span className="pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-xs text-bg opacity-0 transition-opacity hover:opacity-100">
                          {copiedIndex === index ? '복사됨' : '복사'}
                        </span>
                      </button>
                    )}
                  </div>

                  <MarkdownRenderer
                    ref={
                      isEditing
                        ? (el) => {
                            sectionRefs.current.set(index, el);
                          }
                        : undefined
                    }
                    content={section.content || '내용이 없습니다.'}
                    disableHeadings
                    editable={isEditing}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex min-h-[200px] items-center justify-center">
          <Text className="text-center text-fg-muted">내용이 없습니다.</Text>
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
