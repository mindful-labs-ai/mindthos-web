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
 * - 읽기: string[] 원소들을 **한 문단**으로 합쳐 단일 `<p>`에 표시.
 *   원소 사이는 공백으로 join — 별도 단락 띄우기 없음.
 * - 편집: 컨테이너가 contentEditable. 사용자가 Enter로 단락 추가/삭제 가능.
 *   추출 시 NoteV2Renderer.extractNoteV2가 path 화이트리스트를 보고
 *   자식 `<p>` 또는 줄바꿈 기준으로 split 하여 string[]로 재구성.
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
      <p className={cn('note-desc', className)}>{lines.join(' ')}</p>
    );
  }

  // 편집 모드 — 단락별 contentEditable 유지 (추출 시 string[] 재구성)
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
