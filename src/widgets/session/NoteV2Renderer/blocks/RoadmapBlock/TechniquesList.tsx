import { cn } from '@/lib/cn';

import { CopyButton } from '../../CopyButton';
import type { NoteV2Output } from '../../types';
import { toLines } from '../../types';
import { useCopyToClipboard } from '../../useCopyToClipboard';
import { EDITABLE_CLASS } from '../editable';
import { ParagraphArray } from '../ParagraphArray';

interface TechniquesListProps {
  techniques: NoteV2Output['phase4']['roadmap']['suggested_techniques'];
  editable?: boolean;
  /** "5-1-4" 등. 제공 시 라벨 앞에 "{prefix}. " 자동 부여. */
  numberPrefix?: string;
}

export function TechniquesList({
  techniques,
  editable,
  numberPrefix,
}: TechniquesListProps) {
  const { copiedId, copy } = useCopyToClipboard();
  const labelText = numberPrefix ? `${numberPrefix}. 제안 기법` : '제안 기법';

  return (
    <div className="space-y-2">
      <span className="note-label">{labelText}</span>
      <div className="space-y-2">
        {techniques.map((st, i) => {
          const descLines = toLines(st.description);
          return (
            <div
              key={i}
              className="group/technique relative flex items-start gap-2 rounded-lg border border-grey-40 bg-grey-10 p-3 transition-colors lg:hover:border-green-80"
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
                <div className="mt-1">
                  <ParagraphArray
                    value={st.description}
                    path={`phase4.roadmap.suggested_techniques.${i}.description`}
                    editable={editable}
                    className="note-card-sub"
                  />
                </div>
              </div>
              {!editable && (
                <div className="absolute right-3 top-1.5 transition-opacity lg:opacity-0 lg:group-hover/technique:opacity-100">
                  <CopyButton
                    isCopied={copiedId === `p4-t-${i}`}
                    onClick={() =>
                      copy(
                        [`${st.name}:`, ...descLines.map((l) => `  ${l}`)].join(
                          '\n'
                        ),
                        `p4-t-${i}`
                      )
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function serializeTechniques(
  techniques: NoteV2Output['phase4']['roadmap']['suggested_techniques']
): string {
  return [
    `제안 기법:`,
    techniques
      .map((st) => {
        const lines = toLines(st.description);
        return [`  ${st.name}:`, ...lines.map((l) => `    ${l}`)].join('\n');
      })
      .join('\n\n'),
  ]
    .filter(Boolean)
    .join('\n\n');
}
