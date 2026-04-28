import type { NoteV2Output } from '../types';
import { toLines } from '../types';

import { ParagraphArray } from './ParagraphArray';

interface InterventionsBlockProps {
  interventions: NoteV2Output['phase3']['interventions'];
  editable?: boolean;
}

export function InterventionsBlock({
  interventions,
  editable,
}: InterventionsBlockProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <span className="note-label">주요 개입</span>
        <ParagraphArray
          value={interventions.major}
          path="phase3.interventions.major"
          editable={editable}
        />
      </div>
      <div className="space-y-1">
        <span className="note-label">이론적 적합성</span>
        <ParagraphArray
          value={interventions.theoretical_fit}
          path="phase3.interventions.theoretical_fit"
          editable={editable}
        />
      </div>
      <div className="space-y-1">
        <span className="note-label">효과 근거</span>
        <ParagraphArray
          value={interventions.evidence}
          path="phase3.interventions.evidence"
          editable={editable}
        />
      </div>
    </div>
  );
}

export function serializeInterventions(
  interventions: NoteV2Output['phase3']['interventions']
): string {
  const majorLines = toLines(interventions.major);
  const fitLines = toLines(interventions.theoretical_fit);
  const evidenceLines = toLines(interventions.evidence);
  return [
    `금회기 개입 분석`,
    `- 주요 개입:`,
    ...majorLines.map((l) => `  - ${l}`),
    `- 이론적 적합성:`,
    ...fitLines.map((l) => `  - ${l}`),
    `- 효과 근거:`,
    ...evidenceLines.map((l) => `  - ${l}`),
  ].join('\n');
}
