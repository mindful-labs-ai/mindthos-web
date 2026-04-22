/**
 * 데스크톱 상담노트 탭 컨텐츠
 * 템플릿 선택, 생성 중 상태, 완료된 노트 뷰를 처리
 */

import React from 'react';

import type { ProgressNote } from '@/features/session/types';
import { XIcon } from '@/shared/icons';
import { Title } from '@/shared/ui';

import { CreateProgressNoteView } from './CreateProgressNoteView';
import { ProgressNoteView } from './ProgressNoteView';

interface ActiveCreatingTab {
  tabId: string;
  isProcessing: boolean;
  templateId: number | null;
}

interface ProgressNoteTabContentProps {
  /** 스크롤 컨테이너 ref */
  contentScrollRef: React.RefObject<HTMLDivElement | null>;
  /** 현재 활성 탭 ID */
  activeTab: string;
  /** 현재 활성화된 생성 탭 정보 */
  activeCreatingTab: ActiveCreatingTab | null;
  /** 템플릿 선택 중인 탭들 */
  creatingTabs: Record<string, number | null>;
  /** 세션 ID */
  sessionId: string;
  /** 전사 내용 (raw_output 또는 직접 입력 텍스트) */
  transcribedText: string | null;
  /** 세션의 상담노트들 */
  progressNotes: ProgressNote[];
  /** 읽기 전용 여부 */
  isReadOnly: boolean;
  /** 재생성 중 여부 */
  isRegenerating: boolean;
  /** 상담노트 생성 핸들러 */
  onCreateProgressNote: () => Promise<void>;
  /** 상담노트 재생성 핸들러 */
  onRegenerateProgressNote: (templateId: number) => Promise<void>;
  /** 템플릿 선택 핸들러 */
  onTemplateSelect: (templateId: number | null) => void;
  /** 노트 스크롤 끝 감지용 ref */
  noteEndRef?: (node?: Element | null) => void;
  /** 튜토리얼 스텝 */
  tutorialStep?: number;
  /** 상담노트 summary 저장 핸들러 */
  onSaveSummary?: (noteId: string, summary: string) => Promise<void>;
}

export const ProgressNoteTabContent: React.FC<ProgressNoteTabContentProps> =
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
    }) => {
      // 생성 중 또는 템플릿 선택 탭인 경우
      if (activeTab.startsWith('create-note-') || activeCreatingTab) {
        // 처리 중 상태
        if (activeCreatingTab?.isProcessing) {
          return (
            <div className="flex h-full flex-col">
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 py-6">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-surface-strong border-t-primary"></div>
                <div className="text-center">
                  <Title as="h2" className="typo-l font-medium text-fg">
                    상담노트 작성 중...
                  </Title>
                  <p className="typo-sm mt-2 text-fg-muted">
                    상담노트를 작성하고 있습니다.
                    <br />
                    잠시만 기다려주세요.
                  </p>
                </div>
              </div>
            </div>
          );
        }

        // 템플릿 선택 UI
        if (activeTab in creatingTabs) {
          const isTemplateSelected = !!creatingTabs[activeTab];
          return (
            <div className="relative flex h-full flex-col">
              {/* 상단 헤더 */}
              <div className="flex items-center justify-between px-8 py-4">
                <p className="text-m text-grey-60">상담 노트 템플릿</p>
                <button
                  onClick={onCreateProgressNote}
                  disabled={isReadOnly || !isTemplateSelected}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-m font-medium transition-colors ${
                    isReadOnly || !isTemplateSelected
                      ? 'cursor-not-allowed bg-grey-30 text-grey-60'
                      : 'bg-green-80 text-white lg:hover:opacity-90'
                  }`}
                >
                  상담 노트 만들기
                </button>
              </div>
              {/* CreateProgressNoteView */}
              <div
                ref={contentScrollRef}
                className="flex-1 overflow-y-auto px-8 py-6"
              >
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
                  columns={2}
                />
              </div>
              {/* 하단 배너 (템플릿 선택 시) */}
              {isTemplateSelected && (
                <div className="absolute inset-x-0 bottom-4 flex justify-center px-8">
                  <div className="relative flex w-full max-w-[570px] items-center justify-between rounded-md border border-grey-30 bg-grey-10 py-6 pl-9 pr-11 shadow-lg">
                    <button
                      type="button"
                      onClick={() => onTemplateSelect(null)}
                      className="text-grey-50 absolute right-3 top-3 lg:hover:text-grey-80"
                      aria-label="닫기"
                    >
                      <XIcon size={24} />
                    </button>
                    <p className="text-sm font-medium text-grey-70">
                      상담 노트 생성에 10 크레딧을 사용합니다.
                    </p>
                    <button
                      onClick={onCreateProgressNote}
                      disabled={isReadOnly}
                      className="rounded-lg border border-grey-40 bg-white px-4 py-2 text-sm font-headline text-grey-100 transition-colors lg:hover:bg-grey-10"
                    >
                      상담 노트 만들기
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        }

        // 알 수 없는 상태
        return (
          <div className="flex h-full flex-col">
            <div className="flex h-full items-center justify-center">
              <p className="text-fg-muted">잠시 기다려주세요...</p>
            </div>
          </div>
        );
      }

      // 완료된 상담노트 표시
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
          {/* 상담노트 콘텐츠 */}
          <div
            ref={contentScrollRef}
            className="flex-1 overflow-y-auto px-8 py-6"
          >
            <ProgressNoteView
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
            />
            {/* 상담노트용 스크롤 감지 타겟 */}
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

ProgressNoteTabContent.displayName = 'ProgressNoteTabContent';
