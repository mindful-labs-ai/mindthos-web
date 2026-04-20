import { cn } from '@/lib/cn';

import { CopyButton } from '../CopyButton';
import type { NoteV2Output } from '../types';
import { useCopyToClipboard } from '../useCopyToClipboard';

import { EDITABLE_CLASS } from './editable';

interface InterventionsBlockProps {
  interventions: NoteV2Output['phase3']['interventions'];
  editable?: boolean;
}

export function InterventionsBlock({
  interventions,
  editable,
}: InterventionsBlockProps) {
  const { copiedId, copy } = useCopyToClipboard();
  const copyText = [
    `주요 개입: ${interventions.major}`,
    `이론적 적합성: ${interventions.theoretical_fit}`,
    `효과 근거: ${interventions.evidence}`,
  ].join('\n');

  return (
    <div className="group relative space-y-3 rounded-lg px-3 py-2 transition-colors lg:hover:bg-grey-20">
      <div className="space-y-1">
        <span className="note-label">주요 개입</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={editable ? 'phase3.interventions.major' : undefined}
        >
          {interventions.major || (editable ? '' : '—')}
        </p>
      </div>
      <div className="space-y-1">
        <span className="note-label">이론적 적합성</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={
            editable ? 'phase3.interventions.theoretical_fit' : undefined
          }
        >
          {interventions.theoretical_fit || (editable ? '' : '—')}
        </p>
      </div>
      <div className="space-y-1">
        <span className="note-label">효과 근거</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={
            editable ? 'phase3.interventions.evidence' : undefined
          }
        >
          {interventions.evidence || (editable ? '' : '—')}
        </p>
      </div>

      {!editable && (
        <div className="note-copy-btn-wrapper">
          <CopyButton
            isCopied={copiedId === 'p3-interventions'}
            onClick={() => copy(copyText, 'p3-interventions')}
          />
        </div>
      )}
    </div>
  );
}

export function serializeInterventions(
  interventions: NoteV2Output['phase3']['interventions']
): string {
  return [
    `금회기 개입 분석`,
    `- 주요 개입: ${interventions.major}`,
    `- 이론적 적합성: ${interventions.theoretical_fit}`,
    `- 효과 근거: ${interventions.evidence}`,
  ].join('\n');
}
