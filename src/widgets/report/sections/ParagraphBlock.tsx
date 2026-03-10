/**
 * 본문 텍스트 블록
 *
 * [커스텀 가이드]
 * - style 종류: 'normal' (기본), 'highlight' (노란 배경), 'quote' (좌측 인용선)
 * - 각 스타일: styles.ts의 paragraph / paragraphHighlight / paragraphQuote
 * - 줄간격: lineHeight 값 조정
 * - 정렬: textAlign 변경 ('left' | 'center' | 'right' | 'justify')
 */

import { Text } from '@react-pdf/renderer';

import type { ParagraphSection } from '@/features/report/types/reportSchema';

import { styles } from '../styles';

export const ParagraphBlock = ({ section }: { section: ParagraphSection }) => {
  const style =
    section.style === 'highlight'
      ? styles.paragraphHighlight
      : section.style === 'quote'
        ? styles.paragraphQuote
        : styles.paragraph;

  return <Text style={style}>{section.content}</Text>;
};
