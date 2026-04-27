/**
 * 모바일 상담노트 탭 컨텐츠
 * 모바일 전용 패딩, 부모 스크롤 의존
 */

import React from 'react';

import type { ProgressNote } from '@/features/session/types';
import { useDevice } from '@/shared/hooks/useDevice';
import { CreditIcon } from '@/shared/icons';
import { Title } from '@/shared/ui';

import { CreateProgressNoteView } from './CreateProgressNoteView';
import { MobileProgressNoteView } from './MobileProgressNoteView';

const PROGRESS_NOTE_CREDIT = 10;

interface ActiveCreatingTab {
  tabId: string;
  isProcessing: boolean;
  templateId: number | null;
}

interface MobileProgressNoteTabContentProps {
  contentScrollRef: React.RefObject<HTMLDivElement | null>;
  activeTab: string;
  activeCreatingTab: ActiveCreatingTab | null;
  creatingTabs: Record<string, number | null>;
  sessionId: string;
  transcribedText: string | null;
  progressNotes: ProgressNote[];
  isReadOnly: boolean;
  isRegenerating: boolean;
  onCreateProgressNote: () => Promise<void>;
  onRegenerateProgressNote: (templateId: number) => Promise<void>;
  onTemplateSelect: (templateId: number | null) => void;
  noteEndRef?: (node?: Element | null) => void;
  tutorialStep?: number;
  onSaveSummary?: (noteId: string, summary: string) => Promise<void>;
  onNoteEditStateChange?: (state: {
    isEditing: boolean;
    hasEdits: boolean;
    isSaving: boolean;
    onSave: () => void;
    onCancel: () => void;
  }) => void;
}

export const MobileProgressNoteTabContent: React.FC<MobileProgressNoteTabContentProps> =
  React.memo(
    ({
      contentScrollRef,
      activeTab,
      activeCreatingTab,
      creatingTabs,
      sessionId,
      transcribedText,
      progressNotes,
      isReadOnly,
      isRegenerating,
      onCreateProgressNote,
      onRegenerateProgressNote,
      onTemplateSelect,
      noteEndRef,
      tutorialStep,
      onSaveSummary,
      onNoteEditStateChange,
    }) => {
      const { isTablet } = useDevice();
      // 생성 중 또는 템플릿 선택 탭인 경우
      if (activeTab.startsWith('create-note-') || activeCreatingTab) {
        if (activeCreatingTab?.isProcessing) {
          return (
            <div className="flex h-full flex-col">
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-surface-strong border-t-primary"></div>
                <div className="text-center">
                  <Title as="h2" className="typo-l font-medium text-fg">
                    상담노트 작성 중...
                  </Title>
                  <p className="typo-sm mt-2 text-fg-muted">
                    상담노트를 작성하고 있어요.
                    <br />
                    잠시만 기다려주세요.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        if (activeTab in creatingTabs) {
          const isTemplateSelected = !!creatingTabs[activeTab];
          return (
            <div className="flex h-full flex-col px-4 md:px-10">
              <div className="sticky top-0 z-10 flex items-center justify-between bg-white py-3">
                <p className="text-sm text-grey-60 md:text-m">
                  상담노트 템플릿
                </p>
                <button
                  onClick={onCreateProgressNote}
                  disabled={isReadOnly || !isTemplateSelected}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors md:text-m ${
                    isReadOnly || !isTemplateSelected
                      ? 'cursor-not-allowed bg-grey-30 text-grey-60'
                      : 'bg-green-80 text-white lg:hover:opacity-90'
                  }`}
                >
                  상담노트 만들기
                  <span className="flex items-center gap-0.5">
                    {PROGRESS_NOTE_CREDIT}
                    <CreditIcon size={14} color="currentColor" />
                  </span>
                </button>
              </div>
              <div ref={contentScrollRef} className="py-4">
                <CreateProgressNoteView
                  sessionId={sessionId}
                  transcribedText={transcribedText}
                  usedTemplateIds={progressNotes
                    .filter((note) => note.processing_status !== 'failed')
                    .map((note) => note.template_id)
                    .filter(
                      (id): id is number => id !== null && id !== undefined
                    )}
                  selectedTemplateId={creatingTabs[activeTab] || null}
                  onTemplateSelect={onTemplateSelect}
                  columns={isTablet ? 2 : 1}
                />
              </div>
            </div>
          );
        }

        return (
          <div className="flex h-full flex-col">
            <div className="flex h-full items-center justify-center">
              <p className="text-fg-muted">잠시 기다려주세요...</p>
            </div>
          </div>
        );
      }

      const selectedNote = progressNotes.find((note) => note.id === activeTab);

      if (!selectedNote) {
        return (
          <div className="flex h-full flex-col">
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-fg-muted">상담노트를 선택해 주세요.</p>
            </div>
          </div>
        );
      }

      return (
        <div
          key={`note-container-${activeTab}`}
          className="flex h-full flex-col"
        >
          <div ref={contentScrollRef} className="py-4">
            <MobileProgressNoteView
              note={selectedNote}
              onRegenerate={
                selectedNote.template_id
                  ? () => onRegenerateProgressNote(selectedNote.template_id!)
                  : undefined
              }
              isRegenerating={isRegenerating}
              isReadOnly={isReadOnly}
              progressNotes={progressNotes}
              onSaveSummary={onSaveSummary}
              onEditStateChange={onNoteEditStateChange}
            />
            <div
              key={`scroll-target-note-${tutorialStep}`}
              ref={noteEndRef}
              className="h-4 w-full"
            />
          </div>
        </div>
      );
    }
  );

MobileProgressNoteTabContent.displayName = 'MobileProgressNoteTabContent';
