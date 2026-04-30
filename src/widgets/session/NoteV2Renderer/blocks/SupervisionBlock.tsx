import { cn } from '@/lib/cn';
import { ArrowRightIcon } from '@/shared/icons';

import { CopyButton } from '../CopyButton';
import type { NoteV2Output } from '../types';
import { useCopyToClipboard } from '../useCopyToClipboard';

import { EDITABLE_CLASS } from './editable';

interface SupervisionBlockProps {
  supervision: NoteV2Output['phase4']['supervision'];
  editable?: boolean;
}

export function SupervisionBlock({
  supervision,
  editable,
}: SupervisionBlockProps) {
  const { copiedId, copy } = useCopyToClipboard();

  return (
    <div>
      <h3 className="mb-1 text-l font-emphasize">간이 슈퍼비전</h3>
      <div className="space-y-3 p-3">
        {supervision.map((sv, i) => (
          <div key={i} className="group relative rounded-lg transition-colors">
            {i > 0 && <hr className="mb-6 border-t border-grey-40" />}
            {/* Quote (Before) — grey card */}
            <div className="rounded-lg border border-grey-40 bg-grey-10 p-3">
              <div className="note-card-title">상담자 발언</div>
              <p className="note-card-sub">
                &ldquo;
                <span
                  contentEditable={editable}
                  suppressContentEditableWarning={editable}
                  data-note-path={
                    editable ? `phase4.supervision.${i}.quote` : undefined
                  }
                  className={editable ? EDITABLE_CLASS : undefined}
                >
                  {sv.quote}
                </span>
                &rdquo;
              </p>
            </div>

            {/* Transition arrow */}
            <div className="flex justify-center py-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-20">
                <ArrowRightIcon size={14} className="rotate-90 text-green-80" />
              </span>
            </div>

            {/* Alternative (After) — highlighted card */}
            <div className="rounded-lg border border-grey-40 bg-grey-10 p-3">
              <div className="note-card-title">대안 화법</div>
              <p className="note-card-sub">
                &ldquo;
                <span
                  contentEditable={editable}
                  suppressContentEditableWarning={editable}
                  data-note-path={
                    editable ? `phase4.supervision.${i}.alternative` : undefined
                  }
                  className={editable ? EDITABLE_CLASS : undefined}
                >
                  {sv.alternative}
                </span>
                &rdquo;
              </p>
            </div>

            {/* Evaluation & rationale — regular label/desc content */}
            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <span className="note-label">평가</span>
                <p
                  className={cn('note-desc', editable && EDITABLE_CLASS)}
                  contentEditable={editable}
                  suppressContentEditableWarning={editable}
                  data-note-path={
                    editable ? `phase4.supervision.${i}.evaluation` : undefined
                  }
                >
                  {sv.evaluation}
                </p>
              </div>
              <div className="space-y-1">
                <span className="note-label">근거</span>
                <p
                  className={cn('note-desc', editable && EDITABLE_CLASS)}
                  contentEditable={editable}
                  suppressContentEditableWarning={editable}
                  data-note-path={
                    editable ? `phase4.supervision.${i}.rationale` : undefined
                  }
                >
                  {sv.rationale}
                </p>
              </div>
            </div>

            {!editable && (
              <div className="note-copy-btn-wrapper">
                <CopyButton
                  isCopied={copiedId === `p4-sv-${i}`}
                  onClick={() =>
                    copy(
                      `상담자 발언: "${sv.quote}"\n평가: ${sv.evaluation}\n대안 화법: "${sv.alternative}"\n근거: ${sv.rationale}`,
                      `p4-sv-${i}`
                    )
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

export function serializeSupervision(
  supervision: NoteV2Output['phase4']['supervision']
): string {
  const items = supervision
    .map(
      (sv, i) =>
        `- 상담자 발언 ${i + 1}: "${sv.quote}"\n  평가: ${sv.evaluation}\n  대안 화법: "${sv.alternative}"\n  근거: ${sv.rationale}`
    )
    .join('\n');
  return [`간이 슈퍼비전`, items].join('\n');
}
