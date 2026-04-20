import { cn } from '@/lib/cn';

import { CopyButton } from '../CopyButton';
import type { NoteV2Output } from '../types';
import { useCopyToClipboard } from '../useCopyToClipboard';

import { EDITABLE_CLASS } from './editable';

interface ObservationsBlockProps {
  observations: NoteV2Output['phase3']['observations'];
  editable?: boolean;
}

export function ObservationsBlock({
  observations,
  editable,
}: ObservationsBlockProps) {
  const { copiedId, copy } = useCopyToClipboard();
  const copyText = [
    `통찰 수준: ${observations.insight_level}`,
    `동기/협력: ${observations.motivation}`,
    `정서 상태: ${observations.emotional_state}`,
  ].join('\n');

  return (
    <div className="group relative space-y-3 rounded-lg px-3 py-2 transition-colors lg:hover:bg-grey-20">
      <div className="space-y-1">
        <span className="note-label">통찰 수준</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={
            editable ? 'phase3.observations.insight_level' : undefined
          }
        >
          {observations.insight_level || (editable ? '' : '—')}
        </p>
      </div>
      <div className="space-y-1">
        <span className="note-label">동기/협력</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={
            editable ? 'phase3.observations.motivation' : undefined
          }
        >
          {observations.motivation || (editable ? '' : '—')}
        </p>
      </div>
      <div className="space-y-1">
        <span className="note-label">정서 상태</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={
            editable ? 'phase3.observations.emotional_state' : undefined
          }
        >
          {observations.emotional_state || (editable ? '' : '—')}
        </p>
      </div>

      {!editable && (
        <div className="note-copy-btn-wrapper">
          <CopyButton
            isCopied={copiedId === 'p3-observations'}
            onClick={() => copy(copyText, 'p3-observations')}
          />
        </div>
      )}
    </div>
  );
}

export function serializeObservations(
  observations: NoteV2Output['phase3']['observations']
): string {
  return [
    `### 관찰 소견`,
    `- 통찰 수준: ${observations.insight_level}`,
    `- 동기/협력: ${observations.motivation}`,
    `- 정서 상태: ${observations.emotional_state}`,
  ].join('\n');
}
