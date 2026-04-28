import { ArrowRightIcon } from '@/shared/icons';

import { CopyButton } from '../CopyButton';
import type { NoteV2Output } from '../types';
import { toLines } from '../types';
import { useCopyToClipboard } from '../useCopyToClipboard';

import { EDITABLE_CLASS } from './editable';
import { ParagraphArray } from './ParagraphArray';

interface SupervisionBlockProps {
  supervision: NoteV2Output['phase4']['supervision'];
  editable?: boolean;
}

/**
 * comment 추출 정책:
 *  - 신규 노트: comment 필드(string[] 또는 string)를 우선.
 *  - 기존 노트: evaluation + rationale을 합쳐 단락 배열로 변환.
 */
function resolveComment(
  sv: NoteV2Output['phase4']['supervision'][number]
): string[] {
  if (sv.comment != null) {
    const lines = toLines(sv.comment);
    if (lines.length > 0) return lines;
  }
  const fallback: string[] = [];
  if (sv.evaluation && sv.evaluation.trim()) {
    fallback.push(sv.evaluation.trim());
  }
  if (sv.rationale && sv.rationale.trim()) {
    fallback.push(sv.rationale.trim());
  }
  return fallback;
}

export function SupervisionBlock({
  supervision,
  editable,
}: SupervisionBlockProps) {
  const { copiedId, copy } = useCopyToClipboard();

  return (
    <div className="space-y-8">
      {supervision.map((sv, i) => {
        const commentLines = resolveComment(sv);
        return (
          <section
            key={i}
            className="group/sv relative space-y-3"
            aria-label={`슈퍼비전 ${i + 1}`}
          >
            {/* 항목 separator + 라벨 */}
            <header className="flex items-center gap-3">
              <span className="whitespace-nowrap text-sm font-emphasize tabular-nums text-grey-80">
                슈퍼비전 {i + 1}
              </span>
              <span className="h-px flex-1 bg-grey-60" />
            </header>

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
            <div className="flex justify-center py-1">
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
                    editable
                      ? `phase4.supervision.${i}.alternative`
                      : undefined
                  }
                  className={editable ? EDITABLE_CLASS : undefined}
                >
                  {sv.alternative}
                </span>
                &rdquo;
              </p>
            </div>

            {/* Comment — quote와 alternative 통합 평가 */}
            <div className="mt-4 space-y-1">
              <span className="note-label">코멘트</span>
              <ParagraphArray
                value={commentLines}
                path={`phase4.supervision.${i}.comment`}
                editable={editable}
              />
            </div>

            {!editable && (
              <div className="absolute right-0 top-0 transition-opacity lg:opacity-0 lg:group-hover/sv:opacity-100">
                <CopyButton
                  isCopied={copiedId === `p4-sv-${i}`}
                  onClick={() =>
                    copy(
                      [
                        `[슈퍼비전 ${i + 1}]`,
                        `상담자 발언: "${sv.quote}"`,
                        `대안 화법: "${sv.alternative}"`,
                        `코멘트:`,
                        ...commentLines.map((l) => `- ${l}`),
                      ].join('\n'),
                      `p4-sv-${i}`
                    )
                  }
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function serializeSupervision(
  supervision: NoteV2Output['phase4']['supervision']
): string {
  const items = supervision
    .map((sv, i) => {
      const commentLines = resolveComment(sv);
      return [
        `[슈퍼비전 ${i + 1}]`,
        `- 상담자 발언: "${sv.quote}"`,
        `  대안 화법: "${sv.alternative}"`,
        `  코멘트:`,
        ...commentLines.map((l) => `    - ${l}`),
      ].join('\n');
    })
    .join('\n\n');
  return [`간이 슈퍼비전`, items].join('\n\n');
}
