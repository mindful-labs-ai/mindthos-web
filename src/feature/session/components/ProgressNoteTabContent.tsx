/**
 * 상담노트 탭 컨텐츠
 * 템플릿 선택, 생성 중 상태, 완료된 노트 뷰를 처리
 */

import React from 'react';

import { Title } from '@/components/ui';

import type { ProgressNote } from '../types';

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
  noteEndRef: (node?: Element | null) => void;
  /** 튜토리얼 스텝 */
  tutorialStep?: number;
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
    }) => {
      // 생성 중 또는 템플릿 선택 탭인 경우
      if (activeTab.startsWith('create-note-') || activeCreatingTab) {
        // 처리 중 상태
        if (activeCreatingTab?.isProcessing) {
          return (
            <div className="flex h-full flex-col">
              <div className="flex h-full flex-col items-center justify-center gap-4 px-8 py-6">
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

        // 템플릿 선택 UI
        if (activeTab in creatingTabs) {
          return (
            <div className="flex h-full flex-col">
              {/* 우측 상단 생성 버튼 */}
              <div className="flex items-center justify-between px-8 py-4">
                <div>
                  <Title as="h2" className="text-base text-fg-muted">
                    상담 노트 템플릿
                  </Title>
                </div>
                <button
                  onClick={onCreateProgressNote}
                  disabled={isReadOnly || !creatingTabs[activeTab]}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isReadOnly || !creatingTabs[activeTab]
                      ? 'cursor-not-allowed bg-surface-contrast text-fg-muted'
                      : 'bg-primary text-white hover:bg-primary-600'
                  }`}
                >
                  상담 노트 작성하기
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
                />
              </div>
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
