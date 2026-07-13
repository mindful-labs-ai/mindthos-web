/**
 * 축어록 본문 텍스트 렌더러
 * 파싱된 TextPart를 비언어 칩으로, ⟪deid:⟫ 태그를 라벨 스팬으로 표시한다.
 * (파싱은 features/session/utils, 렌더링은 이 컴포넌트가 담당)
 */

import React from 'react';

import type { TextPart } from '@/features/session/utils/parseNonverbalText';
import { rendersNonverbalChips } from '@/features/session/utils/sttModel';
import {
  createDeidRegex,
  NONVERBAL_DEFAULT_LABELS,
} from '@/features/session/utils/transcriptTags';

import { DEID_LABEL_TEXT_CLASS, NV_CHIP_COLORS } from './transcriptChipStyles';

/**
 * TextPart 배열을 React 엘리먼트로 렌더링
 */
function renderTextWithNonverbal(
  parts: TextPart[],
  sttModel: string | null | undefined
): React.ReactNode {
  // 비언어 태그 렌더링이 필요한 모델만 칩으로 표시
  // (basic = 벤더 STT 기본 티어. 침묵 nv를 내므로 advanced와 동일하게 칩 렌더)
  if (!rendersNonverbalChips(sttModel)) {
    return parts.map((p) => p.content).join('');
  }

  return parts.map((part, index) => {
    if (part.type === 'text') {
      return <React.Fragment key={index}>{part.content}</React.Fragment>;
    }

    // 비언어 태그를 Chip으로 렌더링
    const label =
      part.content ||
      (part.tagType ? NONVERBAL_DEFAULT_LABELS[part.tagType] : '');

    if (!label) {
      return null;
    }

    const colors = NV_CHIP_COLORS[part.tagType || 'S'] || NV_CHIP_COLORS.S;

    return (
      <span
        key={index}
        className={`typo-xs mx-1 inline-flex items-center rounded-md border px-2 py-0.5 align-middle font-medium ${colors}`}
      >
        {label}
      </span>
    );
  });
}

/**
 * ReactNode 내의 문자열에서 ⟪deid:KEY|원본⟫ 태그를 styled span으로 교체
 * renderTextWithNonverbal 결과에 적용하여 deid 라벨을 orange-100 + font-headline으로 렌더
 */
function applyDeidStyling(
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
        <span key={`deid-${keyIdx++}`} className={DEID_LABEL_TEXT_CLASS}>
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

interface TranscriptTextProps {
  parts: TextPart[];
  sttModel?: string | null;
  /** 전달하면 텍스트 내 ⟪deid:⟫ 태그를 라벨 스팬으로 렌더 (비식별화 ON) */
  deid?: Record<string, string>;
}

export const TranscriptText: React.FC<TranscriptTextProps> = ({
  parts,
  sttModel,
  deid,
}) => {
  const content = renderTextWithNonverbal(parts, sttModel);
  return <>{deid ? applyDeidStyling(content, deid) : content}</>;
};
