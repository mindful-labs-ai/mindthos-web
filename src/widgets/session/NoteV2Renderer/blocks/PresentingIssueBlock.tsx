import { cn } from '@/lib/cn';

import { EDITABLE_CLASS } from './editable';

interface PresentingIssueBlockProps {
  value: string;
  editable?: boolean;
}

export function PresentingIssueBlock({
  value,
  editable,
}: PresentingIssueBlockProps) {
  return (
    <p
      className={cn('note-desc', editable && EDITABLE_CLASS)}
      contentEditable={editable}
      suppressContentEditableWarning={editable}
      data-note-path={editable ? 'phase1.presenting_issue' : undefined}
    >
      {value || (editable ? '' : '—')}
    </p>
  );
}

export function serializePresentingIssue(value: string): string {
  return value || '—';
}
