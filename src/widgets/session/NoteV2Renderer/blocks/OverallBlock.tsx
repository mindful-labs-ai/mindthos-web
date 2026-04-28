import { cn } from '@/lib/cn';

import { toLines } from '../types';

import { EDITABLE_CLASS } from './editable';

interface OverallBlockProps {
  value: string | string[] | null | undefined;
  editable?: boolean;
}

export function OverallBlock({ value, editable }: OverallBlockProps) {
  const lines = toLines(value);
  const isEmpty = lines.length === 0;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-green-40 bg-gradient-to-br from-green-20 via-green-10 to-white p-5 shadow-sm sm:p-6">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-green-80" />
      <div
        className={cn(
          'relative space-y-3 text-m font-medium text-grey-100',
          editable && EDITABLE_CLASS
        )}
        contentEditable={editable}
        suppressContentEditableWarning={editable}
        data-note-path={editable ? 'phase4.overall_comment' : undefined}
        data-note-array={editable ? 'true' : undefined}
      >
        {isEmpty ? (
          <p>{editable ? '' : '—'}</p>
        ) : (
          lines.map((line, i) => <p key={i}>{line}</p>)
        )}
      </div>
    </div>
  );
}

export function serializeOverall(
  value: string | string[] | null | undefined
): string {
  const lines = toLines(value);
  return [`## 총평`, ``, ...(lines.length ? lines : ['—'])].join('\n');
}
