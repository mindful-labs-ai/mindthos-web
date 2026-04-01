/**
 * 모바일 직접 입력 세션 탭 컨텐츠
 */

import React from 'react';

import type { HandwrittenTranscribe } from '@/features/session/types';
import { Text } from '@/shared/ui/atoms/Text';

const MIN_CONTENT_LENGTH = 100;
const MAX_CONTENT_LENGTH = 50000;

interface MobileHandwrittenTabContentProps {
  contentScrollRef: React.RefObject<HTMLDivElement | null>;
  transcribe: HandwrittenTranscribe | null;
  isEditing: boolean;
  editContent: string;
  isSaving: boolean;
  onContentChange: (content: string) => void;
}

export const MobileHandwrittenTabContent: React.FC<MobileHandwrittenTabContentProps> =
  React.memo(
    ({
      contentScrollRef,
      transcribe,
      isEditing,
      editContent,
      isSaving,
      onContentChange,
    }) => {
      const contentLength = editContent.length;
      const isUnderLimit = contentLength < MIN_CONTENT_LENGTH;
      const isOverLimit = contentLength > MAX_CONTENT_LENGTH;

      return (
        <div
          key="handwritten-container"
          ref={contentScrollRef}
          className="flex min-h-[calc(100dvh-250px)] flex-col rounded-lg px-4 py-4 transition-colors md:px-6"
        >
          {isEditing ? (
            <>
              <textarea
                className="m-0 flex-1 resize-none overflow-y-auto whitespace-pre-wrap bg-transparent text-sm leading-relaxed text-grey-100 focus:outline-none md:text-m"
                value={editContent}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="상담 내용을 입력하세요..."
                disabled={isSaving}
              />
              <Text
                className={`typo-sm mt-2 flex-shrink-0 text-right ${
                  isOverLimit || isUnderLimit ? 'text-red-500' : 'text-fg-muted'
                }`}
              >
                {contentLength.toLocaleString()}자 (최소{' '}
                {MIN_CONTENT_LENGTH.toLocaleString()} / 최대{' '}
                {MAX_CONTENT_LENGTH.toLocaleString()})
              </Text>
            </>
          ) : transcribe && typeof transcribe.contents === 'string' ? (
            <div className="h-full w-full overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-grey-100 md:text-m">
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

MobileHandwrittenTabContent.displayName = 'MobileHandwrittenTabContent';
