import { cn } from '@/lib/cn';

import { CopyButton } from '../CopyButton';
import { useCopyToClipboard } from '../useCopyToClipboard';

import { EDITABLE_CLASS } from './editable';

interface StrengthsBlockProps {
  value: string;
  editable?: boolean;
}

export function StrengthsBlock({ value, editable }: StrengthsBlockProps) {
  const { copiedId, copy } = useCopyToClipboard();

  return (
    <div className="group relative space-y-1 rounded-lg px-3 py-2 transition-colors lg:hover:bg-grey-20">
      <span className="note-label">강점 및 자원</span>
      <p
        className={cn('note-desc', editable && EDITABLE_CLASS)}
        contentEditable={editable}
        suppressContentEditableWarning={editable}
        data-note-path={editable ? 'phase2.strengths' : undefined}
      >
        {value || (editable ? '' : '—')}
      </p>
      {!editable && (
        <div className="note-copy-btn-wrapper">
          <CopyButton
            isCopied={copiedId === 'p2-strengths'}
            onClick={() =>
              copy(`강점 및 자원: ${value || '—'}`, 'p2-strengths')
            }
          />
        </div>
      )}
    </div>
  );
}

export function serializeStrengths(value: string): string {
  return [`강점 및 자원`, value].join('\n');
}
