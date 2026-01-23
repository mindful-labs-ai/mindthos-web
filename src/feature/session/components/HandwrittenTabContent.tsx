/**
 * 직접 입력 세션 탭 컨텐츠
 */

import React from 'react';

import type { HandwrittenTranscribe } from '../types';

interface HandwrittenTabContentProps {
  /** 스크롤 컨테이너 ref */
  contentScrollRef: React.RefObject<HTMLDivElement | null>;
  /** 전사 데이터 (직접 입력) */
  transcribe: HandwrittenTranscribe | null;
  /** 편집 중 여부 */
  isEditing: boolean;
  /** 편집 중인 텍스트 */
  editContent: string;
  /** 저장 중 여부 */
  isSaving: boolean;
  /** 편집 내용 변경 핸들러 */
  onContentChange: (content: string) => void;
}

export const HandwrittenTabContent: React.FC<HandwrittenTabContentProps> =
  React.memo(
    ({
      contentScrollRef,
      transcribe,
      isEditing,
      editContent,
      isSaving,
      onContentChange,
    }) => {
      return (
        <div
          key="handwritten-container"
          ref={contentScrollRef}
          className="h-full overflow-y-auto rounded-lg px-8 py-6"
        >
          {isEditing ? (
            // 편집 모드: textarea
            <textarea
              className="h-full min-h-[400px] w-full resize-none rounded-lg border border-border bg-surface p-4 text-fg focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              value={editContent}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="상담 내용을 입력하세요..."
              disabled={isSaving}
            />
          ) : transcribe && typeof transcribe.contents === 'string' ? (
            <div className="whitespace-pre-wrap leading-relaxed text-fg">
              {transcribe.contents}
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-fg-muted">입력된 텍스트가 없습니다.</p>
            </div>
          )}
        </div>
      );
    }
  );

HandwrittenTabContent.displayName = 'HandwrittenTabContent';
