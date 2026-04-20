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
    <div className="space-y-3 p-3">
      <span className="note-label">간이 수퍼비전</span>
      {supervision.map((sv, i) => (
        <div
          key={i}
          className="group relative rounded-lg border border-grey-40 bg-grey-20 p-4 transition-colors lg:hover:border-green-80"
        >
          {/* Header */}
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-80 text-xs font-headline text-white">
              {i + 1}
            </span>
            <span className="typo-sm-emphasize text-grey-80">상담자 발언</span>
          </div>

          {/* Quote (Before) */}
          <blockquote className="rounded-md border-l-[3px] border-grey-60 bg-white px-3 py-2">
            <p className="typo-m text-grey-100">
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
          </blockquote>

          {/* Transition arrow */}
          <div className="flex justify-center py-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-20">
              <ArrowRightIcon size={14} className="rotate-90 text-green-80" />
            </span>
          </div>

          {/* Alternative (After) — highlighted */}
          <div className="rounded-md border border-green-40 bg-green-10 px-3 py-2">
            <div className="typo-xs-headline mb-1 text-green-80">대안 화법</div>
            <p className="typo-m text-grey-100">
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

          {/* Meta footer */}
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 border-t border-grey-40 pt-3 text-sm">
            <dt className="shrink-0 font-headline text-grey-80">평가</dt>
            <dd className="text-grey-80">
              <span
                contentEditable={editable}
                suppressContentEditableWarning={editable}
                data-note-path={
                  editable ? `phase4.supervision.${i}.evaluation` : undefined
                }
                className={editable ? EDITABLE_CLASS : undefined}
              >
                {sv.evaluation}
              </span>
            </dd>
            <dt className="shrink-0 font-headline text-grey-80">근거</dt>
            <dd className="text-grey-80">
              <span
                contentEditable={editable}
                suppressContentEditableWarning={editable}
                data-note-path={
                  editable ? `phase4.supervision.${i}.rationale` : undefined
                }
                className={editable ? EDITABLE_CLASS : undefined}
              >
                {sv.rationale}
              </span>
            </dd>
          </dl>

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
  return [`### 간이 수퍼비전`, items].join('\n');
}
