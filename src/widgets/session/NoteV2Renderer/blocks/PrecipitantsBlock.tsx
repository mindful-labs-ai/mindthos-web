import { toLines } from '../types';

import { ParagraphArray } from './ParagraphArray';

interface PrecipitantsBlockProps {
  value: string | string[];
  editable?: boolean;
}

/** Phase 2 #3 — 촉발 요인. 자체 헤더 없음 (NumberedSection이 책임). */
export function PrecipitantsBlock({ value, editable }: PrecipitantsBlockProps) {
  return (
    <ParagraphArray
      value={value}
      path="phase2.precipitants"
      editable={editable}
    />
  );
}

export function serializePrecipitants(value: string | string[]): string {
  const lines = toLines(value);
  return (lines.length ? lines : ['—']).join('\n');
}
