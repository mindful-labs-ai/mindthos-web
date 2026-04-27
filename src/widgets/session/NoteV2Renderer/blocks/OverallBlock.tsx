import { cn } from '@/lib/cn';

import { EDITABLE_CLASS } from './editable';

interface OverallBlockProps {
  value: string;
  editable?: boolean;
}

export function OverallBlock({ value, editable }: OverallBlockProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-green-40 bg-gradient-to-br from-green-20 via-green-10 to-white p-5 shadow-sm sm:p-6">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-green-80" />
      <p
        className={cn(
          'relative whitespace-pre-wrap text-m font-medium text-grey-100',
          editable && EDITABLE_CLASS
        )}
        contentEditable={editable}
        suppressContentEditableWarning={editable}
        data-note-path={editable ? 'phase4.overall_comment' : undefined}
      >
        {value || (editable ? '' : '—')}
      </p>
    </div>
  );
}

export function serializeOverall(value: string | null | undefined): string {
  return [`## 총평`, ``, value || '—'].join('\n');
}
