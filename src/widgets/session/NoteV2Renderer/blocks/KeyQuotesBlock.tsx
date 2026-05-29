import { CopyButton } from '../CopyButton';
import type { NoteV2Output } from '../types';
import { toLines } from '../types';
import { useCopyToClipboard } from '../useCopyToClipboard';

import { EDITABLE_CLASS } from './editable';
import { ParagraphArray } from './ParagraphArray';

interface KeyQuotesBlockProps {
  quotes: NoteV2Output['phase3']['key_quotes'];
  editable?: boolean;
}

export function KeyQuotesBlock({ quotes, editable }: KeyQuotesBlockProps) {
  const { copiedId, copy } = useCopyToClipboard();

  return (
    <div className="space-y-2">
      {quotes.map((kq, i) => {
        const meaningLines = toLines(kq.meaning);
        const meaningJoined = meaningLines.join(' ');
        return (
          <div
            key={i}
            className="group/quote relative rounded-lg border border-grey-40 bg-grey-10 p-3 transition-colors ease-in-out lg:hover:border-green-80"
          >
            <div className="min-w-0 space-y-1.5">
              <p className="note-card-title">
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
              {editable ? (
                <div className="flex items-start gap-1">
                  <span className="note-card-sub shrink-0">→</span>
                  <ParagraphArray
                    value={kq.meaning}
                    path={`phase3.key_quotes.${i}.meaning`}
                    editable
                    className="note-card-sub"
                  />
                </div>
              ) : (
                meaningLines.length > 0 && (
                  <p className="note-card-sub">→ {meaningJoined}</p>
                )
              )}
            </div>
            {!editable && (
              <div className="absolute right-3 top-1.5 transition-opacity lg:opacity-0 lg:group-hover/quote:opacity-100">
                <CopyButton
                  isCopied={copiedId === `p3-quote-${i}`}
                  onClick={() =>
                    copy(`"${kq.quote}" → ${meaningJoined}`, `p3-quote-${i}`)
                  }
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function serializeKeyQuotes(
  quotes: NoteV2Output['phase3']['key_quotes']
): string {
  const lines = quotes
    .map((kq, i) => {
      const meaningLines = toLines(kq.meaning);
      return `${i + 1}. "${kq.quote}" → ${meaningLines.join(' ')}`;
    })
    .join('\n');
  return lines || '—';
}
