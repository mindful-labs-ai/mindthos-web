import { cn } from '@/lib/cn';

import { CopyButton } from '../CopyButton';
import type { NoteV2Output } from '../types';
import { useCopyToClipboard } from '../useCopyToClipboard';

import { EDITABLE_CLASS } from './editable';

interface TheorySectionBlockProps {
  section: NoteV2Output['phase2']['theory_section'];
  editable?: boolean;
}

export function TheorySectionBlock({
  section,
  editable,
}: TheorySectionBlockProps) {
  const { copiedId, copy } = useCopyToClipboard();

  return (
    <>
      <h3 className="mb-2 pl-2 text-l font-emphasize">이론 고유 분석</h3>
      <div className="group relative rounded-lg border border-green-80 bg-green-10 p-3">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-l font-emphasize text-primary">
            {section.title}
          </span>
        </div>
        <div className="space-y-4">
          {section.subsections?.map((sub, i) => (
            <div key={i} className="group">
              <div className="mb-1 flex items-center gap-2">
                <span className="note-label">{sub.subtitle}</span>
              </div>
              <p
                className={cn('note-desc', editable && EDITABLE_CLASS)}
                contentEditable={editable}
                suppressContentEditableWarning={editable}
                data-note-path={
                  editable
                    ? `phase2.theory_section.subsections.${i}.content`
                    : undefined
                }
              >
                {sub.content}
              </p>
            </div>
          ))}
        </div>
        {!editable && (
          <div className="note-copy-btn-wrapper">
            <CopyButton
              isCopied={copiedId === 'p2-theory-section'}
              onClick={() =>
                copy(serializeTheorySection(section), 'p2-theory-section')
              }
            />
          </div>
        )}
      </div>
    </>
  );
}

export function serializeTheorySection(
  section: NoteV2Output['phase2']['theory_section']
): string {
  const subs = section.subsections
    ?.map((sub) => `${sub.subtitle}: ${sub.content}`)
    .join('\n\n');
  return [`${section.title}`, '', subs].join('\n');
}
