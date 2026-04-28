import { toLines } from '../types';

import { ParagraphArray } from './ParagraphArray';

interface CoreDynamicsBlockProps {
  value: string | string[];
  editable?: boolean;
}

/** Phase 2 #4 — 핵심 역동. 자체 헤더 없음. */
export function CoreDynamicsBlock({ value, editable }: CoreDynamicsBlockProps) {
  return (
    <ParagraphArray
      value={value}
      path="phase2.core_dynamics"
      editable={editable}
    />
  );
}

export function serializeCoreDynamics(value: string | string[]): string {
  const lines = toLines(value);
  return [`### 4. 핵심 역동`, ``, ...(lines.length ? lines : ['—'])].join('\n');
}
