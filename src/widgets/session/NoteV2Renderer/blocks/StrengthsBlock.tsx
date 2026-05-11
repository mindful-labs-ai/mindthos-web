import { toLines } from '../types';

import { ParagraphArray } from './ParagraphArray';

interface StrengthsBlockProps {
  value: string | string[];
  editable?: boolean;
}

export function StrengthsBlock({ value, editable }: StrengthsBlockProps) {
  return (
    <ParagraphArray value={value} path="phase2.strengths" editable={editable} />
  );
}

export function serializeStrengths(value: string | string[]): string {
  const lines = toLines(value);
  return (lines.length ? lines : ['—']).join('\n');
}
