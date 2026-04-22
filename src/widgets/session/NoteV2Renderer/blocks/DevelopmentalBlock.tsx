import { cn } from '@/lib/cn';

import { CopyButton } from '../CopyButton';
import { useCopyToClipboard } from '../useCopyToClipboard';

import { EDITABLE_CLASS } from './editable';

interface DevelopmentalBlockProps {
  value: string;
  editable?: boolean;
}

export function DevelopmentalBlock({
  value,
  editable,
}: DevelopmentalBlockProps) {
  const { copiedId, copy } = useCopyToClipboard();

  return (
    <div className="group relative space-y-1 rounded-lg px-3 py-2 transition-colors lg:hover:bg-grey-20">
      <span className="note-label">발달적 맥락</span>
      <p
        className={cn('note-desc', editable && EDITABLE_CLASS)}
        contentEditable={editable}
        suppressContentEditableWarning={editable}
        data-note-path={editable ? 'phase2.developmental' : undefined}
      >
        {value || (editable ? '' : '—')}
      </p>
      {!editable && (
        <div className="note-copy-btn-wrapper">
          <CopyButton
            isCopied={copiedId === 'p2-dev'}
            onClick={() => copy(`발달적 맥락: ${value || '—'}`, 'p2-dev')}
          />
        </div>
      )}
    </div>
  );
}

export function serializeDevelopmental(value: string): string {
  return [`발달적 맥락`, value].join('\n');
}
