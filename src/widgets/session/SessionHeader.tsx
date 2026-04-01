import React from 'react';

import { useNavigate } from 'react-router-dom';

import { PenIcon } from '@/shared/icons';
import { BackButton } from '@/shared/ui';
import { formatDuration, formatKoreanDateTime } from '@/shared/utils/date';

export interface EditActions {
  label: string;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export interface TitleEditState {
  isEditing: boolean;
  editedTitle: string;
  isSaving: boolean;
  setEditedTitle: (v: string) => void;
  handleSave: () => void;
  handleCancel: () => void;
  startEditing: () => void;
}

interface SessionHeaderProps {
  title: string;
  createdAt: string;
  duration: number;
  /** 직접 입력 세션 여부 */
  isHandwritten?: boolean;
  onTitleUpdate?: (newTitle: string) => Promise<void>;
  /**
   * 렌더 변형
   * - 'full': 기본값. 뒤로가기(모바일) + 제목(편집) + 날짜
   * - 'compact-nav': 모바일 상단 고정 헤더용. 뒤로가기 + 제목 텍스트만
   * - 'meta-only': 탭 아래 콘텐츠 영역용. 제목(편집) + 날짜만 (뒤로가기 없음)
   */
  variant?: 'full' | 'compact-nav' | 'meta-only';
  /** compact-nav에서 편집 중일 때 표시할 액션 버튼 */
  editActions?: EditActions;
  /** 외부에서 제목 편집 상태 제어 (useTitleEdit 훅 결과) */
  titleEditState?: TitleEditState;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  title,
  createdAt,
  duration,
  isHandwritten = false,
  onTitleUpdate,
  variant = 'full',
  editActions,
  titleEditState: externalTitleEdit,
}) => {
  const navigate = useNavigate();

  // 내부 제목 편집 상태 (full variant 등에서 사용)
  const [internalIsEditing, setInternalIsEditing] = React.useState(false);
  const [internalEditedTitle, setInternalEditedTitle] = React.useState(title);
  const [internalIsSaving, setInternalIsSaving] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // 외부 상태가 있으면 외부, 없으면 내부
  const isEditing = externalTitleEdit?.isEditing ?? internalIsEditing;
  const editedTitle = externalTitleEdit?.editedTitle ?? internalEditedTitle;
  const isSaving = externalTitleEdit?.isSaving ?? internalIsSaving;
  const setEditedTitle =
    externalTitleEdit?.setEditedTitle ?? setInternalEditedTitle;

  React.useEffect(() => {
    if (!externalTitleEdit) setInternalEditedTitle(title);
  }, [title, externalTitleEdit]);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (externalTitleEdit) {
      externalTitleEdit.handleSave();
      return;
    }
    if (!onTitleUpdate || editedTitle.trim() === title) {
      setInternalIsEditing(false);
      setInternalEditedTitle(title);
      return;
    }
    try {
      setInternalIsSaving(true);
      await onTitleUpdate(editedTitle.trim());
      setInternalIsEditing(false);
    } catch (error) {
      console.error('제목 업데이트 실패:', error);
      setInternalEditedTitle(title);
    } finally {
      setInternalIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (externalTitleEdit) {
      externalTitleEdit.handleCancel();
      return;
    }
    setInternalEditedTitle(title);
    setInternalIsEditing(false);
  };

  const startEditing = () => {
    if (externalTitleEdit) {
      externalTitleEdit.startEditing();
      return;
    }
    setInternalIsEditing(true);
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

  // compact-nav: 모바일 상단 고정 헤더 (뒤로가기 + 제목 편집 + 액션)
  if (variant === 'compact-nav') {
    const actions = editActions;
    return (
      <div className="flex h-[67px] items-center gap-3 border-b border-grey-30 bg-white px-4 py-2.5 md:gap-7">
        <BackButton onClick={() => navigate(-1)} />
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-2 py-1 text-m font-medium text-grey-100 focus:border-green-80 focus:outline-none"
            disabled={isSaving}
          />
        ) : (
          <button
            type="button"
            onClick={onTitleUpdate ? startEditing : undefined}
            className="flex min-w-0 flex-1 items-center gap-1.5"
          >
            <h1 className="min-w-0 truncate text-m font-medium text-grey-100">
              {title}
            </h1>
            {onTitleUpdate && (
              <PenIcon size={14} className="flex-shrink-0 text-grey-60" />
            )}
          </button>
        )}
        {isEditing ? (
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="typo-sm rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-fg disabled:opacity-50"
            >
              {isSaving ? '저장 중...' : '완료'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="typo-sm rounded-lg bg-surface px-3 py-1.5 font-medium text-fg disabled:opacity-50"
            >
              취소
            </button>
          </div>
        ) : (
          actions && (
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={actions.onSave}
                disabled={actions.isSaving}
                className="typo-sm rounded-lg bg-primary px-3 py-1.5 font-medium text-primary-fg disabled:opacity-50"
              >
                {actions.isSaving ? '저장 중...' : actions.label}
              </button>
              <button
                type="button"
                onClick={actions.onCancel}
                disabled={actions.isSaving}
                className="typo-sm rounded-lg bg-surface px-3 py-1.5 font-medium text-fg disabled:opacity-50"
              >
                취소
              </button>
            </div>
          )
        )}
      </div>
    );
  }

  // meta-only: 탭 아래 메타 정보 (타임스탬프만, 좌측 정렬)
  if (variant === 'meta-only') {
    return (
      <div className="bg-grey-20 px-6 py-4 md:px-3 md:py-5">
        <span className="text-sm text-grey-70">
          {formatKoreanDateTime(new Date(createdAt))}
          {!isHandwritten && duration > 0 && ` ${formatDuration(duration)}`}
        </span>
      </div>
    );
  }

  // full (기본값): 데스크톱 전용 레이아웃
  return (
    <div className="px-4 py-4 pt-6 lg:px-8 lg:pt-12">
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
                className="rounded-lg border border-border bg-bg px-3 py-1.5 text-2xl font-emphasize focus:border-green-80 focus:outline-none focus:ring-2"
                disabled={isSaving}
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="typo-sm lg:hover:bg-primary-600 rounded-lg bg-primary px-3 py-1.5 text-primary-fg disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '완료'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="lg:hover:bg-surface-hover typo-sm rounded-lg bg-surface px-3 py-1.5 text-fg disabled:opacity-50"
              >
                취소
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-emphasize">{title}</h1>
              {onTitleUpdate && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="text-fg-muted lg:hover:text-fg"
                  aria-label="제목 수정"
                >
                  <PenIcon size={16} className="text-grey-60" />
                </button>
              )}
            </>
          )}
        </div>
        <span className="typo-sm text-fg-muted">
          {formatKoreanDateTime(new Date(createdAt))}
          {!isHandwritten && duration > 0 && ` ${formatDuration(duration)}`}
        </span>
      </div>
    </div>
  );
};
