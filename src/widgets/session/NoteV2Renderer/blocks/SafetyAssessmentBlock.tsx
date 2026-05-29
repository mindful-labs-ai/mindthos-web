import { cn } from '@/lib/cn';

import type { NoteV2Output } from '../types';

import { EDITABLE_CLASS } from './editable';

interface SafetyAssessmentBlockProps {
  safety: NoteV2Output['phase1']['safety_assessment'];
  editable?: boolean;
  /** "2-3" 등. 제공 시 라벨 앞에 "{prefix}-{idx}. " 자동 부여. */
  numberPrefix?: string;
}

export function SafetyAssessmentBlock({
  safety,
  editable,
  numberPrefix,
}: SafetyAssessmentBlockProps) {
  const label = (idx: number, text: string) =>
    numberPrefix ? `${numberPrefix}-${idx}. ${text}` : text;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <span className="note-label">{label(1, '자해/자살')}</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={
            editable ? 'phase1.safety_assessment.suicide_self_harm' : undefined
          }
        >
          {safety.suicide_self_harm || (editable ? '' : '—')}
        </p>
      </div>
      <div className="space-y-1">
        <span className="note-label">{label(2, '타해 위험')}</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={
            editable ? 'phase1.safety_assessment.harm_to_others' : undefined
          }
        >
          {safety.harm_to_others || (editable ? '' : '—')}
        </p>
      </div>
      <div className="space-y-1">
        <span className="note-label">{label(3, '학대/방임')}</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={
            editable ? 'phase1.safety_assessment.abuse_neglect' : undefined
          }
        >
          {safety.abuse_neglect || (editable ? '' : '—')}
        </p>
      </div>
      <div className="space-y-1">
        <span className="note-label">{label(4, '즉각 조치')}</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={
            editable ? 'phase1.safety_assessment.immediate_action' : undefined
          }
        >
          {safety.immediate_action || (editable ? '' : '—')}
        </p>
      </div>
    </div>
  );
}

export function serializeSafety(
  safety: NoteV2Output['phase1']['safety_assessment']
): string {
  return [
    `자해/자살: ${safety.suicide_self_harm}`,
    `타해 위험: ${safety.harm_to_others}`,
    `학대/방임: ${safety.abuse_neglect}`,
    `즉각 조치: ${safety.immediate_action}`,
  ].join('\n');
}
