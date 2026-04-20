import { CopyButton } from '../CopyButton';
import type { NoteV2Output } from '../types';
import { useCopyToClipboard } from '../useCopyToClipboard';

import { EDITABLE_CLASS } from './editable';

interface KeyQuotesBlockProps {
  quotes: NoteV2Output['phase3']['key_quotes'];
  editable?: boolean;
}

export function KeyQuotesBlock({ quotes, editable }: KeyQuotesBlockProps) {
  const { copiedId, copy } = useCopyToClipboard();

  return (
    <div className="space-y-2 px-3">
      <span className="note-label">내담자 핵심 발언</span>
      {quotes.map((kq, i) => (
        <div
          key={i}
          className="group -mx-3 flex items-start gap-2 rounded-lg border border-grey-40 bg-grey-20 p-3 transition-colors ease-in-out lg:hover:border-green-80"
        >
          <div className="min-w-0 flex-1">
            <p className="typo-m font-emphasize text-fg">
              "
              <span
                contentEditable={editable}
                suppressContentEditableWarning={editable}
                data-note-path={
                  editable ? `phase3.key_quotes.${i}.quote` : undefined
                }
                className={editable ? EDITABLE_CLASS : undefined}
              >
                {kq.quote}
              </span>
              "
            </p>
            <p className="text-sm text-grey-80">
              →{' '}
              <span
                contentEditable={editable}
                suppressContentEditableWarning={editable}
                data-note-path={
                  editable ? `phase3.key_quotes.${i}.meaning` : undefined
                }
                className={editable ? EDITABLE_CLASS : undefined}
              >
                {kq.meaning}
              </span>
            </p>
          </div>
          {!editable && (
            <div className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
              <CopyButton
                isCopied={copiedId === `p3-quote-${i}`}
                onClick={() =>
                  copy(`"${kq.quote}" → ${kq.meaning}`, `p3-quote-${i}`)
                }
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function serializeKeyQuotes(
  quotes: NoteV2Output['phase3']['key_quotes']
): string {
  const lines = quotes
    .map((kq, i) => `${i + 1}. "${kq.quote}" → ${kq.meaning}`)
    .join('\n');
  return [`내담자 핵심 발언`, lines].join('\n');
}
