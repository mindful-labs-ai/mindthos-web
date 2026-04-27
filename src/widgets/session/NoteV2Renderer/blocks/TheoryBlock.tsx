import { cn } from '@/lib/cn';

import { CopyButton } from '../CopyButton';
import type { NoteV2Output } from '../types';
import { useCopyToClipboard } from '../useCopyToClipboard';

import { EDITABLE_CLASS } from './editable';

interface TheoryBlockProps {
  theory: NoteV2Output['phase1']['theory'];
  editable?: boolean;
}

export function TheoryBlock({ theory, editable }: TheoryBlockProps) {
  const { copiedId, copy } = useCopyToClipboard();
  const copyText = [
    `주 이론: ${theory.primary}`,
    theory.secondary ? `보조 이론: ${theory.secondary}` : '',
    `식별 근거: ${theory.evidence}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="group relative space-y-3 rounded-lg px-3 py-2 transition-colors lg:hover:bg-grey-20">
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
        <span className="note-label">확신도</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={editable ? 'phase1.theory.confidence' : undefined}
        >
          {theory.confidence || (editable ? '' : '—')}
        </p>
      </div>
      <div className="space-y-1">
        <span className="note-label">식별 근거</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={editable ? 'phase1.theory.evidence' : undefined}
        >
          {theory.evidence || (editable ? '' : '—')}
        </p>
      </div>
      {!editable && (
        <div className="note-copy-btn-wrapper">
          <CopyButton
            isCopied={copiedId === 'p1-theory'}
            onClick={() => copy(copyText, 'p1-theory')}
          />
        </div>
      )}
    </div>
  );
}

export function serializeTheory(
  theory: NoteV2Output['phase1']['theory']
): string {
  return [
    `적용된 상담 이론`,
    `- 주이론: ${theory.primary}`,
    theory.secondary ? `- 보조이론: ${theory.secondary}` : '',
    `- 확신도: ${theory.confidence}`,
    `- 식별 근거: ${theory.evidence}`,
  ]
    .filter(Boolean)
    .join('\n');
}
