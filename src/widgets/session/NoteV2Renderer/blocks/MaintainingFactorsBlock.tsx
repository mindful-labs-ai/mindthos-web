import { cn } from '@/lib/cn';

import { CopyButton } from '../CopyButton';
import type { NoteV2Output } from '../types';
import { useCopyToClipboard } from '../useCopyToClipboard';

import { EDITABLE_CLASS } from './editable';

interface MaintainingFactorsBlockProps {
  maintaining: NoteV2Output['phase2']['maintaining_factors'];
  editable?: boolean;
}

export function MaintainingFactorsBlock({
  maintaining,
  editable,
}: MaintainingFactorsBlockProps) {
  const { copiedId, copy } = useCopyToClipboard();
  const copyText = [
    `내적 요인: ${maintaining.internal}`,
    `환경적 요인: ${maintaining.environmental}`,
    `악순환 패턴: ${maintaining.cycle}`,
  ].join('\n');

  return (
    <>
      <h3 className="mb-2 pl-2 text-l font-emphasize">유지 요인</h3>
      <div className="group relative space-y-3 rounded-lg px-3 py-2 transition-colors lg:hover:bg-grey-20">
        <div className="space-y-1">
          <span className="note-label">내적 요인</span>
          <p
            className={cn('note-desc', editable && EDITABLE_CLASS)}
            contentEditable={editable}
            suppressContentEditableWarning={editable}
            data-note-path={
              editable ? 'phase2.maintaining_factors.internal' : undefined
            }
          >
            {maintaining.internal || (editable ? '' : '—')}
          </p>
        </div>
        <div className="space-y-1">
          <span className="note-label">환경적 요인</span>
          <p
            className={cn('note-desc', editable && EDITABLE_CLASS)}
            contentEditable={editable}
            suppressContentEditableWarning={editable}
            data-note-path={
              editable ? 'phase2.maintaining_factors.environmental' : undefined
            }
          >
            {maintaining.environmental || (editable ? '' : '—')}
          </p>
        </div>
        <div className="space-y-1">
          <span className="note-label">악순환 패턴</span>
          <p
            className={cn('note-desc', editable && EDITABLE_CLASS)}
            contentEditable={editable}
            suppressContentEditableWarning={editable}
            data-note-path={
              editable ? 'phase2.maintaining_factors.cycle' : undefined
            }
          >
            {maintaining.cycle || (editable ? '' : '—')}
          </p>
        </div>
        {!editable && (
          <div className="note-copy-btn-wrapper">
            <CopyButton
              isCopied={copiedId === 'p2-maintaining'}
              onClick={() => copy(copyText, 'p2-maintaining')}
            />
          </div>
        )}
      </div>
    </>
  );
}

export function serializeMaintaining(
  maintaining: NoteV2Output['phase2']['maintaining_factors']
): string {
  return [
    `유지 요인`,
    `- 내적 요인: ${maintaining.internal}`,
    `- 환경적 요인: ${maintaining.environmental}`,
    `- 악순환 패턴: ${maintaining.cycle}`,
  ].join('\n');
}
