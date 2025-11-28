import React from 'react';

export interface TextPart {
  type: 'text' | 'nonverbal';
  content: string;
  tagType?: 'S' | 'A' | 'E' | 'O'; // Silence, Action, Emotion, Overlap
}

/**
 * {%...%} 패턴을 파싱하여 텍스트와 비언어 태그로 분리
 * 예시:
 * - {%S%} → { type: 'nonverbal', tagType: 'S', content: '' }
 * - {%A%한숨%} → { type: 'nonverbal', tagType: 'A', content: '한숨' }
 * - {%E%말을 왜 그렇게 해?%} → { type: 'nonverbal', tagType: 'E', content: '말을 왜 그렇게 해?' }
 */
export function parseNonverbalText(text: string): TextPart[] {
  const parts: TextPart[] = [];
  // 수정된 정규식: {%X%내용%} 또는 {%X%} 형태를 매칭
  const regex = /\{%([SAEO])%(?:([^%]+)%)?}/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // 태그 이전의 일반 텍스트
    if (match.index > lastIndex) {
      const textContent = text.slice(lastIndex, match.index);
      if (textContent) {
        parts.push({
          type: 'text',
          content: textContent,
        });
      }
    }

    // 비언어 태그
    const tagType = match[1] as 'S' | 'A' | 'E' | 'O';
    const tagContent = match[2] || ''; // match[2]는 내용 부분 (없으면 빈 문자열)

    parts.push({
      type: 'nonverbal',
      content: tagContent,
      tagType,
    });

    lastIndex = regex.lastIndex;
  }

  // 마지막 남은 텍스트
  if (lastIndex < text.length) {
    const textContent = text.slice(lastIndex);
    if (textContent) {
      parts.push({
        type: 'text',
        content: textContent,
      });
    }
  }

  return parts;
}

/**
 * 비언어 태그 표시 레이블
 */
const TAG_LABELS: Record<string, string> = {
  S: '침묵',
  A: '', // Action은 내용만 표시
  E: '', // Emotion은 내용만 표시
  O: '겹침',
};

/**
 * 비언어 태그 유형별 스타일 (배경색 + 텍스트 색상)
 */
const TAG_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  S: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-600',
  }, // 침묵 - 회색
  A: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-600',
  }, // 행동 - 파란색
  E: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-600',
  }, // 감정/강조 - 주황색
  O: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-600',
  }, // 겹침 - 보라색
};

/**
 * TextPart 배열을 React 엘리먼트로 렌더링
 */
export function renderTextWithNonverbal(
  parts: TextPart[],
  sttModel: string | null | undefined
): React.ReactNode {
  // gemini-3가 아니면 원본 텍스트 그대로 반환
  if (sttModel !== 'gemini-3') {
    return parts.map((p) => p.content).join('');
  }

  return parts.map((part, index) => {
    if (part.type === 'text') {
      return <React.Fragment key={index}>{part.content}</React.Fragment>;
    }

    // 비언어 태그를 Chip으로 렌더링
    const label = part.content
      ? part.content
      : TAG_LABELS[part.tagType || ''] || '';

    if (!label) {
      return null;
    }

    const tagType = part.tagType || 'S';
    const styles = TAG_STYLES[tagType] || TAG_STYLES.S;

    return (
      <span
        key={index}
        className={`mx-1 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium align-middle ${styles.bg} ${styles.text} ${styles.border}`}
      >
        {label}
      </span>
    );
  });
}
