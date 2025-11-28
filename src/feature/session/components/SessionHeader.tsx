import React from 'react';

import { formatKoreanDateTime } from '@/shared/utils/date';

interface SessionHeaderProps {
  title: string;
  createdAt: string;
  onTitleUpdate?: (newTitle: string) => Promise<void>;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  title,
  createdAt,
  onTitleUpdate,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(title);
  const [isSaving, setIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!onTitleUpdate || editedTitle.trim() === title) {
      setIsEditing(false);
      setEditedTitle(title);
      return;
    }

    try {
      setIsSaving(true);
      await onTitleUpdate(editedTitle.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('제목 업데이트 실패:', error);
      setEditedTitle(title);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedTitle(title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div className="px-8 py-4 pt-12">
      <div className="flex flex-col items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="focus:ring-primary/20 rounded-lg border border-border bg-bg px-3 py-1.5 text-2xl font-bold focus:border-primary focus:outline-none focus:ring-2"
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-600 disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '완료'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="hover:bg-surface-hover rounded-lg bg-surface px-3 py-1.5 text-sm text-fg disabled:opacity-50"
              >
                취소
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{title}</h1>
              {onTitleUpdate && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-fg-muted hover:text-fg"
                  aria-label="제목 수정"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
        <span className="text-sm text-fg-muted">
          {formatKoreanDateTime(new Date(createdAt))}
        </span>
      </div>
    </div>
  );
};
