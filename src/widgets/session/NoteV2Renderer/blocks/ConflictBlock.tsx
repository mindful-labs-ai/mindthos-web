import { cn } from '@/lib/cn';

import { CopyButton } from '../CopyButton';
import { useCopyToClipboard } from '../useCopyToClipboard';

import { EDITABLE_CLASS } from './editable';

interface ConflictBlockProps {
  precipitants: string;
  coreDynamics: string;
  editable?: boolean;
}

export function ConflictBlock({
  precipitants,
  coreDynamics,
  editable,
}: ConflictBlockProps) {
  const { copiedId, copy } = useCopyToClipboard();
  const copyText = [
    `갈등 요인: ${precipitants}`,
    `핵심 갈등: ${coreDynamics}`,
  ].join('\n');

  return (
    <div className="group relative space-y-3 rounded-lg px-3 py-2 transition-colors lg:hover:bg-grey-20">
      <div className="space-y-1">
        <span className="note-label">갈등 요인</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={editable ? 'phase2.precipitants' : undefined}
        >
          {precipitants || (editable ? '' : '—')}
        </p>
      </div>
      <div className="space-y-1">
        <span className="note-label">핵심 갈등</span>
        <p
          className={cn('note-desc', editable && EDITABLE_CLASS)}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={editable ? 'phase2.core_dynamics' : undefined}
        >
          {coreDynamics || (editable ? '' : '—')}
        </p>
      </div>
      {!editable && (
        <div className="note-copy-btn-wrapper">
          <CopyButton
            isCopied={copiedId === 'p2-conflict'}
            onClick={() => copy(copyText, 'p2-conflict')}
          />
        </div>
      )}
    </div>
  );
}

export function serializeConflict(
  precipitants: string,
  coreDynamics: string
): string {
  return [`갈등 요인`, precipitants, ``, `핵심 갈등`, coreDynamics].join('\n');
}
