import { cn } from '@/lib/cn';

import { CopyButton } from './CopyButton';
import { useCopyToClipboard } from './useCopyToClipboard';

const EDITABLE_CLASS =
  'cursor-text rounded-md bg-green-20 break-word w-fit focus:outline-none focus:ring-1 focus:ring-primary/50';

interface NoteFieldProps {
  label: string;
  value: string | null | undefined;
  id: string;
  /** 라벨:값 형태가 아닌 값만 복사할 때 true */
  copyValueOnly?: boolean;
  editable?: boolean;
  /** 편집 시 DOM에서 값을 추출하기 위한 JSON path (예: "phase1.presenting_issue") */
  notePath?: string;
}

/** 단일 필드: 라벨 + 값 + 개별 복사 */
export function NoteField({
  label,
  value,
  id,
  copyValueOnly,
  editable,
  notePath,
}: NoteFieldProps) {
  const { copiedId, copy } = useCopyToClipboard();
  const displayValue = value || (editable ? '' : '—');
  const textToCopy = copyValueOnly ? value || '—' : `${label}: ${value || '—'}`;

  return (
    <div className="group flex items-start gap-2">
      <div className="min-w-0 flex-1 p-3">
        <span className="typo-sm font-emphasize text-fg-muted">{label}</span>
        <p
          className={cn(
            'typo-m mt-0.5 whitespace-pre-wrap text-fg',
            editable && EDITABLE_CLASS
          )}
          contentEditable={editable}
          suppressContentEditableWarning={editable}
          data-note-path={editable ? notePath : undefined}
        >
          {displayValue}
        </p>
      </div>
      {!editable && (
        <div className="mt-1 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
          <CopyButton
            isCopied={copiedId === id}
            onClick={() => copy(textToCopy, id)}
          />
        </div>
      )}
    </div>
  );
}

interface NoteSubFieldProps {
  items: Record<string, string | null | undefined>;
  id: string;
  editable?: boolean;
  /** label → dotted JSON path (편집 시 DOM 추출용) */
  notePaths?: Record<string, string>;
}

/** 하위 필드 그룹: 여러 key-value를 묶어서 표시 */
export function NoteSubFields({
  items,
  id,
  editable,
  notePaths,
}: NoteSubFieldProps) {
  const { copiedId, copy } = useCopyToClipboard();
  const entries = Object.entries(items).filter(([, v]) => v || editable);
  const textToCopy = entries.map(([k, v]) => `${k}: ${v || '—'}`).join('\n');

  return (
    <div className="group space-y-1.5 rounded-lg bg-bg-subtle p-3">
      {entries.map(([key, value]) => (
        <div key={key}>
          <span className="typo-sm font-emphasize text-fg-subtle">{key}</span>
          <p
            className={cn(
              'typo-m whitespace-pre-wrap text-fg',
              editable && EDITABLE_CLASS
            )}
            contentEditable={editable}
            suppressContentEditableWarning={editable}
            data-note-path={editable ? notePaths?.[key] : undefined}
          >
            {value || (editable ? '' : '—')}
          </p>
        </div>
      ))}
      {!editable && (
        <div className="pt-1 opacity-0 transition-opacity group-hover:opacity-100">
          <CopyButton
            isCopied={copiedId === id}
            onClick={() => copy(textToCopy, id)}
          />
        </div>
      )}
    </div>
  );
}
