import { cn } from '@/lib/cn';

import { toLines } from '../types';

import { EDITABLE_CLASS } from './editable';

interface ParagraphArrayProps {
  value: string | string[] | null | undefined;
  /** 편집 시 부여할 data-note-path. 추출 시 NoteV2Renderer가 string[]로 재구성. */
  path?: string;
  editable?: boolean;
  className?: string;
  /** 편집 모드에서 빈 배열일 때 보여줄 자리표시자. */
  placeholder?: string;
}

/**
 * 다문장 분석 필드용 단락 배열 렌더러.
 *
 * - 읽기: `<p>` 단락 N개로 표시.
 * - 편집: 컨테이너가 contentEditable. 사용자가 Enter로 단락 추가/삭제 가능.
 *   추출 시점에 NoteV2Renderer.extractNoteV2가 path 화이트리스트를 보고
 *   자식 `<p>` 또는 줄바꿈 기준으로 split 하여 string[]로 재구성한다.
 *
 * - 빈 입력: 읽기는 "—", 편집은 빈 단락 1개.
 */
export function ParagraphArray({
  value,
  path,
  editable,
  className,
  placeholder,
}: ParagraphArrayProps) {
  const lines = toLines(value);

  if (!editable) {
    if (lines.length === 0) {
      return <p className={cn('note-desc', className)}>—</p>;
    }
    return (
      <div className={cn('note-desc space-y-2', className)}>
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    );
  }

  // 편집 모드
  return (
    <div
      className={cn(
        'note-desc space-y-2 min-h-[1.5rem]',
        EDITABLE_CLASS,
        className
      )}
      contentEditable
      suppressContentEditableWarning
      data-note-path={path}
      data-note-array="true"
    >
      {lines.length === 0 ? (
        <p data-placeholder={placeholder ?? ''}>{placeholder ?? ''}</p>
      ) : (
        lines.map((line, i) => <p key={i}>{line}</p>)
      )}
    </div>
  );
}
