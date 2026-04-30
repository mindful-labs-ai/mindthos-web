import { cn } from '@/lib/cn';

import type { NoteV2Output } from '../types';
import { toLines } from '../types';

import { EDITABLE_CLASS } from './editable';
import { ParagraphArray } from './ParagraphArray';

interface ObservationsBlockProps {
  observations: NoteV2Output['phase3']['observations'];
  editable?: boolean;
  /** "4-3" 등. 제공 시 라벨 앞에 "{prefix}-{idx}. " 자동 부여. */
  numberPrefix?: string;
}

export function ObservationsBlock({
  observations,
  editable,
  numberPrefix,
}: ObservationsBlockProps) {
  const label = (idx: number, text: string) =>
    numberPrefix ? `${numberPrefix}-${idx}. ${text}` : text;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <span className="note-label">{label(1, '통찰 수준')}</span>
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
        <span className="note-label">{label(2, '동기/협력')}</span>
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
        <span className="note-label">{label(3, '정서 상태')}</span>
        <ParagraphArray
          value={observations.emotional_state}
          path="phase3.observations.emotional_state"
          editable={editable}
        />
      </div>
    </div>
  );
}

export function serializeObservations(
  observations: NoteV2Output['phase3']['observations']
): string {
  const emotionalLines = toLines(observations.emotional_state);
  return [
    `관찰 소견`,
    `통찰 수준: ${observations.insight_level}`,
    `동기/협력: ${observations.motivation}`,
    `정서 상태:`,
    ...emotionalLines.map((l) => `  ${l}`),
  ].join('\n');
}
