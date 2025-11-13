import React from 'react';

import { cn } from '@/lib/cn';
import { highlightMatches } from '@/lib/searchUtils';

interface HighlightProps {
  /**
   * 원본 텍스트
   */
  text: string;
  /**
   * 검색어
   */
  query: string;
  /**
   * 하이라이트 스타일
   */
  className?: string;
  /**
   * 하이라이트 배경색 클래스
   * @default 'bg-primary-100 text-primary-700'
   */
  highlightClassName?: string;
}

/**
 * Highlight - 검색어 하이라이트 컴포넌트
 *
 * 텍스트에서 검색어에 매칭되는 부분을 하이라이트 표시합니다.
 * 일반 텍스트 매칭과 한글 초성 매칭을 모두 지원합니다.
 *
 * @example
 * ```tsx
 * <Highlight text="김성곤" query="ㄱㅅㄱ" />
 * <Highlight text="김성곤" query="성" />
 * ```
 */
export const Highlight: React.FC<HighlightProps> = ({
  text,
  query,
  className,
  highlightClassName = 'bg-primary-100 text-primary-700',
}) => {
  const parts = highlightMatches(text, query);

  return (
    <span className={cn(className)}>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {part.highlight ? (
            <mark
              className={cn('rounded px-0.5 font-semibold', highlightClassName)}
            >
              {part.text}
            </mark>
          ) : (
            part.text
          )}
        </React.Fragment>
      ))}
    </span>
  );
};
