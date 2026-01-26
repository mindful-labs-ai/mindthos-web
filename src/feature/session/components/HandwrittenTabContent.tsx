/**
 * 직접 입력 세션 탭 컨텐츠
 */

import React from 'react';

import { Text } from '@/components/ui/atoms/Text';

import type { HandwrittenTranscribe } from '../types';

const MIN_CONTENT_LENGTH = 100;
const MAX_CONTENT_LENGTH = 50000;

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
      const contentLength = editContent.length;
      const isUnderLimit = contentLength < MIN_CONTENT_LENGTH;
      const isOverLimit = contentLength > MAX_CONTENT_LENGTH;

      return (
        <div
          key="handwritten-container"
          ref={contentScrollRef}
          className="flex h-full flex-col overflow-y-scroll rounded-lg p-8 transition-colors"
        >
          {isEditing ? (
            // 편집 모드: textarea (배경만 변경, 위치 동일)
            <>
              <textarea
                className="m-0 min-h-0 flex-1 resize-none overflow-y-auto whitespace-pre-wrap bg-transparent leading-relaxed text-fg focus:outline-none"
                value={editContent}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="상담 내용을 입력하세요..."
                disabled={isSaving}
              />
              <Text
                className={`mt-2 flex-shrink-0 text-right text-sm ${
                  isOverLimit || isUnderLimit ? 'text-red-500' : 'text-fg-muted'
                }`}
              >
                {contentLength.toLocaleString()}자 (최소{' '}
                {MIN_CONTENT_LENGTH.toLocaleString()} / 최대{' '}
                {MAX_CONTENT_LENGTH.toLocaleString()})
              </Text>
            </>
          ) : transcribe && typeof transcribe.contents === 'string' ? (
            <div className="h-full w-full overflow-y-auto whitespace-pre-wrap break-words leading-relaxed text-fg">
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
