import { toLines } from '../types';

import { ParagraphArray } from './ParagraphArray';

interface DevelopmentalBlockProps {
  value: string | string[];
  editable?: boolean;
}

export function DevelopmentalBlock({
  value,
  editable,
}: DevelopmentalBlockProps) {
  return (
    <ParagraphArray
      value={value}
      path="phase2.developmental"
      editable={editable}
    />
  );
}

export function serializeDevelopmental(value: string | string[]): string {
  const lines = toLines(value);
  return (lines.length ? lines : ['—']).join('\n');
}
