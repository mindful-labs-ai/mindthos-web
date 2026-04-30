import { cn } from '@/lib/cn';

import { EDITABLE_CLASS } from '../editable';

interface PrioritiesListProps {
  priorities: string[];
  editable?: boolean;
  /** "5-1-2" 등. 제공 시 라벨 앞에 "{prefix}. " 자동 부여. */
  numberPrefix?: string;
}

export function PrioritiesList({
  priorities,
  editable,
  numberPrefix,
}: PrioritiesListProps) {
  const labelText = numberPrefix
    ? `${numberPrefix}. 전략 우선순위`
    : '전략 우선순위';
  return (
    <div className="space-y-2">
      <span className="note-label">{labelText}</span>
      <ol className="list-none space-y-2 p-0">
        {priorities.map((p, i) => {
          const isFirst = i === 0;
          const isLast = i === priorities.length - 1;
          return (
            <li key={i} className="relative flex items-center gap-3">
              {!isFirst && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-2 bottom-[calc(50%+0.875rem)] left-3.5 w-px -translate-x-1/2 bg-grey-40"
                />
              )}
              <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-80 text-xs font-headline text-white">
                {i + 1}
              </span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-2 left-3.5 top-[calc(50%+0.875rem)] w-px -translate-x-1/2 bg-grey-40"
                />
              )}
              <div className="flex-1 rounded-lg border border-grey-40 bg-grey-10 px-3 py-2 transition-colors lg:hover:border-green-80">
                <span
                  className={cn('note-desc', editable && EDITABLE_CLASS)}
                  contentEditable={editable}
                  suppressContentEditableWarning={editable}
                  data-note-path={
                    editable ? `phase4.roadmap.priorities.${i}` : undefined
                  }
                >
                  {p}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function serializePriorities(priorities: string[]): string {
  return [
    `전략 우선순위:`,
    ...priorities.map((p, i) => `  ${i + 1}. ${p}`),
  ].join('\n');
}
