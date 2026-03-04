import React, { useState } from 'react';

import { Text } from '@/components/ui/atoms/Text';
import { Title } from '@/components/ui/atoms/Title';
import { MarkdownRenderer } from '@/components/ui/composites/MarkdownRenderer';
import { useToast } from '@/components/ui/composites/Toast';
import { trackEvent } from '@/lib/mixpanel';
import { useMarkdownEditSession } from '@/shared/hooks/useMarkdownEditSession';
import { CheckIcon, CopyIcon } from '@/shared/icons';
import { domToMarkdown } from '@/shared/utils/domToMarkdown';
import { removeNonverbalTags } from '@/shared/utils/removeNonverbalTag';

import type { ProgressNote } from '../types';

import { RegenerateProgressNoteModal } from './RegenerateProgressNoteModal';

interface ProgressNoteViewProps {
  note: ProgressNote;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  isReadOnly?: boolean;
  progressNotes?: ProgressNote[];
  onSaveSummary?: (noteId: string, summary: string) => Promise<void>;
}

interface NoteSection {
  title: string;
  content: string;
  rawHeading: string;
}

/** rawHeading에서 prefix(## , **1. 등)를 추출하여 편집된 제목과 재조합 */
const rebuildHeading = (rawHeading: string, editedTitle: string): string => {
  // ## 제목 형태
  const hashMatch = rawHeading.match(/^(#{1,4}\s*)/);
  if (hashMatch) return `${hashMatch[1]}${editedTitle}`;

  // **1. 제목** 또는 1. 제목 형태
  const numMatch = rawHeading.match(/^(\*{0,2}\d+\.\s*)/);
  if (numMatch) return `${numMatch[1]}${editedTitle}`;

  // A (소제목): 내용 형태
  const letterMatch = rawHeading.match(/^([A-Z]\s*\([^)]+\)\s*:\s*)/);
  if (letterMatch) return `${letterMatch[1]}${editedTitle}`;

  return editedTitle;
};

/** summary를 섹션별로 파싱 (컴포넌트 외부 순수 함수) */
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

  // 섹션별 DOM ref (편집 시 마크다운 추출용)
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

  // 섹션별 DOM에서 마크다운 추출 → rawHeading과 합쳐 전체 summary 재조립
  const extractSectionsContent = React.useCallback((): string => {
    return sections
      .map((section, index) => {
        const contentRef = sectionRefs.current.get(index);
        const titleRef = titleRefs.current.get(index);

        const editedContent = contentRef
          ? domToMarkdown(contentRef).trim()
          : section.content.trim();

        // 편집된 제목 텍스트로 rawHeading 재구성
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

  // 전체 문서 편집 훅
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
      editStart: 'progress_note_edit_start',
      editCancel: 'progress_note_edit_cancel',
      editComplete: 'progress_note_edit_complete',
    },
    trackingMeta: {
      note_id: note.id,
      session_id: note.session_id,
    },
  });

  // 섹션 영역에서 input 이벤트 감지 → hasEdits 설정
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
      trackEvent('progress_note_copy', { section_index: index });
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
      trackEvent('progress_note_copy_all');
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
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <Title as="h2" className="text-base font-bold text-fg-muted">
          {note.title || '상담 노트'}
        </Title>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <>
              {onSaveSummary && !isReadOnly && (
                <button
                  type="button"
                  onClick={handleEditStart}
                  disabled={isRegenerating}
                  className={`flex items-center gap-1.5 rounded-md border border-border px-3 py-1 text-sm text-fg-muted transition-all hover:bg-surface-contrast hover:text-fg ${
                    isRegenerating ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  aria-label="노트 편집"
                >
                  <span>편집</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1 text-sm text-fg-muted transition-all hover:bg-surface-contrast hover:text-fg"
                aria-label="전체 복사"
              >
                {copiedAll ? (
                  <>
                    <CheckIcon size={18} className="text-success" />
                    <span className="text-success">복사됨</span>
                  </>
                ) : (
                  <>
                    <CopyIcon size={20} />
                    <span>복사하기</span>
                  </>
                )}
              </button>
              {onRegenerate && (
                <button
                  type="button"
                  onClick={handleRegenerateClick}
                  disabled={isReadOnly || isRegenerating}
                  className={`flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1 text-sm text-fg-muted transition-colors ${
                    isReadOnly || isRegenerating
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:bg-surface-contrast'
                  }`}
                  aria-label="노트 재생성"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={isRegenerating ? 'animate-spin' : ''}
                  >
                    <path
                      d="M8.33447 13.3333H4.16781V17.5M11.6678 6.66667H15.8345V2.5M3.82031 7.50284C4.28755 6.34638 5.06984 5.3442 6.07826 4.61019C7.08669 3.87618 8.28185 3.4396 9.52593 3.35042C10.77 3.26125 12.0134 3.52284 13.1162 4.10551C14.219 4.68819 15.1355 5.56878 15.7629 6.64677M16.1824 12.4976C15.7152 13.654 14.9329 14.6562 13.9245 15.3902C12.9161 16.1242 11.7221 16.5602 10.478 16.6494C9.23395 16.7386 7.98953 16.477 6.88672 15.8944C5.78391 15.3117 4.86682 14.4313 4.23942 13.3533"
                      stroke="#A2A2A2"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{isRegenerating ? '재생성 중...' : '노트 재생성'}</span>
                </button>
              )}
            </>
          )}

          {isEditing && (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="rounded-md border border-border px-3 py-1 text-sm text-fg-muted transition-colors hover:bg-surface-contrast"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!hasEdits || isSaving}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  hasEdits && !isSaving
                    ? 'bg-primary text-white hover:bg-primary-600'
                    : 'cursor-not-allowed bg-surface-contrast text-fg-muted'
                }`}
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 마크다운 문서 렌더링 - 뷰/편집 모두 동일한 섹션 구조 */}
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

                    {/* 섹션 복사 버튼 (편집 중이 아닐 때만) */}
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
