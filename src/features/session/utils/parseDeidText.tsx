import React from 'react';

import { createDeidRegex } from './transcriptTags';

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

  return text.replace(createDeidRegex(), (_, key, original) => {
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
    const regex = createDeidRegex();
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
        <span
          key={`deid-${keyIdx++}`}
          className="font-headline text-orange-100"
        >
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
