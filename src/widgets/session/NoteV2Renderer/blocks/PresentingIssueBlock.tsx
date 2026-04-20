import { cn } from '@/lib/cn';

import { CopyButton } from '../CopyButton';
import { useCopyToClipboard } from '../useCopyToClipboard';

import { EDITABLE_CLASS } from './editable';

interface PresentingIssueBlockProps {
  value: string;
  editable?: boolean;
}

export function PresentingIssueBlock({
  value,
  editable,
}: PresentingIssueBlockProps) {
  const { copiedId, copy } = useCopyToClipboard();

  return (
    <div className="group relative space-y-1 rounded-lg px-3 py-2 transition-colors lg:hover:bg-grey-20">
      <span className="note-label">상담 주제</span>
      <p
        className={cn('note-desc', editable && EDITABLE_CLASS)}
        contentEditable={editable}
        suppressContentEditableWarning={editable}
        data-note-path={editable ? 'phase1.presenting_issue' : undefined}
      >
        {value || (editable ? '' : '—')}
      </p>
      {!editable && (
        <div className="note-copy-btn-wrapper">
          <CopyButton
            isCopied={copiedId === 'p1-issue'}
            onClick={() => copy(`상담 주제: ${value || '—'}`, 'p1-issue')}
          />
        </div>
      )}
    </div>
  );
}

export function serializePresentingIssue(value: string): string {
  return [`상담 주제`, `- ${value}`].join('\n');
}
