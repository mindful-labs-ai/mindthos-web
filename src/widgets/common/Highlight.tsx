import React from 'react';

import { cn } from '@/lib/cn';
import { highlightMatches } from '@/lib/searchUtils';

interface HighlightProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Highlight - 검색어 하이라이트 컴포넌트
 * 한글 초성 매칭과 일반 텍스트 매칭 지원
 *
 * @example
 * <Highlight text="김성곤" query="ㄱㅅㄱ" />
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
