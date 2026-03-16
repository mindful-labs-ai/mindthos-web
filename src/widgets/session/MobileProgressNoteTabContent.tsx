/**
 * 모바일 상담노트 탭 컨텐츠
 * 모바일 전용 패딩, 부모 스크롤 의존
 */

import React from 'react';

import type { ProgressNote } from '@/features/session/types';
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
      // 생성 중 또는 템플릿 선택 탭인 경우
      if (activeTab.startsWith('create-note-') || activeCreatingTab) {
        if (activeCreatingTab?.isProcessing) {
          return (
            <div className="flex h-full flex-col">
              <div className="flex h-full flex-col items-center justify-center gap-4 py-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-surface-strong border-t-primary"></div>
                <div className="text-center">
                  <Title as="h2" className="text-lg font-medium text-fg">
                    상담노트 작성 중...
                  </Title>
                  <p className="mt-2 text-sm text-fg-muted">
                    상담노트를 작성하고 있습니다.
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
            <div className="flex h-full flex-col px-4">
              <div className="sticky top-0 z-10 flex items-center justify-between bg-surface py-3">
                <div>
                  <Title as="h2" className="text-base text-fg-muted">
                    상담 노트 템플릿
                  </Title>
                </div>
                <button
                  onClick={onCreateProgressNote}
                  disabled={isReadOnly || !isTemplateSelected}
                  className={`flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    isReadOnly || !isTemplateSelected
                      ? 'cursor-not-allowed border-border bg-surface text-fg-muted'
                      : 'border-primary bg-primary text-white hover:bg-primary-600'
                  }`}
                >
                  상담 노트 만들기
                  <span
                    className={`flex items-center gap-0.5 ${
                      isReadOnly || !isTemplateSelected
                        ? 'text-fg-muted'
                        : 'text-surface'
                    }`}
                  >
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
              <p className="text-fg-muted">상담 노트를 선택해주세요.</p>
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
