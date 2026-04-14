import React from 'react';

export interface DeidPart {
  type: 'text' | 'deid';
  content: string; // text: 일반 텍스트, deid: 원본 텍스트
  label?: string; // 비식별화 라벨 (예: "인물1", "금액")
}

/**
 * ⟪deid:KEY|원본⟫ 태그를 파싱하여 텍스트와 비식별화 태그로 분리
 *
 * 예시:
 * - text: "⟪deid:d1|정미연⟫ 씨가 ⟪deid:d2|40만 원⟫을 보냈어요."
 * - deid: { "d1": "인물1", "d2": "금액" }
 * - 결과: [{ type:'deid', content:'정미연', label:'인물1' }, { type:'text', content:' 씨가 ' }, ...]
 */
export function parseDeidText(
  text: string,
  deid?: Record<string, string>
): DeidPart[] {
  if (!deid || Object.keys(deid).length === 0) {
    return [{ type: 'text', content: text }];
  }

  const parts: DeidPart[] = [];
  const regex = /⟪deid:(\w+)\|([^⟫]+)⟫/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    const key = match[1];
    const original = match[2];
    const label = deid[key];

    parts.push({
      type: 'deid',
      content: original,
      label: label || key,
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}

const DEID_STYLES = {
  bg: 'bg-violet-100 dark:bg-violet-900/30',
  text: 'text-violet-700 dark:text-violet-300',
  border: 'border-violet-300 dark:border-violet-600',
};

/**
 * deid 파싱 결과를 React 엘리먼트로 렌더링
 * @param showDeid true: 비식별화 라벨([인물1]) 표시, false: 원본 텍스트 표시
 */
export function renderDeidText(
  parts: DeidPart[],
  showDeid: boolean
): React.ReactNode {
  if (!showDeid) {
    // 비식별화 OFF: 원본 텍스트 그대로
    return parts.map((p) => p.content).join('');
  }

  return parts.map((part, index) => {
    if (part.type === 'text') {
      return <React.Fragment key={index}>{part.content}</React.Fragment>;
    }

    return (
      <span
        key={index}
        className={`typo-xs mx-0.5 inline-flex items-center rounded-md border px-1.5 py-0.5 align-middle font-medium ${DEID_STYLES.bg} ${DEID_STYLES.text} ${DEID_STYLES.border}`}
        title={part.content} // 호버 시 원본 텍스트 표시
      >
        {part.label}
      </span>
    );
  });
}

/**
 * deid 태그를 제거하고 텍스트만 추출
 * @param showDeid true: 라벨 텍스트 반환, false: 원본 텍스트 반환
 */
export function extractDeidText(
  text: string,
  deid?: Record<string, string>,
  showDeid?: boolean
): string {
  if (!deid || Object.keys(deid).length === 0) return text;

  return text.replace(/⟪deid:(\w+)\|([^⟫]+)⟫/g, (_, key, original) => {
    if (showDeid) {
      return `[${deid[key] || key}]`;
    }
    return original;
  });
}

/**
 * ReactNode 내의 문자열에서 ⟪deid:KEY|원본⟫ 태그를 styled span으로 교체
 * renderTextWithNonverbal 결과에 적용하여 deid 라벨을 orange-100 + font-headline으로 렌더
 */
export function applyDeidStyling(
  node: React.ReactNode,
  deid: Record<string, string>
): React.ReactNode {
  if (typeof node === 'string') {
    const regex = /⟪deid:(\w+)\|([^⟫]+)⟫/g;
    if (!regex.test(node)) return node;

    regex.lastIndex = 0;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIdx = 0;

    while ((match = regex.exec(node)) !== null) {
      if (match.index > lastIndex) {
        parts.push(node.slice(lastIndex, match.index));
      }
      const deidKey = match[1];
      const label = deid[deidKey] || deidKey;
      parts.push(
        <span key={`deid-${keyIdx++}`} className="font-headline text-orange-100">
          {label}
        </span>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < node.length) {
      parts.push(node.slice(lastIndex));
    }
    return <>{parts}</>;
  }

  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <React.Fragment key={i}>{applyDeidStyling(child, deid)}</React.Fragment>
    ));
  }

  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>;
    if (element.props.children) {
      return React.cloneElement(element, {
        ...element.props,
        children: applyDeidStyling(element.props.children, deid),
      });
    }
  }

  return node;
}
