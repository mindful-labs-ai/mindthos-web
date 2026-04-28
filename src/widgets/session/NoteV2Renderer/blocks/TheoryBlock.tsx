import { cn } from '@/lib/cn';

import type { NoteV2Output } from '../types';

import { EDITABLE_CLASS } from './editable';
import { ParagraphArray } from './ParagraphArray';

interface TheoryBlockProps {
  theory: NoteV2Output['phase1']['theory'];
  editable?: boolean;
}

export function TheoryBlock({ theory, editable }: TheoryBlockProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <span className="note-label">주 이론</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={editable ? 'phase1.theory.primary' : undefined}
        >
          {theory.primary || (editable ? '' : '—')}
        </p>
      </div>
      {(theory.secondary || editable) && (
        <div className="space-y-1">
          <span className="note-label">보조 이론</span>
          <p
            className={cn('note-desc', editable && EDITABLE_CLASS)}
            contentEditable={editable}
            suppressContentEditableWarning={editable}
            data-note-path={editable ? 'phase1.theory.secondary' : undefined}
          >
            {theory.secondary || (editable ? '' : '—')}
          </p>
        </div>
      )}
      <div className="space-y-1">
        <span className="note-label">식별 근거</span>
        <ParagraphArray
          value={theory.evidence}
          path="phase1.theory.evidence"
          editable={editable}
        />
      </div>
    </div>
  );
}

export function serializeTheory(
  theory: NoteV2Output['phase1']['theory']
): string {
  const evidenceLines = Array.isArray(theory.evidence)
    ? theory.evidence
    : theory.evidence
    ? [theory.evidence]
    : [];
  return [
    `적용된 상담 이론`,
    `- 주이론: ${theory.primary}`,
    theory.secondary ? `- 보조이론: ${theory.secondary}` : '',
    `- 식별 근거:`,
    ...evidenceLines.map((l) => `  - ${l}`),
  ]
    .filter(Boolean)
    .join('\n');
}
