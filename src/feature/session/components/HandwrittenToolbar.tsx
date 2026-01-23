/**
 * 직접 입력 세션 툴바 컴포넌트
 * 편집/저장/취소/복사 버튼을 포함
 */

import React from 'react';

import { Badge } from '@/components/ui/atoms/Badge';

interface HandwrittenToolbarProps {
  /** 읽기 전용 여부 */
  isReadOnly: boolean;
  /** 편집 중 여부 */
  isEditing: boolean;
  /** 저장 중 여부 */
  isSaving: boolean;
  /** 편집 시작 핸들러 */
  onEditStart: () => void;
  /** 편집 저장 핸들러 */
  onSaveEdit: () => void;
  /** 편집 취소 핸들러 */
  onCancelEdit: () => void;
  /** 복사 핸들러 */
  onCopy: () => void;
}

export const HandwrittenToolbar: React.FC<HandwrittenToolbarProps> = React.memo(
  ({
    isReadOnly,
    isEditing,
    isSaving,
    onEditStart,
    onSaveEdit,
    onCancelEdit,
    onCopy,
  }) => {
    return (
      <div className="absolute inset-x-0 right-4 top-0 flex select-none justify-end rounded-lg bg-gradient-to-t from-transparent to-slate-50">
        <div className="flex select-none items-center gap-2 overflow-hidden px-2 pt-2">
          {isReadOnly ? (
            <Badge tone="warning" variant="soft" size="sm">
              예시 - 읽기 전용
            </Badge>
          ) : isEditing ? (
            <>
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
                onClick={onSaveEdit}
                disabled={isSaving}
              >
                {isSaving ? '저장 중...' : '편집 완료'}
              </button>
              <button
                type="button"
                className="hover:bg-surface-hover rounded-lg bg-surface px-4 py-2 text-sm font-medium text-fg transition-colors"
                onClick={onCancelEdit}
                disabled={isSaving}
              >
                취소
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="mx-1 rounded-md border border-border bg-surface px-2.5 py-0.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                onClick={onEditStart}
                title="편집"
              >
                편집
              </button>
              <button
                type="button"
                className="rounded-lg p-2 text-fg-muted transition-colors hover:bg-surface hover:text-fg"
                onClick={onCopy}
                title="복사"
              >
                <svg
                  width="20"
                  height="24"
                  viewBox="0 0 20 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11 4C11 4.26522 11.1054 4.51957 11.2929 4.70711C11.4804 4.89464 11.7348 5 12 5H15.966C15.8924 4.35068 15.6074 3.74354 15.155 3.272L12.871 0.913C12.3714 0.406548 11.7085 0.0933745 11 0.029V4ZM9 4V0H5C3.67441 0.00158786 2.40356 0.528882 1.46622 1.46622C0.528882 2.40356 0.00158786 3.67441 0 5V15C0.00158786 16.3256 0.528882 17.5964 1.46622 18.5338C2.40356 19.4711 3.67441 19.9984 5 20H11C12.3256 19.9984 13.5964 19.4711 14.5338 18.5338C15.4711 17.5964 15.9984 16.3256 16 15V7H12C11.2044 7 10.4413 6.68393 9.87868 6.12132C9.31607 5.55871 9 4.79565 9 4ZM15 24H6C5.73478 24 5.48043 23.8946 5.29289 23.7071C5.10536 23.5196 5 23.2652 5 23C5 22.7348 5.10536 22.4804 5.29289 22.2929C5.48043 22.1054 5.73478 22 6 22H15C15.7956 22 16.5587 21.6839 17.1213 21.1213C17.6839 20.5587 18 19.7956 18 19V8C18 7.73478 18.1054 7.48043 18.2929 7.29289C18.4804 7.10536 18.7348 7 19 7C19.2652 7 19.5196 7.10536 19.7071 7.29289C19.8946 7.48043 20 7.73478 20 8V19C19.9984 20.3256 19.4711 21.5964 18.5338 22.5338C17.5964 23.4711 16.3256 23.9984 15 24Z"
                    fill="#BABAC0"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
);

HandwrittenToolbar.displayName = 'HandwrittenToolbar';
