import type { NoteV2Output } from '../types';
import { toCycleSteps, toLines } from '../types';

import { CycleDiagram } from './CycleDiagram';
import { ParagraphArray } from './ParagraphArray';

interface MaintainingFactorsBlockProps {
  maintaining: NoteV2Output['phase2']['maintaining_factors'];
  editable?: boolean;
}

export function MaintainingFactorsBlock({
  maintaining,
  editable,
}: MaintainingFactorsBlockProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <span className="note-label">내적 요인</span>
        <ParagraphArray
          value={maintaining.internal}
          path="phase2.maintaining_factors.internal"
          editable={editable}
        />
      </div>
      <div className="space-y-1">
        <span className="note-label">환경적 요인</span>
        <ParagraphArray
          value={maintaining.environmental}
          path="phase2.maintaining_factors.environmental"
          editable={editable}
        />
      </div>
      <div className="space-y-2">
        <span className="note-label">악순환 패턴</span>
        <CycleDiagram value={maintaining.cycle} editable={editable} />
      </div>
    </div>
  );
}

export function serializeMaintaining(
  maintaining: NoteV2Output['phase2']['maintaining_factors']
): string {
  const internalLines = toLines(maintaining.internal);
  const environmentalLines = toLines(maintaining.environmental);
  const cycleSteps = toCycleSteps(maintaining.cycle);
  return [
    `유지 요인`,
    `내적 요인:`,
    ...internalLines.map((l) => `  ${l}`),
    `환경적 요인:`,
    ...environmentalLines.map((l) => `  ${l}`),
    `악순환 패턴: ${cycleSteps.join(' → ')}${cycleSteps.length >= 2 ? ' → (다시 처음으로)' : ''}`,
  ].join('\n');
}
