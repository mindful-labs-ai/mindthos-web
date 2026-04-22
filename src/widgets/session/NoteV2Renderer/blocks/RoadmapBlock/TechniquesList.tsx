import { cn } from '@/lib/cn';

import { CopyButton } from '../../CopyButton';
import type { NoteV2Output } from '../../types';
import { useCopyToClipboard } from '../../useCopyToClipboard';
import { EDITABLE_CLASS } from '../editable';

interface TechniquesListProps {
  techniques: NoteV2Output['phase4']['roadmap']['suggested_techniques'];
  editable?: boolean;
}

export function TechniquesList({ techniques, editable }: TechniquesListProps) {
  const { copiedId, copy } = useCopyToClipboard();

  return (
    <div className="space-y-2">
      <span className="note-label">제안 기법</span>
      <div className="space-y-2">
        {techniques.map((st, i) => (
          <div
            key={i}
            className="group relative flex items-start gap-2 rounded-lg border border-grey-40 bg-grey-10 p-3 transition-colors lg:hover:border-green-80"
          >
            <div className="min-w-0 flex-1">
              <p
                className={cn('note-card-title', editable && EDITABLE_CLASS)}
                contentEditable={editable}
                suppressContentEditableWarning={editable}
                data-note-path={
                  editable
                    ? `phase4.roadmap.suggested_techniques.${i}.name`
                    : undefined
                }
              >
                {st.name}
              </p>
              <p className="note-card-sub">
                <span
                  contentEditable={editable}
                  suppressContentEditableWarning={editable}
                  data-note-path={
                    editable
                      ? `phase4.roadmap.suggested_techniques.${i}.description`
                      : undefined
                  }
                  className={editable ? EDITABLE_CLASS : undefined}
                >
                  {st.description}
                </span>
              </p>
            </div>
            {!editable && (
              <div className="note-copy-btn-wrapper">
                <CopyButton
                  isCopied={copiedId === `p4-t-${i}`}
                  onClick={() =>
                    copy(`${st.name}: ${st.description}`, `p4-t-${i}`)
                  }
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function serializeTechniques(
  techniques: NoteV2Output['phase4']['roadmap']['suggested_techniques']
): string {
  return [
    `- 제안 기법:`,
    ...techniques.map((st) => `  - ${st.name}: ${st.description}`),
  ].join('\n');
}
